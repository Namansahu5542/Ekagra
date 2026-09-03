import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import i18n from "@/i18n";
import { store } from "@/lib/storage";
import { api } from "@/lib/api";
import { pinHash } from "@/lib/ids";
import { pushAll, pendingCount } from "@/lib/sync";
import { getPosition, recordPing, isOutsideSafeZone, reportBreach, flushSos } from "@/lib/safety";

type Device = {
  patientId: string;
  profile: any;
  token: string | null;
  pinHash: string;
};

type Ctx = {
  ready: boolean;
  device: Device | null;
  unlocked: boolean;
  online: boolean;
  language: string;
  pending: number;
  lastSynced: string | null;
  completeSetup: (d: {
    patientId: string;
    profile: any;
    token: string | null;
    pin: string;
  }) => Promise<void>;
  tryUnlock: (pin: string) => boolean;
  lock: () => void;
  reset: () => Promise<void>;
  setLanguage: (lng: string) => Promise<void>;
  syncNow: () => Promise<number>;
  refreshPending: () => Promise<void>;
};

const SessionContext = createContext<Ctx>(null as any);
export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [online, setOnline] = useState(true);
  const [language, setLang] = useState("en");
  const [pending, setPending] = useState(0);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await store.kvGet("device");
      if (raw) {
        const d = JSON.parse(raw) as Device;
        setDevice(d);
        const lng = d.profile?.preferred_language || "en";
        setLang(lng);
        i18n.changeLanguage(lng);
      }
      setLastSynced(await store.kvGet("lastSynced"));
      setPending(await pendingCount());
      setReady(true);
    })();
  }, []);

  // Online detection
  const checkOnline = useCallback(async () => {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(t);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    checkOnline();
    const id = setInterval(checkOnline, 20000);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      window.addEventListener("online", on);
      window.addEventListener("offline", off);
      return () => {
        clearInterval(id);
        window.removeEventListener("online", on);
        window.removeEventListener("offline", off);
      };
    }
    return () => clearInterval(id);
  }, [checkOnline]);

  const refreshPending = useCallback(async () => {
    setPending(await pendingCount());
  }, []);

  const syncNow = useCallback(async (): Promise<number> => {
    if (!device?.token || !online) {
      await refreshPending();
      return 0;
    }
    try {
      const { pushed } = await pushAll(device.token);
      await flushSos(device.token);
      const ts = new Date().toISOString();
      await store.kvSet("lastSynced", ts);
      setLastSynced(ts);
      await refreshPending();
      return pushed;
    } catch {
      await refreshPending();
      return 0;
    }
  }, [device, online, refreshPending]);

  // Auto-sync when online + unlocked
  useEffect(() => {
    if (online && unlocked && device?.token) syncNow();
  }, [online, unlocked, device?.token]);

  // Foreground location tracking + safe-zone geofence (adaptive interval).
  useEffect(() => {
    if (!unlocked || !device) return;
    let cancelled = false;
    let lastPoint: { lat: number; long: number } | null = null;
    async function tick() {
      const point = await getPosition();
      if (cancelled || !point || !device) return;
      await recordPing(device.patientId, point);
      lastPoint = point;
      if (isOutsideSafeZone(device.profile?.safe_zone, point) && online) {
        await reportBreach(device.token, device.patientId, point);
      }
    }
    tick();
    // Poll every 20s when moving stays responsive; battery-friendly cadence.
    const id = setInterval(tick, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [unlocked, device, online]);

  const completeSetup: Ctx["completeSetup"] = useCallback(async (d) => {
    const dev: Device = {
      patientId: d.patientId,
      profile: d.profile,
      token: d.token,
      pinHash: pinHash(d.pin),
    };
    await store.kvSet("device", JSON.stringify(dev));
    setDevice(dev);
    const lng = d.profile?.preferred_language || "en";
    setLang(lng);
    i18n.changeLanguage(lng);
    setUnlocked(true);
  }, []);

  const tryUnlock = useCallback(
    (pin: string) => {
      if (!device) return false;
      if (pinHash(pin) === device.pinHash) {
        setUnlocked(true);
        return true;
      }
      return false;
    },
    [device]
  );

  const lock = useCallback(() => setUnlocked(false), []);

  const reset = useCallback(async () => {
    await store.kvDel("device");
    setDevice(null);
    setUnlocked(false);
  }, []);

  const setLanguage = useCallback(
    async (lng: string) => {
      setLang(lng);
      i18n.changeLanguage(lng);
      if (device) {
        const updated = {
          ...device,
          profile: { ...device.profile, preferred_language: lng },
        };
        await store.kvSet("device", JSON.stringify(updated));
        setDevice(updated);
      }
    },
    [device]
  );

  const value = useMemo(
    () => ({
      ready,
      device,
      unlocked,
      online,
      language,
      pending,
      lastSynced,
      completeSetup,
      tryUnlock,
      lock,
      reset,
      setLanguage,
      syncNow,
      refreshPending,
    }),
    [ready, device, unlocked, online, language, pending, lastSynced, completeSetup, tryUnlock, lock, reset, setLanguage, syncNow, refreshPending]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
