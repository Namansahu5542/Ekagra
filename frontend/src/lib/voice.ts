import { Platform } from "react-native";
import * as Speech from "expo-speech";
import { api } from "./api";

// App language (as/mni/hi/bn/en) -> Sarvam BCP-47 codes.
const SARVAM_LANG: Record<string, string> = {
  as: "as-IN",
  mni: "mni-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  en: "en-IN",
};
// Sarvam Bulbul TTS supports only these; others fall back to on-device speech.
const TTS_ONLINE = new Set(["hi", "bn", "en"]);
const SPEECH_LOCALE: Record<string, string> = {
  as: "as-IN",
  mni: "hi-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  en: "en-IN",
};

export function sarvamCode(appLang: string): string {
  return SARVAM_LANG[appLang] || "en-IN";
}

function playBase64Wav(b64: string) {
  if (Platform.OS === "web") {
    const audio = new Audio(`data:audio/wav;base64,${b64}`);
    audio.play().catch(() => {});
  }
}

/** Speak text: prefer Sarvam AI (via backend proxy) when online+supported, else on-device. */
export async function speak(
  text: string,
  appLang: string,
  ctx: { online: boolean; patientToken: string | null }
) {
  if (ctx.online && ctx.patientToken && TTS_ONLINE.has(appLang) && Platform.OS === "web") {
    try {
      const res = await api.voiceTts(ctx.patientToken, text, sarvamCode(appLang));
      if (res && res.audio_base64) {
        playBase64Wav(res.audio_base64);
        return;
      }
    } catch {
      // fall through to on-device fallback
    }
  }
  try {
    Speech.stop();
    Speech.speak(text, { language: SPEECH_LOCALE[appLang] || "en-IN", rate: 0.92 });
  } catch {
    // no-op
  }
}

export function stopSpeaking() {
  try {
    Speech.stop();
  } catch {}
}

export type Intent =
  | "play_game"
  | "next_reminder"
  | "today_schedule"
  | "call_caregiver"
  | "sos"
  | "unknown";

// Deterministic, rule-based intent matcher (EN + HI keywords). No LLM.
export function matchIntent(input: string): { intent: Intent } {
  const t = input.toLowerCase();
  const has = (arr: string[]) => arr.some((k) => t.includes(k));
  if (has(["help", "emergency", "danger", "lost", "hurt", "scared", "बचाओ", "मदद"]))
    return { intent: "sos" };
  if (has(["game", "play", "खेल", "गेम"])) return { intent: "play_game" };
  if (has(["remind", "medicine", "water", "next", "दवा", "पानी", "याद"]))
    return { intent: "next_reminder" };
  if (has(["today", "schedule", "activities", "आज", "दिनचर्या"]))
    return { intent: "today_schedule" };
  if (has(["call", "family", "caregiver", "फोन", "परिवार", "बुलाओ"]))
    return { intent: "call_caregiver" };
  return { intent: "unknown" };
}
