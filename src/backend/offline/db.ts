import Dexie, { type EntityTable } from "dexie";
import { EXPERIENCE_LOCAL_DRAFT_RETENTION_DAYS } from "@/lib/experienceSandbox";

/**
 * CareNet Offline Database — per D016 §4.2
 *
 * Three stores:
 *   1. offline_actions — queued mutations to sync when online
 *   2. cached_entities — read-cache for key entities (profiles, schedules, care plans)
 *   3. attachment_refs — metadata for offline-captured media (photos, audio)
 *
 * Drafts and queue entries are keyed by `userId` from auth — demo users use stable ids
 * (e.g. `demo-patient-1`) so Dexie data survives demo sessions when auth mode is `demo`.
 */

/* ── Types ── */

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";
export type ActionPriority = 1 | 2 | 3 | 4 | 5; // 1 = highest (care logs), 5 = lowest (analytics)

export interface OfflineAction {
  id?: number;
  idempotencyKey: string;
  createdAt: string;
  lastAttemptAt?: string;
  actionType: string;
  payload: Record<string, any>;
  status: SyncStatus;
  priority: ActionPriority;
  retryCount: number;
  userId: string;
  lastError?: string;
}

export interface CachedEntity {
  id?: number;
  entityType: string;
  entityKey: string;
  data: Record<string, any>;
  cachedAt: string;
  expiresAt: string;
  userId: string;
}

export interface AttachmentRef {
  id?: number;
  actionIdempotencyKey: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  size: number;
  createdAt: string;
  userId: string;
}

/** Persisted form draft — auto-deleted after EXPERIENCE_LOCAL_DRAFT_RETENTION_DAYS (see `@/lib/experienceSandbox`) */
export interface FormDraft {
  id?: number;
  formKey: string;
  data: Record<string, any>;
  userId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

const FORM_DRAFT_TTL_MS = EXPERIENCE_LOCAL_DRAFT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/* ── Database ── */

class CareNetDB extends Dexie {
  offlineActions!: EntityTable<OfflineAction, "id">;
  cachedEntities!: EntityTable<CachedEntity, "id">;
  attachmentRefs!: EntityTable<AttachmentRef, "id">;
  formDrafts!: EntityTable<FormDraft, "id">;

  constructor() {
    super("CareNetOfflineDB");

    this.version(1).stores({
      offlineActions:
        "++id, idempotencyKey, actionType, status, priority, userId, createdAt",
      cachedEntities:
        "++id, [entityType+entityKey], entityType, userId, expiresAt",
      attachmentRefs:
        "++id, actionIdempotencyKey, userId",
    });

    this.version(2).stores({
      offlineActions:
        "++id, idempotencyKey, actionType, status, priority, userId, createdAt",
      cachedEntities:
        "++id, [entityType+entityKey], entityType, userId, expiresAt",
      attachmentRefs:
        "++id, actionIdempotencyKey, userId",
      formDrafts:
        "++id, [formKey+userId], formKey, userId, expiresAt",
    });
  }
}

export const db = new CareNetDB();

/* ── Helpers ── */

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function queueOfflineAction(
  actionType: string,
  payload: Record<string, any>,
  userId: string,
  priority: ActionPriority = 3
): Promise<number> {
  return db.offlineActions.add({
    idempotencyKey: generateIdempotencyKey(),
    createdAt: new Date().toISOString(),
    actionType,
    payload,
    status: "pending",
    priority,
    retryCount: 0,
    userId,
  });
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  return db.offlineActions
    .where("status")
    .equals("pending")
    .sortBy("priority");
}

export async function getPendingCount(): Promise<number> {
  return db.offlineActions.where("status").anyOf(["pending", "failed"]).count();
}

export async function markSynced(id: number): Promise<void> {
  await db.offlineActions.update(id, { status: "synced", lastAttemptAt: new Date().toISOString() });
}

export async function markFailed(id: number, error: string): Promise<void> {
  const action = await db.offlineActions.get(id);
  if (action) {
    await db.offlineActions.update(id, {
      status: "failed",
      lastAttemptAt: new Date().toISOString(),
      retryCount: action.retryCount + 1,
      lastError: error,
    });
  }
}

export async function cacheEntity(
  entityType: string,
  entityKey: string,
  data: Record<string, any>,
  userId: string,
  ttlMinutes: number = 60
): Promise<void> {
  const existing = await db.cachedEntities
    .where("[entityType+entityKey]")
    .equals([entityType, entityKey])
    .first();

  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  if (existing?.id) {
    await db.cachedEntities.update(existing.id, {
      data,
      cachedAt: new Date().toISOString(),
      expiresAt,
    });
  } else {
    await db.cachedEntities.add({
      entityType,
      entityKey,
      data,
      cachedAt: new Date().toISOString(),
      expiresAt,
      userId,
    });
  }
}

export async function getCachedEntity(
  entityType: string,
  entityKey: string
): Promise<Record<string, any> | null> {
  const entity = await db.cachedEntities
    .where("[entityType+entityKey]")
    .equals([entityType, entityKey])
    .first();

  if (!entity) return null;
  if (new Date(entity.expiresAt) < new Date()) {
    if (entity.id) await db.cachedEntities.delete(entity.id);
    return null;
  }
  return entity.data;
}

export async function purgeExpiredCache(): Promise<number> {
  const now = new Date().toISOString();
  const expired = await db.cachedEntities
    .where("expiresAt")
    .below(now)
    .toArray();
  const ids = expired.map((e) => e.id).filter((id): id is number => id !== undefined);
  await db.cachedEntities.bulkDelete(ids);
  return ids.length;
}

export async function purgeSyncedActions(olderThanHours: number = 24): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
  const old = await db.offlineActions
    .where("status")
    .equals("synced")
    .filter((a) => a.createdAt < cutoff)
    .toArray();
  const ids = old.map((a) => a.id).filter((id): id is number => id !== undefined);
  await db.offlineActions.bulkDelete(ids);
  return ids.length;
}

/* ── Form Draft Helpers ── */

export async function saveFormDraft(
  formKey: string,
  data: Record<string, any>,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + FORM_DRAFT_TTL_MS).toISOString();

  const existing = await db.formDrafts
    .where("[formKey+userId]")
    .equals([formKey, userId])
    .first();

  if (existing?.id) {
    await db.formDrafts.update(existing.id, { data, updatedAt: now, expiresAt });
  } else {
    await db.formDrafts.add({ formKey, data, userId, createdAt: now, updatedAt: now, expiresAt });
  }
}

export async function getFormDraft(
  formKey: string,
  userId: string
): Promise<Record<string, any> | null> {
  const draft = await db.formDrafts
    .where("[formKey+userId]")
    .equals([formKey, userId])
    .first();

  if (!draft) return null;
  if (new Date(draft.expiresAt) < new Date()) {
    if (draft.id) await db.formDrafts.delete(draft.id);
    return null;
  }
  return draft.data;
}

export async function deleteFormDraft(
  formKey: string,
  userId: string
): Promise<void> {
  const draft = await db.formDrafts
    .where("[formKey+userId]")
    .equals([formKey, userId])
    .first();
  if (draft?.id) await db.formDrafts.delete(draft.id);
}

export async function purgeExpiredDrafts(): Promise<number> {
  const now = new Date().toISOString();
  const expired = await db.formDrafts
    .where("expiresAt")
    .below(now)
    .toArray();
  const ids = expired.map((d) => d.id).filter((id): id is number => id !== undefined);
  await db.formDrafts.bulkDelete(ids);
  return ids.length;
}