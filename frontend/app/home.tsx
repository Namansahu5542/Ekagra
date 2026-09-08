import { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  AppText,
  BigButton,
  Card,
  Screen,
  StatusPill,
  Tile,
} from "@/components/UI";
import { useSession } from "@/lib/session";
import { buildToday, currentOrNext, TodayReminder } from "@/lib/reminders";
import { colors, elevation, radii, space, touch, type } from "@/theme";

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
  const now = new Date();
  const clock = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const today = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });

  return (
    <Screen testID="home-screen" showSos>
      {/* Orientation first: who, when, and whether we are connected. */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText size={type.title} weight="700" color={colors.textStrong}>
            {t("home.greeting", { name })}
          </AppText>
          <AppText size={type.body} color={colors.text}>
            {today}
          </AppText>
          <AppText size={type.heading} weight="700" color={colors.primaryDeep}>
            {clock}
          </AppText>
        </View>
        <StatusPill online={online} />
      </View>

      {/* One clear "what now" card — the single primary task on this screen. */}
      <Card style={styles.hero} pad={space.lg}>
        <AppText size={type.helper} weight="700" color={colors.primarySoft}>
          {t("home.whatNow")}
        </AppText>
        {next ? (
          <>
            <View style={styles.whatRow}>
              <View style={styles.whatIcon}>
                <Ionicons name={iconFor(next.type)} size={40} color={colors.primaryDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText size={type.heading} weight="700" color={colors.onPrimary}>
                  {t(`reminderType.${next.type}` as any)}
                </AppText>
                <AppText size={type.body} color={colors.primarySoft}>
                  {t("reminders.at", { time: next.time })}
                </AppText>
              </View>
            </View>
            <BigButton
              testID="home-open-activity"
              label={t("home.reminders")}
              icon="arrow-forward"
              variant="secondary"
              onPress={() => router.push("/reminders")}
            />
          </>
        ) : (
          <View style={styles.restRow}>
            <Ionicons name="cafe" size={34} color={colors.primarySoft} />
            <AppText size={type.body} color={colors.onPrimary} style={{ flex: 1 }}>
              {t("home.nothingDue")}
            </AppText>
          </View>
        )}
      </Card>

      <View style={styles.grid}>
        <Tile testID="tile-games" label={t("home.games")} icon="game-controller" onPress={() => router.push("/games")} />
        <Tile testID="tile-reminders" label={t("home.reminders")} icon="checkbox" onPress={() => router.push("/reminders")} />
        <Tile testID="tile-notes" label={t("home.notes")} icon="reader" onPress={() => router.push("/notes")} />
        <Tile testID="tile-voice" label={t("home.voice")} icon="mic" onPress={() => router.push("/voice")} />
      </View>

      <BigButton
        testID="home-call-family"
        label={t("home.callFamily")}
        icon="call"
        variant="primary"
        onPress={() => setModal("call")}
      />

      <View style={styles.bottomRow}>
        <Pressable
          testID="home-help"
          accessibilityRole="button"
          accessibilityLabel={t("home.help")}
          style={styles.helpBtn}
          onPress={() => setModal("help")}
        >
          <Ionicons name="help-buoy" size={28} color={colors.primaryDeep} />
          <AppText size={type.action} weight="700" color={colors.primaryDeep}>
            {t("home.help")}
          </AppText>
        </Pressable>
        <Pressable
          testID="home-settings"
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.settingsBtn}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={28} color={colors.textMuted} />
        </Pressable>
      </View>

      <Modal transparent visible={modal !== null} animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.overlay}>
          <Card style={styles.dialog} pad={space.lg}>
            {modal === "call" && (
              <>
                <AppText size={type.cardTitle} weight="700" color={colors.textStrong} style={{ textAlign: "center" }}>
                  {t("home.callConfirm")}
                </AppText>
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
                <Ionicons name="checkmark-circle" size={64} color={colors.success} style={{ alignSelf: "center" }} />
                <AppText size={type.body} style={{ textAlign: "center" }}>{t("home.callPlaced")}</AppText>
                <BigButton testID="call-close" label={t("common.close")} onPress={() => setModal(null)} />
              </>
            )}
            {modal === "help" && (
              <>
                <AppText size={type.cardTitle} weight="700" color={colors.textStrong} style={{ textAlign: "center" }}>
                  {t("home.helpTitle")}
                </AppText>
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
  hero: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDeep,
    gap: space.sm,
    ...elevation.raised,
  },
  whatRow: { flexDirection: "row", alignItems: "center", gap: space.md, marginVertical: space.sm },
  whatIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  restRow: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  helpBtn: {
    flex: 1,
    flexDirection: "row",
    gap: space.xs,
    alignItems: "center",
    justifyContent: "center",
    minHeight: touch.primary,
    borderRadius: radii.button,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  settingsBtn: {
    width: touch.primary,
    height: touch.primary,
    borderRadius: radii.button,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: space.md,
  },
  dialog: { gap: space.md, maxWidth: 560, width: "100%", alignSelf: "center" },
  dialogRow: { flexDirection: "row", gap: space.md, marginTop: space.xs },
});
