import { useEffect, useRef } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton } from "@/components/UI";
import { useSession } from "@/lib/session";
import { speak, stopSpeaking } from "@/lib/voice";
import { colors, space, type } from "@/theme";

/** Full-screen emergency alarm shown when the patient leaves the safe zone. */
export function AlarmOverlay() {
  const { t } = useTranslation();
  const { alarmActive, dismissAlarm, language } = useSession();
  const beepRef = useRef<any>(null);

  useEffect(() => {
    if (!alarmActive) return;
    speak(`${t("alarm.title")}. ${t("alarm.body")}`, language, { online: false, patientToken: null });

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const play = () => {
        try {
          const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (!AC) return;
          const ctx = new AC();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "square";
          osc.frequency.value = 880;
          gain.gain.value = 0.18;
          osc.start();
          setTimeout(() => {
            try { osc.stop(); ctx.close(); } catch {}
          }, 450);
        } catch {}
      };
      play();
      beepRef.current = setInterval(play, 1100);
    }
    return () => {
      if (beepRef.current) clearInterval(beepRef.current);
      beepRef.current = null;
    };
  }, [alarmActive, language, t]);

  function stop() {
    if (beepRef.current) clearInterval(beepRef.current);
    beepRef.current = null;
    stopSpeaking();
    dismissAlarm();
  }

  return (
    <Modal visible={alarmActive} transparent animationType="fade" onRequestClose={stop}>
      <View style={styles.overlay} testID="alarm-overlay">
        <Ionicons name="warning" size={96} color={colors.pureWhite} />
        <AppText size={type.title} weight="700" color={colors.pureWhite} style={styles.center}>
          {t("alarm.title")}
        </AppText>
        <AppText size={type.body} color={colors.pureWhite} style={styles.center}>
          {t("alarm.body")}
        </AppText>
        <View style={styles.btn}>
          <BigButton testID="alarm-stop" label={t("alarm.stop")} icon="checkmark-circle" variant="secondary" onPress={stop} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
    padding: space.xl,
    gap: space.lg,
  },
  center: { textAlign: "center" },
  btn: { alignSelf: "stretch", marginTop: space.lg },
});
