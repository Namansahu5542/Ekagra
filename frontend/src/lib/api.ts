const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";
export const API = `${BASE}/api/v1`;

async function request(path: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const detail = body && body.detail ? body.detail : `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return body;
}

export const api = {
  caregiverSignup: (email: string, password: string) =>
    request("/auth/caregiver/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  caregiverLogin: (email: string, password: string) =>
    request("/auth/caregiver/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  createProfile: (token: string, profile: any) =>
    request("/patient-profile/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(profile),
    }),
  listMyPatients: (token: string) =>
    request("/patient-profile/mine", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getProfileAsCaregiver: (token: string, patientId: string) =>
    request(`/patient-profile/${patientId}/as-caregiver`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  verifyPin: (patientId: string, pin: string) =>
    request("/auth/patient/verify-pin", {
      method: "POST",
      body: JSON.stringify({ patient_id: patientId, pin }),
    }),
  syncPush: (patientToken: string, payload: any) =>
    request("/sync/push", {
      method: "POST",
      headers: { "X-Patient-PIN-Token": patientToken },
      body: JSON.stringify(payload),
    }),
  syncPull: (patientToken: string, patientId: string, since?: string) =>
    request(
      `/sync/pull?patient_id=${encodeURIComponent(patientId)}${
        since ? `&since=${encodeURIComponent(since)}` : ""
      }`,
      { headers: { "X-Patient-PIN-Token": patientToken } }
    ),
  voiceAsr: (patientToken: string, audioBase64: string, sourceLanguage: string) =>
    request("/voice/asr", {
      method: "POST",
      headers: { "X-Patient-PIN-Token": patientToken },
      body: JSON.stringify({ audio_base64: audioBase64, source_language: sourceLanguage }),
    }),
  voiceTts: (patientToken: string, text: string, targetLanguage: string) =>
    request("/voice/tts", {
      method: "POST",
      headers: { "X-Patient-PIN-Token": patientToken },
      body: JSON.stringify({ text, target_language: targetLanguage }),
    }),
  sosTrigger: (patientToken: string, payload: any) =>
    request("/sos/trigger", {
      method: "POST",
      headers: { "X-Patient-PIN-Token": patientToken },
      body: JSON.stringify(payload),
    }),
  sosDetail: (patientToken: string, sosAlertId: string, payload: any) =>
    request(`/sos/${sosAlertId}/detail`, {
      method: "PATCH",
      headers: { "X-Patient-PIN-Token": patientToken },
      body: JSON.stringify(payload),
    }),
  geofenceBreach: (patientToken: string, payload: any) =>
    request("/alerts/geofence", {
      method: "POST",
      headers: { "X-Patient-PIN-Token": patientToken },
      body: JSON.stringify(payload),
    }),
  health: () => request("/health"),
};

export { request };
