/**
 * Vitest global setup: IndexedDB shim for Dexie in node/jsdom.
 * Must load before any module that constructs Dexie databases.
 */
import "fake-indexeddb/auto";
