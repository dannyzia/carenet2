/**
 * Upload Service — file upload infrastructure
 *
 * In dev mode: stores files as base64 in memory / localStorage.
 * In production: uses Supabase Storage.
 */
import type { UploadedFile, DocumentCategory, CaptureMethod, DocumentExpiryAlert } from "@/backend/models";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import { USE_SUPABASE, sbWrite, sbRead, sb, currentUserId, useInAppMockDataset } from "./_sb";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

/** In-memory store for dev uploads */
let uploadedFiles: UploadedFile[] | null = null;

async function ensureUploadMock() {
  if (uploadedFiles !== null) return;
  if (!useInAppMockDataset()) {
    uploadedFiles = [];
    return;
  }
  const m = await loadMockBarrel();
  uploadedFiles = [...m.MOCK_UPLOADED_FILES];
}

const BUCKET = "uploads";

export const uploadService = {
  /**
   * Upload a file
   */
  async uploadFile(
    file: File,
    category: DocumentCategory,
    captureMethod: CaptureMethod,
    uploadedBy: string = "current-user",
    uploadedByRole: string = "caregiver",
  ): Promise<UploadedFile> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const ext = file.name.split(".").pop() || "bin";
        const path = `${userId}/${category}/${Date.now()}.${ext}`;

        const { error: upErr } = await sb().storage.from(BUCKET).upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;

        const { data: urlData } = sb().storage.from(BUCKET).getPublicUrl(path);
        const url = urlData.publicUrl;

        const uploaded: UploadedFile = {
          id: `uf-${crypto.randomUUID().slice(0, 8)}`,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          category,
          captureMethod,
          url,
          thumbnailUrl: file.type.startsWith("image/") ? url : undefined,
          uploadedBy: userId,
          uploadedByRole,
          uploadedAt: new Date().toISOString(),
          status: "completed",
        };
        return uploaded;
      });
    }

    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for file uploads.");
    }
    // Mock mode
    await ensureUploadMock();
    await delay(800 + Math.random() * 400);
    const url = await fileToDataUrl(file);
    const thumbnailUrl = file.type.startsWith("image/") ? url : undefined;

    const uploaded: UploadedFile = {
      id: `uf-${crypto.randomUUID().slice(0, 8)}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      category,
      captureMethod,
      url,
      thumbnailUrl,
      uploadedBy,
      uploadedByRole,
      uploadedAt: new Date().toISOString(),
      status: "completed",
    };

    uploadedFiles!.push(uploaded);
    return uploaded;
  },

  /**
   * Capture a photo from camera (delegates to uploadFile after capture)
   */
  async capturePhoto(
    file: File,
    category: DocumentCategory,
    uploadedBy?: string,
    uploadedByRole?: string,
  ): Promise<UploadedFile> {
    return this.uploadFile(file, category, "camera", uploadedBy, uploadedByRole);
  },

  /**
   * Delete a previously uploaded file
   */
  async deleteFile(fileId: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { data: file } = await sb().from("uploaded_files")
          .select("storage_path")
          .eq("id", fileId)
          .single();
        if (file?.storage_path) {
          await sb().storage.from(BUCKET).remove([file.storage_path]);
        }
        await sb().from("uploaded_files").delete().eq("id", fileId);
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to delete uploads.");
    }
    await delay(200);
    await ensureUploadMock();
    uploadedFiles = uploadedFiles!.filter((f) => f.id !== fileId);
  },

  /**
   * Get a file by ID (mock in-memory uploads, or Supabase caregiver_documents row by UUID)
   */
  async getFile(fileId: string): Promise<UploadedFile | undefined> {
    if (USE_SUPABASE) {
      return sbRead(`upload:file:${fileId}`, async () => {
        const { data, error } = await sb().from("caregiver_documents").select("*").eq("id", fileId).maybeSingle();
        if (error) throw error;
        if (!data) return undefined;
        const url = data.file_url || "";
        return {
          id: data.id,
          fileName: data.name,
          fileSize: Number.parseInt(String(data.file_size || "0"), 10) || 0,
          mimeType: mimeFromDocNameAndType(data.name, data.type),
          category: (data.category || "other") as DocumentCategory,
          captureMethod: (data.capture_method || "file") as CaptureMethod,
          url,
          thumbnailUrl: data.thumbnail_url || undefined,
          uploadedBy: data.caregiver_id,
          uploadedByRole: "caregiver",
          uploadedAt: data.uploaded || data.created_at,
          status: "completed",
        };
      });
    }
    await delay(100);
    await ensureUploadMock();
    const fromMemory = uploadedFiles!.find((f) => f.id === fileId);
    if (fromMemory) return fromMemory;
    return await mockCaregiverDocumentToUploadedFile(fileId);
  },

  /**
   * Get all uploaded files for a user, optionally filtered by category
   */
  async getFilesByUser(userId: string, category?: DocumentCategory): Promise<UploadedFile[]> {
    if (USE_SUPABASE) {
      return sbRead(`upload:files:${userId}:${category || "all"}`, async () => {
        let q = sb().from("uploaded_files")
          .select("*")
          .eq("uploaded_by", userId)
          .order("uploaded_at", { ascending: false });
        if (category) q = q.eq("category", category);
        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          fileName: d.file_name || d.name,
          fileSize: Number(d.file_size || 0),
          mimeType: d.mime_type || d.content_type || "application/octet-stream",
          category: (d.category || "other") as DocumentCategory,
          captureMethod: (d.capture_method || "file") as CaptureMethod,
          url: d.url || d.storage_path || "",
          thumbnailUrl: d.thumbnail_url || undefined,
          uploadedBy: d.uploaded_by,
          uploadedByRole: d.uploaded_by_role || "caregiver",
          uploadedAt: d.uploaded_at || d.created_at,
          status: d.status || "completed",
        }));
      });
    }
    await delay(200);
    await ensureUploadMock();
    let files = uploadedFiles!.filter((f) => f.uploadedBy === userId);
    if (category) files = files.filter((f) => f.category === category);
    return files;
  },

  /**
   * Get document expiry alerts for a caregiver
   */
  async getExpiringDocuments(daysAhead: number = 90): Promise<DocumentExpiryAlert[]> {
    if (USE_SUPABASE) {
      return sbRead(`expiring-docs:${daysAhead}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("caregiver_documents")
          .select("id, name, category, expiry")
          .eq("caregiver_id", userId)
          .not("expiry", "is", null);
        if (error) throw error;
        const now = Date.now();
        return (data || [])
          .map((d: any) => {
            const exp = new Date(d.expiry).getTime();
            const days = Math.ceil((exp - now) / 86400000);
            return {
              documentId: d.id,
              documentName: d.name,
              category: d.category,
              expiryDate: d.expiry,
              daysUntilExpiry: days,
              severity: days <= 0 ? "expired" : days <= 14 ? "critical" : days <= 30 ? "warning" : "info",
            } as DocumentExpiryAlert;
          })
          .filter((a) => a.daysUntilExpiry <= daysAhead);
      });
    }
    await delay(200);
    if (!useInAppMockDataset()) return [];
    const { MOCK_DOCUMENT_EXPIRY_ALERTS } = await loadMockBarrel();
    return MOCK_DOCUMENT_EXPIRY_ALERTS.filter((a) => a.daysUntilExpiry <= daysAhead);
  },
};

/** Mock-only: caregiver document list uses numeric ids; resolve to a stable public URL for the viewer. */
const MOCK_PDF_VIEW_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
const MOCK_IMAGE_VIEW_URL =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200";

async function mockCaregiverDocumentToUploadedFile(fileId: string): Promise<UploadedFile | undefined> {
  if (!useInAppMockDataset()) return undefined;
  const { MOCK_CAREGIVER_DOCUMENTS } = await loadMockBarrel();
  const cd = MOCK_CAREGIVER_DOCUMENTS.find((d) => String(d.id) === fileId);
  if (!cd) return undefined;
  const mimeType = mimeFromDocNameAndType(cd.file, cd.type);
  const url =
    mimeType === "application/pdf"
      ? MOCK_PDF_VIEW_URL
      : mimeType.startsWith("image/")
        ? MOCK_IMAGE_VIEW_URL
        : MOCK_PDF_VIEW_URL;
  return {
    id: String(cd.id),
    fileName: cd.file,
    fileSize: 0,
    mimeType,
    category: (cd.category ?? "other") as DocumentCategory,
    captureMethod: "file",
    url,
    uploadedBy: "mock-caregiver",
    uploadedByRole: "caregiver",
    uploadedAt: cd.uploaded,
    status: "completed",
  };
}

function mimeFromDocNameAndType(name: string, typeField: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  const t = String(typeField || "").toLowerCase();
  if (t.includes("pdf")) return "application/pdf";
  if (t.includes("png")) return "image/png";
  if (t.includes("jpeg") || t.includes("jpg")) return "image/jpeg";
  return "application/octet-stream";
}

/** Convert a File to a data URL (for mock storage) */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
