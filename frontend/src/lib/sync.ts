import { store, Collection } from "./storage";
import { api } from "./api";

const COLLECTIONS: Collection[] = [
  "game_sessions",
  "sticky_notes",
  "reminder_logs",
  "location_pings",
];

export async function pendingCount(): Promise<number> {
  let n = 0;
  for (const c of COLLECTIONS) n += (await store.getUnsynced(c)).length;
  return n;
}

/** Push all unsynced local records to the backend (idempotent via client IDs). */
export async function pushAll(
  patientToken: string
): Promise<{ pushed: number }> {
  const payload: Record<string, any[]> = {};
  for (const c of COLLECTIONS) payload[c] = await store.getUnsynced(c);
  const total = COLLECTIONS.reduce((s, c) => s + payload[c].length, 0);
  if (total === 0) return { pushed: 0 };
  const res = await api.syncPush(patientToken, payload);
  const accepted = res.accepted_ids || {};
  const keyFor: Record<Collection, string> = {
    game_sessions: "session_id",
    sticky_notes: "note_id",
    reminder_logs: "log_id",
    location_pings: "ping_id",
  };
  let pushed = 0;
  for (const c of COLLECTIONS) {
    const ids: string[] = accepted[c] || [];
    if (ids.length) {
      await store.markSynced(c, ids);
      pushed += ids.length;
    }
  }
  return { pushed };
}
