// Small dependency-free helpers for offline IDs and PIN hashing.

export function uuid(): string {
  // RFC4122-ish v4, good enough for client-generated record IDs.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Non-cryptographic hash for offline PIN comparison on-device only.
export function pinHash(pin: string): string {
  let h = 2166136261;
  const salt = "carecompanion:v1:";
  const s = salt + pin;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function nowIso(): string {
  return new Date().toISOString();
}
