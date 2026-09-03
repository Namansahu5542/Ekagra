import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card } from "@/components/UI";
import { colors, space, type } from "@/theme";

export function GameResult({
  score,
  accuracy,
  timeSec,
  extraLabel,
  extraValue,
  onPlayAgain,
  onBack,
}: {
  score: number;
  accuracy: number;
  timeSec?: number | null;
  extraLabel?: string;
  extraValue?: string;
  onPlayAgain: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
      <AppText size={type.body} color={colors.pewter}>{label}</AppText>
      <AppText size={type.body} weight="700">{value}</AppText>
    </View>
  );
  return (
    <Card testID="game-result" style={{ gap: space.xs }}>
      <View style={{ alignItems: "center", marginBottom: space.sm }}>
        <Ionicons name="ribbon" size={56} color={colors.emberOrange} />
        <AppText size={type.heading} weight="700">{t("games.greatJob")}</AppText>
      </View>
      <Row label={t("games.score")} value={String(score)} />
      <Row label={t("games.accuracy")} value={`${Math.round(accuracy)}%`} />
      {typeof timeSec === "number" && <Row label={t("games.time")} value={`${timeSec}s`} />}
      {extraLabel && extraValue ? <Row label={extraLabel} value={extraValue} /> : null}
      <BigButton testID="play-again" label={t("games.newGame")} icon="refresh" onPress={onPlayAgain} />
      <BigButton testID="back-to-games" label={t("games.backToGames")} variant="secondary" onPress={onBack} />
    </Card>
  );
}
