import { Platform } from "react-native";

/**
 * Offline-first local store.
 * - Native (iOS/Android): SQLite via expo-sqlite (the on-device backbone).
 * - Web (preview): localStorage fallback so the app is fully runnable in-browser.
 * Same async interface either way; screens never touch the backend directly.
 */

export type Row = Record<string, any>;
export type Collection =
  | "game_sessions"
  | "sticky_notes"
  | "reminder_logs"
  | "location_pings";

interface Store {
  upsert(collection: Collection, id: string, obj: Row): Promise<void>;
  getAll(collection: Collection): Promise<Row[]>;
  getUnsynced(collection: Collection): Promise<Row[]>;
  markSynced(collection: Collection, ids: string[]): Promise<void>;
  kvGet(key: string): Promise<string | null>;
  kvSet(key: string, value: string): Promise<void>;
  kvDel(key: string): Promise<void>;
}

// ---------------- Web (localStorage) ----------------
class WebStore implements Store {
  private key(c: string) {
    return `cc:${c}`;
  }
  private read(c: string): Row[] {
    try {
      return JSON.parse(localStorage.getItem(this.key(c)) || "[]");
    } catch {
      return [];
    }
  }
  private write(c: string, rows: Row[]) {
    localStorage.setItem(this.key(c), JSON.stringify(rows));
  }
  async upsert(c: Collection, id: string, obj: Row) {
    const rows = this.read(c);
    const idx = rows.findIndex((r) => r.__id === id);
    const rec = { ...obj, __id: id, synced: obj.synced ?? false };
    if (idx >= 0) rows[idx] = rec;
    else rows.push(rec);
    this.write(c, rows);
  }
  async getAll(c: Collection) {
    return this.read(c).map(({ __id, ...r }) => r);
  }
  async getUnsynced(c: Collection) {
    return this.read(c)
      .filter((r) => !r.synced)
      .map(({ __id, ...r }) => r);
  }
  async markSynced(c: Collection, ids: string[]) {
    const rows = this.read(c);
    const idset = new Set(ids);
    for (const r of rows) if (idset.has(r.__id)) r.synced = true;
    this.write(c, rows);
  }
  async kvGet(k: string) {
    return localStorage.getItem(`cc:kv:${k}`);
  }
  async kvSet(k: string, v: string) {
    localStorage.setItem(`cc:kv:${k}`, v);
  }
  async kvDel(k: string) {
    localStorage.removeItem(`cc:kv:${k}`);
  }
}

// ---------------- Native (expo-sqlite) ----------------
class NativeStore implements Store {
  private db: any = null;
  private async open() {
    if (this.db) return this.db;
    const SQLite = require("expo-sqlite");
    this.db = await SQLite.openDatabaseAsync("carecompanion.db");
    await this.db.execAsync(
      `CREATE TABLE IF NOT EXISTS records (collection TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, synced INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (collection, id));
       CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`
    );
    return this.db;
  }
  async upsert(c: Collection, id: string, obj: Row) {
    const db = await this.open();
    await db.runAsync(
      "INSERT OR REPLACE INTO records (collection, id, data, synced) VALUES (?, ?, ?, ?)",
      c,
      id,
      JSON.stringify(obj),
      obj.synced ? 1 : 0
    );
  }
  async getAll(c: Collection) {
    const db = await this.open();
    const rows = await db.getAllAsync("SELECT data FROM records WHERE collection = ?", c);
    return rows.map((r: any) => JSON.parse(r.data));
  }
  async getUnsynced(c: Collection) {
    const db = await this.open();
    const rows = await db.getAllAsync(
      "SELECT data FROM records WHERE collection = ? AND synced = 0",
      c
    );
    return rows.map((r: any) => JSON.parse(r.data));
  }
  async markSynced(c: Collection, ids: string[]) {
    if (!ids.length) return;
    const db = await this.open();
    for (const id of ids) {
      const cur = await db.getFirstAsync(
        "SELECT data FROM records WHERE collection = ? AND id = ?",
        c,
        id
      );
      const data = cur ? { ...JSON.parse(cur.data), synced: true } : { synced: true };
      await db.runAsync(
        "UPDATE records SET synced = 1, data = ? WHERE collection = ? AND id = ?",
        JSON.stringify(data),
        c,
        id
      );
    }
  }
  async kvGet(k: string) {
    const db = await this.open();
    const row = await db.getFirstAsync("SELECT value FROM kv WHERE key = ?", k);
    return row ? row.value : null;
  }
  async kvSet(k: string, v: string) {
    const db = await this.open();
    await db.runAsync("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", k, v);
  }
  async kvDel(k: string) {
    const db = await this.open();
    await db.runAsync("DELETE FROM kv WHERE key = ?", k);
  }
}

export const store: Store = Platform.OS === "web" ? new WebStore() : new NativeStore();
