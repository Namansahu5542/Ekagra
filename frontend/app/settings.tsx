import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Header, Screen, StatusPill } from "@/components/UI";
import { LANGUAGES } from "@/i18n/locales";
import { useSession } from "@/lib/session";
import { colors, radii, space, touch, type } from "@/theme";

export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language, setLanguage, online, pending, lastSynced, syncNow, reset } = useSession();
  const [confirm, setConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function doSync() {
    setSyncing(true);
    await syncNow();
    setSyncing(false);
  }

  async function doReset() {
    await reset();
    router.replace("/setup");
  }

  const last = lastSynced ? new Date(lastSynced).toLocaleString() : t("settings.never");

  return (
    <Screen testID="settings-screen">
      <Header title={t("settings.title")} right={<StatusPill online={online} />} />

      <Card>
        <AppText size={type.cardTitle} weight="700">{t("settings.language")}</AppText>
        <View style={styles.chips}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              testID={`settings-lang-${l.code}`}
              onPress={() => setLanguage(l.code)}
              style={[styles.chip, language === l.code && styles.chipOn]}
            >
              <AppText size={type.helper} weight="600" color={language === l.code ? colors.pureWhite : colors.inkBlack}>{l.label}</AppText>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <AppText size={type.cardTitle} weight="700">{t("settings.connection")}</AppText>
        <View style={styles.line}>
          <Ionicons name="cloud-upload-outline" size={24} color={colors.pewter} />
          <AppText size={type.body} style={{ flex: 1 }}>
            {pending > 0 ? t("settings.pending", { count: pending }) : t("settings.allSynced")}
          </AppText>
        </View>
        <View style={styles.line}>
          <Ionicons name="time-outline" size={24} color={colors.pewter} />
          <AppText size={type.helper} color={colors.pewter}>{t("settings.lastSynced")}: {last}</AppText>
        </View>
        <BigButton testID="settings-sync" label={t("settings.syncNow")} icon="sync" onPress={doSync} loading={syncing} disabled={!online} />
      </Card>

      <BigButton testID="settings-reset" label={t("settings.logout")} variant="secondary" icon="log-out-outline" onPress={() => setConfirm(true)} />

      <Modal transparent visible={confirm} animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={styles.overlay}>
          <Card style={{ gap: space.md }}>
            <AppText size={type.body} style={{ textAlign: "center" }}>{t("settings.logoutConfirm")}</AppText>
            <View style={{ flexDirection: "row", gap: space.md }}>
              <View style={{ flex: 1 }}>
                <BigButton testID="reset-cancel" label={t("common.cancel")} variant="secondary" onPress={() => setConfirm(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <BigButton testID="reset-confirm" label={t("common.yes")} variant="danger" onPress={doReset} />
              </View>
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginTop: space.sm },
  chip: {
    minHeight: touch.min, justifyContent: "center", paddingHorizontal: space.md,
    borderRadius: radii.badge, borderWidth: 1, borderColor: colors.driftwood, backgroundColor: colors.pureWhite,
  },
  chipOn: { backgroundColor: colors.emberOrange, borderColor: colors.emberOrange },
  line: { flexDirection: "row", alignItems: "center", gap: space.sm, marginVertical: 6 },
  overlay: { flex: 1, backgroundColor: "rgba(14,14,15,0.45)", justifyContent: "center", padding: space.lg },
});
