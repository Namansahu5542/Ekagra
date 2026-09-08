import * as Location from "expo-location";
import { store } from "./storage";
import { api } from "./api";
import { nowIso, uuid } from "./ids";

export interface Point {
  lat: number;
  long: number;
}

export async function getPosition(): Promise<Point | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, long: pos.coords.longitude };
  } catch {
    return null;
  }
}

// Haversine distance in metres.
export function distanceM(a: Point, b: Point): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.long - a.long);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isOutsideSafeZone(safeZone: any, point: Point): boolean {
  if (!safeZone || typeof safeZone.lat !== "number") return false;
  return distanceM({ lat: safeZone.lat, long: safeZone.long }, point) > (safeZone.radius_m || 200);
}

export async function recordPing(patientId: string, point: Point, batteryPct = 100) {
  const rec = {
    ping_id: uuid(),
    patient_id: patientId,
    lat: point.lat,
    long: point.long,
    recorded_at: nowIso(),
    battery_pct: batteryPct,
    synced: false,
  };
  await store.upsert("location_pings", rec.ping_id, rec);
  return rec;
}

// --- Geofence breach (deduplicated locally to avoid alert spam) ---
export async function reportBreach(
  token: string | null,
  patientId: string,
  point: Point
): Promise<boolean> {
  const lastKey = "geofence_last_breach";
  const last = await store.kvGet(lastKey);
  const now = Date.now();
  if (last && now - parseInt(last, 10) < 60000) return false; // once per minute max
  await store.kvSet(lastKey, String(now));
  if (!token) return false;
  try {
    await api.geofenceBreach(token, {
      patient_id: patientId,
      location: point,
      recorded_at: nowIso(),
    });
    return true;
  } catch {
    return false;
  }
}

// --- SOS with offline outbox ---
const OUTBOX = "sos_outbox";

async function readOutbox(): Promise<any[]> {
  const raw = await store.kvGet(OUTBOX);
  return raw ? JSON.parse(raw) : [];
}
async function writeOutbox(list: any[]) {
  await store.kvSet(OUTBOX, JSON.stringify(list));
}

export async function triggerSos(
  token: string | null,
  patientId: string,
  point: Point | null
): Promise<string> {
  const sosAlertId = uuid();
  const payload = {
    sos_alert_id: sosAlertId,
    patient_id: patientId,
    triggered_at: nowIso(),
    location: point,
  };
  if (token) {
    try {
      await api.sosTrigger(token, payload);
      return sosAlertId;
    } catch {
      // fall through to queue
    }
  }
  const box = await readOutbox();
  box.push({ type: "trigger", payload });
  await writeOutbox(box);
  return sosAlertId;
}

export async function sendSosDetail(
  token: string | null,
  sosAlertId: string,
  transcribedText: string | null
) {
  const payload = { transcribed_text: transcribedText, raw_audio_url: null };
  if (token) {
    try {
      await api.sosDetail(token, sosAlertId, payload);
      return;
    } catch {
      /* queue below */
    }
  }
  const box = await readOutbox();
  box.push({ type: "detail", sosAlertId, payload });
  await writeOutbox(box);
}

export async function flushSos(token: string | null): Promise<number> {
  if (!token) return 0;
  const box = await readOutbox();
  if (!box.length) return 0;
  const remaining: any[] = [];
  let flushed = 0;
  for (const item of box) {
    try {
      if (item.type === "trigger") await api.sosTrigger(token, item.payload);
      else if (item.type === "detail") await api.sosDetail(token, item.sosAlertId, item.payload);
      flushed++;
    } catch {
      remaining.push(item);
    }
  }
  await writeOutbox(remaining);
  return flushed;
}
