import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Header, Screen } from "@/components/UI";
import { AdaptiveGame } from "@/components/AdaptiveGame";
import { GameResult } from "@/components/GameResult";
import { useSession } from "@/lib/session";
import { recordSession } from "@/games/engine";
import { BALL_COLORS, configForLevel, pickColor, scoreWhack } from "@/games/whackTheBall";
import { colors, radii, space, type } from "@/theme";

const SIZE = 62;

interface Ball {
  id: number;
  colorKey: string;
  colorValue: string;
  x: number;
  y: number;
  expireAt: number;
}

export default function WhackScreen() {
  return <AdaptiveGame gameId="whack_the_ball" render={(lv) => <WhackGame level={lv} />} />;
}

function WhackGame({ level }: { level: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { device, syncNow } = useSession();
  const cfg = configForLevel(level);

  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [balls, setBalls] = useState<Ball[]>([]);
  const [target, setTarget] = useState(BALL_COLORS[0]);
  const [timeLeft, setTimeLeft] = useState(Math.round(cfg.durationMs / 1000));
  const [result, setResult] = useState<null | { score: number; accuracy: number }>(null);

  const dim = useRef({ w: 320, h: 380 });
  const idRef = useRef(1);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const timers = useRef<any[]>([]);
  const recordedRef = useRef(false);

  function onLayout(e: LayoutChangeEvent) {
    dim.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
  }

  function clearTimers() {
    timers.current.forEach((tm) => clearInterval(tm));
    timers.current = [];
  }

  useEffect(() => () => clearTimers(), []);

  function start() {
    correctRef.current = 0;
    wrongRef.current = 0;
    idRef.current = 1;
    recordedRef.current = false;
    setBalls([]);
    setTimeLeft(Math.round(cfg.durationMs / 1000));
    setTarget(pickColor());
    setResult(null);
    setPhase("playing");

    const spawn = setInterval(() => {
      const now = Date.now();
      const { w, h } = dim.current;
      const ball: Ball = {
        id: idRef.current++,
        ...(() => {
          const c = pickColor();
          return { colorKey: c.key, colorValue: c.value };
        })(),
        x: Math.random() * Math.max(1, w - SIZE),
        y: Math.random() * Math.max(1, h - SIZE),
        expireAt: now + cfg.ballLifetimeMs,
      };
      setBalls((prev) => [...prev.filter((b) => b.expireAt > now), ball].slice(-cfg.maxBalls));
    }, cfg.spawnIntervalMs);

    const reap = setInterval(() => {
      const now = Date.now();
      setBalls((prev) => prev.filter((b) => b.expireAt > now));
    }, 300);

    const tick = setInterval(() => {
      setTimeLeft((tl) => {
        const next = tl - 1;
        if (next % 5 === 0) setTarget(pickColor());
        if (next <= 0) {
          finish();
          return 0;
        }
        return next;
      });
    }, 1000);

    timers.current = [spawn, reap, tick];
  }

  async function finish() {
    if (recordedRef.current) return;
    recordedRef.current = true;
    clearTimers();
    setBalls([]);
    const { score, accuracy } = scoreWhack(correctRef.current, wrongRef.current);
    if (device) {
      await recordSession({
        patientId: device.patientId,
        gameId: "whack_the_ball",
        difficulty: level,
        score,
        accuracy,
        completionTimeMs: cfg.durationMs,
        hintsUsed: 0,
        skippedQuestions: 0,
        quitEvent: false,
        frustrationSignal: accuracy < 35,
      });
      syncNow();
    }
    setResult({ score, accuracy });
    setPhase("done");
  }

  async function quit() {
    if (phase === "playing" && !recordedRef.current) {
      recordedRef.current = true;
      clearTimers();
      const { score, accuracy } = scoreWhack(correctRef.current, wrongRef.current);
      if (device) {
        await recordSession({
          patientId: device.patientId,
          gameId: "whack_the_ball",
          difficulty: level,
          score,
          accuracy,
          completionTimeMs: null,
          hintsUsed: 0,
          skippedQuestions: 0,
          quitEvent: true,
          frustrationSignal: true,
        });
        syncNow();
      }
    }
    router.back();
  }

  function tap(ball: Ball) {
    if (ball.colorKey === target.key) correctRef.current += 1;
    else wrongRef.current += 1;
    setBalls((prev) => prev.filter((b) => b.id !== ball.id));
  }

  return (
    <Screen scroll={false} testID="whack-screen">
      <Header title={t("games.whackTheBall")} onBack={quit} />

      {phase === "ready" && (
        <Card style={{ gap: space.md, marginTop: space.lg }}>
          <AppText size={type.body}>{t("games.whackTheBallDesc")}</AppText>
          <View style={styles.legend}>
            {BALL_COLORS.map((c) => (
              <View key={c.key} style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: c.value }]} />
                <AppText size={type.helper}>{t(`colors.${c.key}` as any)}</AppText>
              </View>
            ))}
          </View>
          <BigButton testID="whack-start" label={t("games.start")} icon="play" onPress={start} />
        </Card>
      )}

      {phase === "playing" && (
        <View style={{ flex: 1, gap: space.sm }}>
          <View style={styles.hud}>
            <View style={styles.targetPill}>
              <View style={[styles.swatch, { backgroundColor: target.value }]} />
              <AppText size={type.action} weight="700">{t("games.tapTarget", { color: t(`colors.${target.key}` as any) })}</AppText>
            </View>
            <AppText testID="whack-timer" size={type.heading} weight="700">{timeLeft}s</AppText>
          </View>
          <View style={styles.board} onLayout={onLayout} testID="whack-board">
            {balls.map((b) => (
              <Pressable
                key={b.id}
                testID={`ball-${b.colorKey}`}
                onPress={() => tap(b)}
                style={[styles.ball, { left: b.x, top: b.y, backgroundColor: b.colorValue }]}
              />
            ))}
          </View>
          <BigButton testID="whack-quit" label={t("games.quit")} variant="secondary" icon="flag" onPress={quit} />
        </View>
      )}

      {phase === "done" && result && (
        <View style={{ marginTop: space.lg }}>
          <GameResult
            score={result.score}
            accuracy={result.accuracy}
            extraLabel={t("games.hitsGood")}
            extraValue={String(correctRef.current)}
            onPlayAgain={start}
            onBack={() => router.back()}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.charcoal },
  hud: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  targetPill: { flexDirection: "row", alignItems: "center", gap: space.xs, flex: 1 },
  board: {
    flex: 1,
    backgroundColor: colors.pureWhite,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.sand,
    overflow: "hidden",
    minHeight: 340,
  },
  ball: { position: "absolute", width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
});
