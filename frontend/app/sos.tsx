import { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { AppText, BigButton, Card, Screen } from "@/components/UI";
import { useSession } from "@/lib/session";
import { getPosition, triggerSos, sendSosDetail } from "@/lib/safety";
import { api } from "@/lib/api";
import { sarvamCode, speak } from "@/lib/voice";
import { colors, radii, space, type } from "@/theme";

type Phase = "countdown" | "active" | "done";

export default function Sos() {
  const { t } = useTranslation();
  const router = useRouter();
  const { device, online, language } = useSession();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<Phase>("countdown");
  const [count, setCount] = useState(3);
  const [sosId, setSosId] = useState<string | null>(null);
  const [detailText, setDetailText] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelledRef = useRef(false);

  // Stage 1 countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      fireStage1();
      return;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count, phase]);

  async function fireStage1() {
    if (cancelledRef.current || !device) return;
    setPhase("active");
    const point = await getPosition();
    const id = await triggerSos(device.token, device.patientId, point);
    setSosId(id);
    speak(t("sos.stage1"), language, { online, patientToken: device.token });
  }

  function cancel() {
    cancelledRef.current = true;
    router.back();
  }

  async function toggleMic() {
    if (busy || !device) return;
    if (!recording) {
      try {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) return;
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setRecording(true);
      } catch {
        /* ignore, typing still works */
      }
      return;
    }
    setRecording(false);
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri && online && device.token) {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        const b64: string = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
        const r = await api.voiceAsr(device.token, b64, sarvamCode(language));
        if (r.transcribed_text) setDetailText(r.transcribed_text);
      }
    } catch {
      /* typing fallback */
    } finally {
      setBusy(false);
    }
  }

  async function sendDetail() {
    if (!device || !sosId) return;
    await sendSosDetail(device.token, sosId, detailText.trim() || null);
    setPhase("done");
    speak(t("sos.sent"), language, { online, patientToken: device.token });
  }

  return (
    <Screen scroll={false} testID="sos-screen">
      {phase === "countdown" && (
        <View style={styles.center}>
          <View style={[styles.ring, { borderColor: colors.danger }]}>
            <AppText testID="sos-count" size={72} weight="700" color={colors.danger}>{count}</AppText>
          </View>
          <AppText size={type.heading} weight="700" style={{ textAlign: "center" }}>
            {t("sos.countdown", { n: count })}
          </AppText>
          <BigButton testID="sos-cancel" label={t("sos.cancel")} variant="secondary" icon="close" onPress={cancel} />
        </View>
      )}

      {phase === "active" && (
        <View style={styles.center}>
          <Ionicons name="warning" size={64} color={colors.danger} />
          <Card style={{ backgroundColor: colors.dangerBg, borderColor: colors.danger }}>
            <AppText testID="sos-stage1" size={type.cardTitle} weight="700" style={{ textAlign: "center" }}>
              {t("sos.stage1")}
            </AppText>
          </Card>
          <AppText size={type.body} weight="600" style={{ textAlign: "center" }}>{t("sos.tellMe")}</AppText>
          <BigButton
            testID="sos-mic"
            label={recording ? t("sos.recording") : t("sos.recordBtn")}
            icon={recording ? "stop-circle" : "mic"}
            variant={recording ? "danger" : "primary"}
            loading={busy}
            onPress={toggleMic}
          />
          <TextInput
            testID="sos-detail-input"
            value={detailText}
            onChangeText={setDetailText}
            placeholder={t("sos.tellMe")}
            placeholderTextColor={colors.stone}
            style={styles.input}
          />
          <BigButton testID="sos-send-detail" label={t("sos.send")} icon="send" variant="success" onPress={sendDetail} />
          <BigButton testID="sos-safe" label={t("sos.safeNow")} variant="secondary" onPress={() => router.replace("/home")} />
        </View>
      )}

      {phase === "done" && (
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <AppText testID="sos-sent" size={type.heading} weight="700" style={{ textAlign: "center" }}>{t("sos.sent")}</AppText>
          <BigButton testID="sos-home" label={t("sos.safeNow")} icon="home" onPress={() => router.replace("/home")} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", gap: space.lg, padding: space.md },
  ring: {
    width: 160, height: 160, borderRadius: 80, borderWidth: 8,
    justifyContent: "center", alignItems: "center", alignSelf: "center",
  },
  input: {
    minHeight: 56, borderWidth: 1, borderColor: colors.gunmetal, borderRadius: radii.input,
    paddingHorizontal: space.md, fontSize: type.body, color: colors.inkBlack, backgroundColor: colors.pureWhite,
  },
});
