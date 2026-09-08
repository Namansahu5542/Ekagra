import { store } from "./storage";
import { nowIso, uuid } from "./ids";

export type ReminderStatus = "pending" | "completed" | "skipped" | "missed" | "unanswered";

export interface TodayReminder {
  key: string;
  type: string;
  title: string;
  time: string; // HH:MM
  scheduledAt: string; // ISO
  status: ReminderStatus;
  logId: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function scheduledAtIso(time: string): string {
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

function deterministicLogId(type: string, time: string): string {
  return `${todayKey()}:${type}:${time}`;
}

export async function buildToday(profile: any): Promise<TodayReminder[]> {
  const templates: any[] = profile?.reminder_templates || [];
  const logs = await store.getAll("reminder_logs");
  const byId = new Map(logs.map((l: any) => [l.log_id, l]));
  return templates
    .map((tpl) => {
      const time = tpl.scheduled_time;
      const logId = deterministicLogId(tpl.type, time);
      const existing = byId.get(logId);
      return {
        key: logId,
        type: tpl.type,
        title: tpl.title,
        time,
        scheduledAt: scheduledAtIso(time),
        status: (existing?.status as ReminderStatus) || "pending",
        logId,
      } as TodayReminder;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function currentOrNext(items: TodayReminder[]): TodayReminder | null {
  const now = new Date();
  const pending = items.filter((i) => i.status === "pending");
  const due = pending.filter((i) => new Date(i.scheduledAt) <= now);
  if (due.length) return due[due.length - 1];
  if (pending.length) return pending[0];
  return null;
}

export async function setReminderStatus(
  patientId: string,
  item: TodayReminder,
  status: ReminderStatus
) {
  const rec = {
    log_id: item.logId || uuid(),
    patient_id: patientId,
    reminder_type: item.type,
    scheduled_at: item.scheduledAt,
    status,
    responded_at: nowIso(),
    synced: false,
  };
  await store.upsert("reminder_logs", rec.log_id, rec);
  return rec;
}
