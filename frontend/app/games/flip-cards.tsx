import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Header, Screen } from "@/components/UI";
import { GameResult } from "@/components/GameResult";
import { useSession } from "@/lib/session";
import { recordSession } from "@/games/engine";
import {
  buildDeck,
  columnsForLevel,
  FlipCard,
  pairsForLevel,
  scoreFlip,
} from "@/games/flipCards";
import { colors, radii, space, type } from "@/theme";

export default function FlipCardsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { device, syncNow } = useSession();
  const params = useLocalSearchParams<{ level?: string }>();
  const level = Math.min(4, Math.max(1, parseInt(params.level || "2", 10)));
  const pairs = pairsForLevel(level);
  const cols = columnsForLevel(level);

  const [deck, setDeck] = useState<FlipCard[]>(() => buildDeck(level));
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [hints, setHints] = useState(0);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState<null | { score: number; accuracy: number; time: number }>(null);
  const startRef = useRef(Date.now());
  const recordedRef = useRef(false);

  function reset() {
    setDeck(buildDeck(level));
    setOpen([]);
    setMoves(0);
    setMatched(0);
    setHints(0);
    setLocked(false);
    setFinished(null);
    startRef.current = Date.now();
    recordedRef.current = false;
  }

  async function finish(quit: boolean) {
    if (recordedRef.current) {
      if (quit) router.back();
      return;
    }
    recordedRef.current = true;
    const time = Math.round((Date.now() - startRef.current) / 1000);
    const { score, accuracy } = scoreFlip(matched, moves, hints);
    if (device) {
      await recordSession({
        patientId: device.patientId,
        gameId: "flip_cards",
        difficulty: level,
        score,
        accuracy,
        completionTimeMs: quit ? null : time * 1000,
        hintsUsed: hints,
        skippedQuestions: 0,
        quitEvent: quit,
        frustrationSignal: quit || moves > pairs * 3,
      });
      syncNow();
    }
    if (quit) router.back();
    else setFinished({ score, accuracy, time });
  }

  function onPress(idx: number) {
    if (locked || finished) return;
    const card = deck[idx];
    if (card.matched || open.includes(idx)) return;
    const nextOpen = [...open, idx];
    setOpen(nextOpen);
    if (nextOpen.length === 2) {
      setLocked(true);
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [a, b] = nextOpen;
      if (deck[a].pairKey === deck[b].pairKey) {
        setTimeout(() => {
          setDeck((d) => d.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
          const nm = matched + 1;
          setMatched(nm);
          setOpen([]);
          setLocked(false);
          if (nm === pairs) setTimeout(() => finishAuto(nm, nextMoves), 250);
        }, 450);
      } else {
        setTimeout(() => {
          setOpen([]);
          setLocked(false);
        }, 800);
      }
    }
  }

  async function finishAuto(nm: number, mv: number) {
    if (recordedRef.current) return;
    recordedRef.current = true;
    const time = Math.round((Date.now() - startRef.current) / 1000);
    const { score, accuracy } = scoreFlip(nm, mv, hints);
    if (device) {
      await recordSession({
        patientId: device.patientId,
        gameId: "flip_cards",
        difficulty: level,
        score,
        accuracy,
        completionTimeMs: time * 1000,
        hintsUsed: hints,
        skippedQuestions: 0,
        quitEvent: false,
        frustrationSignal: mv > pairs * 3,
      });
      syncNow();
    }
    setFinished({ score, accuracy, time });
  }

  function hint() {
    if (locked || finished) return;
    setHints((h) => h + 1);
    const reveal = deck.map((_, i) => i).filter((i) => !deck[i].matched);
    setOpen(reveal);
    setLocked(true);
    setTimeout(() => {
      setOpen([]);
      setLocked(false);
    }, 1000);
  }

  const width = useMemo(() => (cols === 4 ? "22%" : "30%"), [cols]);

  return (
    <Screen testID="flip-cards-screen">
      <Header title={t("games.flipCards")} onBack={() => finish(true)} />
      {!finished ? (
        <>
          <View style={styles.hud}>
            <AppText size={type.helper} weight="600">{t("games.matches")}: {matched}/{pairs}</AppText>
            <AppText size={type.helper} weight="600">{t("games.level")} {level}</AppText>
          </View>
          <AppText size={type.helper} color={colors.pewter}>{t("games.tapPairs")}</AppText>
          <View style={styles.board}>
            {deck.map((card, idx) => {
              const shown = card.matched || open.includes(idx);
              return (
                <Pressable
                  key={card.id}
                  testID={`flip-card-${idx}`}
                  onPress={() => onPress(idx)}
                  style={[styles.card, { width: width as any }, shown ? styles.cardUp : styles.cardDown]}
                >
                  {shown ? (
                    <Ionicons name={card.icon} size={40} color={card.color} />
                  ) : (
                    <Ionicons name="help" size={34} color={colors.pureWhite} />
                  )}
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1 }}>
              <BigButton testID="flip-hint" label={t("games.hint")} variant="secondary" icon="bulb" onPress={hint} />
            </View>
            <View style={{ flex: 1 }}>
              <BigButton testID="flip-quit" label={t("games.quit")} variant="primary" icon="flag" onPress={() => finish(true)} />
            </View>
          </View>
        </>
      ) : (
        <GameResult
          score={finished.score}
          accuracy={finished.accuracy}
          timeSec={finished.time}
          extraLabel={t("games.matches")}
          extraValue={`${matched}/${pairs}`}
          onPlayAgain={reset}
          onBack={() => router.back()}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hud: { flexDirection: "row", justifyContent: "space-between" },
  board: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, justifyContent: "center", marginVertical: space.sm },
  card: {
    aspectRatio: 1,
    borderRadius: radii.card,
    justifyContent: "center",
    alignItems: "center",
  },
  cardDown: { backgroundColor: colors.burntRust },
  cardUp: { backgroundColor: colors.pureWhite, borderWidth: 2, borderColor: colors.sand },
});
