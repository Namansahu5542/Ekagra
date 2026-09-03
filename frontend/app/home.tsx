import { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Screen, StatusPill, Tile } from "@/components/UI";
import { useSession } from "@/lib/session";
import { buildToday, currentOrNext, TodayReminder } from "@/lib/reminders";
import { colors, radii, space, type } from "@/theme";

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { device, online, language } = useSession();
  const [next, setNext] = useState<TodayReminder | null>(null);
  const [modal, setModal] = useState<null | "call" | "called" | "help">(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (device?.profile) {
          const items = await buildToday(device.profile);
          setNext(currentOrNext(items));
        }
      })();
    }, [device])
  );

  const name = device?.profile?.name || "";
  const clock = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Screen testID="home-screen" showSos>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <AppText size={type.title} weight="700">{t("home.greeting", { name })}</AppText>
          <AppText size={type.body} color={colors.pewter}>{clock}</AppText>
        </View>
        <StatusPill online={online} />
      </View>

      <Card style={{ backgroundColor: colors.sunsetCoral }} pad={space.lg}>
        <AppText size={type.helper} weight="700" color={colors.pureWhite}>{t("home.whatNow")}</AppText>
        {next ? (
          <>
            <View style={styles.whatRow}>
              <View style={styles.whatIcon}>
                <Ionicons name={iconFor(next.type)} size={38} color={colors.emberOrange} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText size={type.heading} weight="700" color={colors.pureWhite}>
                  {t(`reminderType.${next.type}` as any)}
                </AppText>
                <AppText size={type.body} color={colors.pureWhite}>
                  {t("reminders.at", { time: next.time })}
                </AppText>
              </View>
            </View>
            <BigButton
              testID="home-open-activity"
              label={t("home.reminders")}
              icon="arrow-forward"
              onPress={() => router.push("/reminders")}
            />
          </>
        ) : (
          <AppText size={type.body} color={colors.pureWhite} style={{ marginTop: space.sm }}>
            {t("home.nothingDue")}
          </AppText>
        )}
      </Card>

      <View style={styles.grid}>
        <Tile testID="tile-games" label={t("home.games")} icon="game-controller" onPress={() => router.push("/games")} />
        <Tile testID="tile-reminders" label={t("home.reminders")} icon="checkbox" onPress={() => router.push("/reminders")} />
        <Tile testID="tile-notes" label={t("home.notes")} icon="reader" onPress={() => router.push("/notes")} />
        <Tile testID="tile-voice" label={t("home.voice")} icon="mic" onPress={() => router.push("/voice")} />
      </View>

      <BigButton testID="home-call-family" label={t("home.callFamily")} icon="call" variant="primary" onPress={() => setModal("call")} />
      <View style={styles.bottomRow}>
        <Pressable testID="home-help" style={styles.helpBtn} onPress={() => setModal("help")}>
          <Ionicons name="help-buoy" size={26} color={colors.emberOrange} />
          <AppText size={type.action} weight="700" color={colors.emberOrange}>{t("home.help")}</AppText>
        </Pressable>
        <Pressable testID="home-settings" style={styles.settingsBtn} onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={26} color={colors.pewter} />
        </Pressable>
      </View>

      <Modal transparent visible={modal !== null} animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.overlay}>
          <Card style={styles.dialog}>
            {modal === "call" && (
              <>
                <AppText size={type.cardTitle} weight="700" style={{ textAlign: "center" }}>{t("home.callConfirm")}</AppText>
                <View style={styles.dialogRow}>
                  <View style={{ flex: 1 }}>
                    <BigButton testID="call-no" label={t("common.no")} variant="secondary" onPress={() => setModal(null)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BigButton testID="call-yes" label={t("common.yes")} variant="success" onPress={() => setModal("called")} />
                  </View>
                </View>
              </>
            )}
            {modal === "called" && (
              <>
                <Ionicons name="checkmark-circle" size={54} color={colors.success} style={{ alignSelf: "center" }} />
                <AppText size={type.body} style={{ textAlign: "center" }}>{t("home.callPlaced")}</AppText>
                <BigButton testID="call-close" label={t("common.close")} onPress={() => setModal(null)} />
              </>
            )}
            {modal === "help" && (
              <>
                <AppText size={type.cardTitle} weight="700" style={{ textAlign: "center" }}>{t("home.helpTitle")}</AppText>
                <AppText size={type.body} style={{ textAlign: "center" }}>{t("home.helpBody")}</AppText>
                <BigButton testID="help-close" label={t("common.close")} onPress={() => setModal(null)} />
              </>
            )}
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  return (
    {
      water: "water",
      medicine: "medkit",
      meal: "restaurant",
      sleep: "moon",
      exercise: "walk",
      game: "game-controller",
    } as any
  )[type] || "alarm";
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  whatRow: { flexDirection: "row", alignItems: "center", gap: space.md, marginVertical: space.md },
  whatIcon: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: colors.pureWhite,
    justifyContent: "center", alignItems: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  helpBtn: {
    flex: 1, flexDirection: "row", gap: space.xs, alignItems: "center", justifyContent: "center",
    minHeight: 56, borderRadius: radii.button, borderWidth: 2, borderColor: colors.emberOrange,
    backgroundColor: colors.pureWhite,
  },
  settingsBtn: {
    width: 56, height: 56, borderRadius: radii.button, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: colors.sand, backgroundColor: colors.pureWhite,
  },
  overlay: { flex: 1, backgroundColor: "rgba(14,14,15,0.45)", justifyContent: "center", padding: space.lg },
  dialog: { gap: space.md },
  dialogRow: { flexDirection: "row", gap: space.md, marginTop: space.sm },
});
