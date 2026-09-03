import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Header, Screen } from "@/components/UI";
import { colors, radii, space, touch, type } from "@/theme";

const GAMES = [
  { id: "flip-cards", icon: "grid" as const, key: "flipCards", bg: colors.peachBlush },
  { id: "number-cards", icon: "calculator" as const, key: "numberCards", bg: colors.sand },
  { id: "whack-the-ball", icon: "ellipse" as const, key: "whackTheBall", bg: colors.fog },
];

export default function GamesHub() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen testID="games-screen" showSos>
      <Header title={t("games.title")} />
      <AppText size={type.body} color={colors.pewter}>{t("games.subtitle")}</AppText>

      <Card style={{ flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: colors.successBg, borderColor: colors.successBg }}>
        <Ionicons name="sparkles" size={22} color={colors.success} />
        <AppText size={type.helper} weight="600" color={colors.success} style={{ flex: 1 }}>{t("games.adaptiveNote")}</AppText>
      </Card>

      {GAMES.map((g) => (
        <Card key={g.id} testID={`game-card-${g.id}`} style={{ backgroundColor: g.bg, borderColor: g.bg }}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Ionicons name={g.icon} size={38} color={colors.emberOrange} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={type.cardTitle} weight="700">{t(`games.${g.key}` as any)}</AppText>
              <AppText size={type.helper} color={colors.slate}>{t(`games.${g.key}Desc` as any)}</AppText>
            </View>
          </View>
          <BigButton
            testID={`start-${g.id}`}
            label={t("games.start")}
            icon="play"
            onPress={() => router.push(`/games/${g.id}`)}
          />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  levels: { flexDirection: "row", gap: space.sm, marginTop: space.sm },
  level: {
    flex: 1, height: touch.primary, borderRadius: radii.card, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: colors.driftwood, backgroundColor: colors.pureWhite,
  },
  levelOn: { backgroundColor: colors.emberOrange, borderColor: colors.emberOrange },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: space.md },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.pureWhite, justifyContent: "center", alignItems: "center" },
});
