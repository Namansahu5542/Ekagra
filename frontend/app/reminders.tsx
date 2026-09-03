import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Header, Screen } from "@/components/UI";
import { useSession } from "@/lib/session";
import {
  buildToday,
  setReminderStatus,
  TodayReminder,
  ReminderStatus,
} from "@/lib/reminders";
import { colors, radii, space, type } from "@/theme";

const STATUS_STYLE: Record<ReminderStatus, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  completed: { bg: colors.successBg, fg: colors.success, icon: "checkmark-circle" },
  skipped: { bg: colors.fog, fg: colors.pewter, icon: "arrow-redo" },
  missed: { bg: colors.dangerBg, fg: colors.danger, icon: "close-circle" },
  unanswered: { bg: colors.fog, fg: colors.pewter, icon: "help-circle" },
  pending: { bg: colors.warmCanvas, fg: colors.burntRust, icon: "time" },
};

export default function Reminders() {
  const { t } = useTranslation();
  const { device, syncNow } = useSession();
  const [items, setItems] = useState<TodayReminder[]>([]);

  const load = useCallback(async () => {
    if (device?.profile) setItems(await buildToday(device.profile));
  }, [device]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function act(item: TodayReminder, status: ReminderStatus) {
    if (!device) return;
    await setReminderStatus(device.patientId, item, status);
    await load();
    syncNow();
  }

  return (
    <Screen testID="reminders-screen">
      <Header title={t("reminders.title")} />
      <Card style={{ backgroundColor: colors.peachBlush, borderColor: colors.peachBlush }}>
        <AppText size={type.helper}>{t("reminders.medicineNote")}</AppText>
      </Card>

      {items.length === 0 && (
        <AppText size={type.body} color={colors.pewter}>{t("reminders.empty")}</AppText>
      )}

      {items.map((item) => {
        const s = STATUS_STYLE[item.status];
        return (
          <Card key={item.key} testID={`reminder-${item.type}`}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Ionicons name={iconFor(item.type)} size={32} color={colors.emberOrange} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText size={type.cardTitle} weight="700">{t(`reminderType.${item.type}` as any)}</AppText>
                <AppText size={type.helper} color={colors.pewter}>{t("reminders.at", { time: item.time })}</AppText>
              </View>
              <View style={[styles.pill, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={18} color={s.fg} />
                <AppText size={type.helper} weight="600" color={s.fg}>{t(`reminders.${item.status}` as any)}</AppText>
              </View>
            </View>
            {item.status === "pending" && (
              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <BigButton testID={`reminder-done-${item.type}`} label={t("reminders.done")} variant="success" icon="checkmark" onPress={() => act(item, "completed")} />
                </View>
                <View style={{ flex: 1 }}>
                  <BigButton testID={`reminder-skip-${item.type}`} label={t("reminders.skip")} variant="secondary" onPress={() => act(item, "skipped")} />
                </View>
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  return (
    { water: "water", medicine: "medkit", meal: "restaurant", sleep: "moon", exercise: "walk", game: "game-controller" } as any
  )[type] || "alarm";
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.warmCanvas, justifyContent: "center", alignItems: "center" },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.badge },
  actions: { flexDirection: "row", gap: space.md, marginTop: space.md },
});
