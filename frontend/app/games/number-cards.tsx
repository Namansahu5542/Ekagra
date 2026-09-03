import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Header, Screen } from "@/components/UI";
import { AdaptiveGame } from "@/components/AdaptiveGame";
import { GameResult } from "@/components/GameResult";
import { useSession } from "@/lib/session";
import { recordSession } from "@/games/engine";
import { buildRound, NumberQuestion, scoreNumbers } from "@/games/numberCards";
import { colors, radii, space, type } from "@/theme";

const TOTAL = 5;

export default function NumberCardsScreen() {
  return <AdaptiveGame gameId="number_cards" render={(lv) => <NumberCardsGame level={lv} />} />;
}

function NumberCardsGame({ level }: { level: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { device, syncNow } = useSession();

  const [round, setRound] = useState<NumberQuestion[]>(() => buildRound(level, TOTAL));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [hints, setHints] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [removed, setRemoved] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState<null | { score: number; accuracy: number }>(null);
  const startRef = useRef(Date.now());
  const recordedRef = useRef(false);

  const q = round[index];

  function reset() {
    setRound(buildRound(level, TOTAL));
    setIndex(0);
    setCorrect(0);
    setHints(0);
    setSkipped(0);
    setRemoved([]);
    setPicked(null);
    setLocked(false);
    setFinished(null);
    startRef.current = Date.now();
    recordedRef.current = false;
  }

  function advance(nextCorrect: number, nextSkipped: number) {
    if (index + 1 >= TOTAL) finish(nextCorrect, nextSkipped, false);
    else {
      setIndex((i) => i + 1);
      setPicked(null);
      setRemoved([]);
      setLocked(false);
    }
  }

  async function finish(finalCorrect: number, finalSkipped: number, quit: boolean) {
    if (recordedRef.current) {
      if (quit) router.back();
      return;
    }
    recordedRef.current = true;
    const { score, accuracy } = scoreNumbers(finalCorrect, TOTAL, hints, finalSkipped);
    if (device) {
      await recordSession({
        patientId: device.patientId,
        gameId: "number_cards",
        difficulty: level,
        score,
        accuracy,
        completionTimeMs: quit ? null : Date.now() - startRef.current,
        hintsUsed: hints,
        skippedQuestions: finalSkipped,
        quitEvent: quit,
        frustrationSignal: quit || finalSkipped >= 2 || accuracy < 40,
      });
      syncNow();
    }
    if (quit) router.back();
    else setFinished({ score, accuracy });
  }

  function choose(opt: number) {
    if (locked) return;
    setPicked(opt);
    setLocked(true);
    if (opt === q.answer) {
      const nc = correct + 1;
      setCorrect(nc);
      setTimeout(() => advance(nc, skipped), 700);
    } else {
      setTimeout(() => advance(correct, skipped), 1100);
    }
  }

  function hint() {
    if (locked) return;
    const wrongs = q.options.filter((o) => o !== q.answer && !removed.includes(o));
    if (wrongs.length) {
      setRemoved((r) => [...r, wrongs[0]]);
      setHints((h) => h + 1);
    }
  }

  function skip() {
    if (locked) return;
    const ns = skipped + 1;
    setSkipped(ns);
    advance(correct, ns);
  }

  const optionColor = useMemo(
    () => (opt: number) => {
      if (picked === null) return { bg: colors.pureWhite, fg: colors.inkBlack, border: colors.driftwood };
      if (opt === q.answer) return { bg: colors.successBg, fg: colors.success, border: colors.success };
      if (opt === picked) return { bg: colors.dangerBg, fg: colors.danger, border: colors.danger };
      return { bg: colors.pureWhite, fg: colors.stone, border: colors.driftwood };
    },
    [picked, q]
  );

  return (
    <Screen testID="number-cards-screen">
      <Header title={t("games.numberCards")} onBack={() => finish(correct, skipped, true)} />
      {!finished ? (
        <>
          <AppText size={type.helper} weight="600" color={colors.pewter}>
            {t("games.question", { n: index + 1, total: TOTAL })}
          </AppText>
          <Card style={{ alignItems: "center", paddingVertical: space.xl }}>
            <AppText size={type.title} weight="700">{q.prompt}</AppText>
          </Card>

          {picked !== null && (
            <AppText
              testID="number-feedback"
              size={type.body}
              weight="600"
              color={picked === q.answer ? colors.success : colors.danger}
              style={{ textAlign: "center" }}
            >
              {picked === q.answer ? t("games.correct") : t("games.tryAgain")}
            </AppText>
          )}

          <View style={{ gap: space.md }}>
            {q.options.map((opt, i) => {
              const c = optionColor(opt);
              const disabled = removed.includes(opt);
              return (
                <Pressable
                  key={i}
                  testID={`number-option-${i}`}
                  disabled={disabled}
                  onPress={() => choose(opt)}
                  style={[styles.option, { backgroundColor: c.bg, borderColor: c.border, opacity: disabled ? 0.35 : 1 }]}
                >
                  <AppText size={type.title} weight="700" color={c.fg}>{opt}</AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1 }}>
              <BigButton testID="number-hint" label={t("games.hint")} variant="secondary" icon="bulb" onPress={hint} />
            </View>
            <View style={{ flex: 1 }}>
              <BigButton testID="number-skip" label={t("reminders.skip")} variant="secondary" icon="play-skip-forward" onPress={skip} />
            </View>
          </View>
        </>
      ) : (
        <GameResult
          score={finished.score}
          accuracy={finished.accuracy}
          extraLabel={t("games.hitsGood")}
          extraValue={`${correct}/${TOTAL}`}
          onPlayAgain={reset}
          onBack={() => router.back()}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 68,
    borderRadius: radii.card,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
