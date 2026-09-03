import { useState } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { AppText, BigButton, Card, Header, Screen } from "@/components/UI";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { matchIntent, sarvamCode, speak, Intent } from "@/lib/voice";
import { colors, radii, space, type } from "@/theme";

export default function Voice() {
  const { t } = useTranslation();
  const router = useRouter();
  const { device, online, language } = useSession();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);

  function respondTo(intent: Intent) {
    const msg = t(`voice.replies.${intent}` as any);
    setReply(msg);
    speak(msg, language, { online, patientToken: device?.token || null });
    if (intent === "play_game") setTimeout(() => router.push("/games"), 900);
    if (intent === "next_reminder" || intent === "today_schedule")
      setTimeout(() => router.push("/reminders"), 900);
  }

  function ask() {
    if (!text.trim()) return;
    respondTo(matchIntent(text).intent);
  }

  async function toggleMic() {
    if (busy) return;
    if (!recording) {
      try {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          setReply("Microphone permission is needed. You can type instead.");
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setRecording(true);
      } catch {
        setReply("Recording is unavailable here. Please type your request.");
      }
      return;
    }
    // stop + transcribe
    setRecording(false);
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri || !online || !device?.token) throw new Error("no-uri-or-offline");
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const b64: string = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
      const r = await api.voiceAsr(device.token, b64, sarvamCode(language));
      const transcript = r.transcribed_text || "";
      setText(transcript);
      if (transcript) respondTo(matchIntent(transcript).intent);
    } catch {
      setReply("I couldn't hear that. Please type your request below.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen testID="voice-screen" showSos>
      <Header title={t("voice.title")} />

      <Card style={{ alignItems: "center", gap: space.md, paddingVertical: space.xl }}>
        <BigButton
          testID="voice-mic"
          label={recording ? t("voice.listening") : t("voice.speak")}
          icon={recording ? "stop-circle" : "mic"}
          variant={recording ? "danger" : "primary"}
          loading={busy}
          onPress={toggleMic}
        />
        {Platform.OS === "web" && (
          <AppText size={type.helper} color={colors.warmGray} style={{ textAlign: "center" }}>
            {t("voice.prompt")}
          </AppText>
        )}
      </Card>

      <Card>
        <AppText size={type.helper} weight="600" style={{ marginBottom: 6 }}>{t("voice.prompt")}</AppText>
        <TextInput
          testID="voice-input"
          value={text}
          onChangeText={setText}
          placeholder={t("voice.placeholder")}
          placeholderTextColor={colors.stone}
          style={styles.input}
          onSubmitEditing={ask}
        />
        <BigButton testID="voice-ask" label={t("voice.ask")} icon="arrow-forward" onPress={ask} disabled={!text.trim()} />
      </Card>

      {reply && (
        <Card testID="voice-reply" style={{ backgroundColor: colors.successBg, borderColor: colors.success, flexDirection: "row", gap: space.sm, alignItems: "center" }}>
          <Ionicons name="chatbubble-ellipses" size={26} color={colors.success} />
          <AppText size={type.body} style={{ flex: 1 }}>{reply}</AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.gunmetal,
    borderRadius: radii.input,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.inkBlack,
    marginBottom: space.md,
    backgroundColor: colors.pureWhite,
  },
});
