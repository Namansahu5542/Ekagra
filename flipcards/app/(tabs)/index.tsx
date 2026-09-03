import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { calculateScore, getAccuracy } from "@/lib/game-scoring";

const cultureImage = require("../../assets/images/northeast-culture.png");
const cardBackImage = require("../../assets/images/card-back-mobile.jpg");

const PALETTE = {
  ink: "#18252F",
  inkSoft: "#52616B",
  cream: "#F8F3ED",
  paper: "#FFFDFC",
  line: "#E9E0D8",
  indigo: "#173A50",
  indigoDeep: "#0F2A3B",
  coral: "#E36B4D",
  saffron: "#EDB344",
  mint: "#2D8170",
  lilac: "#8572A8",
  white: "#FFFFFF",
};

type Card = {
  id: string;
  pair: string;
  title: string;
  region: string;
  accent: string;
  glyph: string;
  isFaceUp: boolean;
  isMatched: boolean;
};

type Result = {
  score: number;
  time: number;
  moves: number;
  accuracy: number;
  streak: number;
};

const PAIRS = [
  { pair: "assam", title: "Bihu", region: "Assam", accent: PALETTE.coral, glyph: "✦" },
  { pair: "manipur", title: "Lai Haraoba", region: "Manipur", accent: PALETTE.saffron, glyph: "◈" },
  { pair: "meghalaya", title: "Wangala", region: "Meghalaya", accent: PALETTE.mint, glyph: "✺" },
  { pair: "mizoram", title: "Cheraw", region: "Mizoram", accent: PALETTE.lilac, glyph: "⌁" },
  { pair: "nagaland", title: "Hornbill", region: "Nagaland", accent: "#B76256", glyph: "◆" },
  { pair: "tripura", title: "Hojagiri", region: "Tripura", accent: "#3D7894", glyph: "◇" },
  { pair: "sikkim", title: "Losar", region: "Sikkim", accent: "#C18C3A", glyph: "✧" },
  { pair: "arunachal", title: "Solung", region: "Arunachal", accent: "#638B77", glyph: "❖" },
];

const createDeck = (): Card[] =>
  PAIRS.flatMap((item) =>
    [0, 1].map((copy) => ({
      id: `${item.pair}-${copy}`,
      pair: item.pair,
      title: item.title,
      region: item.region,
      accent: item.accent,
      glyph: item.glyph,
      isFaceUp: false,
      isMatched: false,
    })),
  ).sort(() => Math.random() - 0.5);

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
};

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

function MemoryCard({ card, onPress, disabled }: { card: Card; onPress: () => void; disabled: boolean }) {
  const scaleX = useRef(new Animated.Value(card.isFaceUp ? 1 : 1)).current;
  const [showFront, setShowFront] = useState(card.isFaceUp);
  const previousFaceUp = useRef(card.isFaceUp);

  useEffect(() => {
    if (previousFaceUp.current === card.isFaceUp) return;
    previousFaceUp.current = card.isFaceUp;
    const native = Platform.OS !== "web";
    Animated.sequence([
      Animated.timing(scaleX, { toValue: 0.04, duration: 125, useNativeDriver: native }),
      Animated.timing(scaleX, { toValue: 1, duration: 155, useNativeDriver: native }),
    ]).start();
    const swapTimer = setTimeout(() => setShowFront(card.isFaceUp), 115);
    return () => clearTimeout(swapTimer);
  }, [card.isFaceUp, scaleX]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={showFront ? `${card.title}, ${card.region}` : "Face-down memory card"}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.cardPressable, pressed && !disabled && styles.cardPressed]}
    >
      <Animated.View style={[styles.memoryCard, { transform: [{ scaleX }] }]}>
        {showFront ? (
          <View style={[styles.cardFace, styles.cardFront, { borderColor: card.accent }]}>
            <Image source={cultureImage} style={styles.cardImage} resizeMode="cover" />
            <View style={[styles.imageShade, { backgroundColor: `${card.accent}88` }]} />
            <View style={styles.cardTopRow}>
              <Text style={styles.cardGlyph}>{card.glyph}</Text>
              <Text style={styles.cardRegion}>{card.region.toUpperCase()}</Text>
            </View>
            <View style={styles.cardCaption}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardHint}>NORTHEAST INDIA</Text>
            </View>
            {card.isMatched && <View style={styles.matchedDot} />}
          </View>
        ) : (
          <View style={styles.cardFace}>
            <Image source={cardBackImage} style={styles.cardBackImage} resizeMode="cover" />
            <View style={styles.cardBackWash} />
            <View style={styles.cardBackMark}>
              <Text style={styles.cardBackGlyph}>✦</Text>
              <Text style={styles.cardBackText}>M M</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function ScoreBreakdown({ result, onRestart }: { result: Result; onRestart: () => void }) {
  const pairPoints = result.streak * 100;
  const accuracyBonus = Math.round(result.accuracy * 2);
  const speedBonus = Math.max(0, 300 - result.time * 4);
  const streakBonus = Math.max(0, result.streak - 1) * 25;
  const mismatchPenalty = Math.max(0, result.moves - result.streak) * 15;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={styles.modalScrim}>
        <View style={styles.resultSheet}>
          <View style={styles.resultKickerRow}>
            <View style={styles.resultKickerLine} />
            <Text style={styles.resultKicker}>ROUND COMPLETE</Text>
            <View style={styles.resultKickerLine} />
          </View>
          <Text style={styles.resultTitle}>You found every story.</Text>
          <Text style={styles.resultSubtitle}>A clean board, with a little Northeast sparkle.</Text>

          <View style={styles.finalScoreCard}>
            <Text style={styles.finalScoreLabel}>FINAL SCORE</Text>
            <Text style={styles.finalScore}>{result.score.toLocaleString()}</Text>
            <View style={styles.scoreTag}><Text style={styles.scoreTagText}>{result.accuracy >= 80 ? "SHARP MEMORY" : "NICE RUN"}</Text></View>
          </View>

          <View style={styles.resultStats}>
            <Metric label="TIME" value={formatTime(result.time)} accent={PALETTE.saffron} />
            <Metric label="MOVES" value={String(result.moves)} accent={PALETTE.coral} />
            <Metric label="ACCURACY" value={`${result.accuracy}%`} accent={PALETTE.mint} />
          </View>

          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>HOW IT ADDED UP</Text>
            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>8 pairs found</Text><Text style={styles.breakdownValue}>+{pairPoints}</Text></View>
            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Accuracy bonus</Text><Text style={styles.breakdownValue}>+{accuracyBonus}</Text></View>
            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Speed bonus</Text><Text style={styles.breakdownValue}>+{speedBonus}</Text></View>
            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Streak bonus</Text><Text style={styles.breakdownValue}>+{streakBonus}</Text></View>
            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Mismatch penalty</Text><Text style={[styles.breakdownValue, styles.penalty]}>-{mismatchPenalty}</Text></View>
          </View>

          <Pressable onPress={onRestart} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
            <Text style={styles.primaryButtonText}>PLAY AGAIN</Text>
            <Text style={styles.primaryButtonArrow}>↗</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const [deck, setDeck] = useState<Card[]>(createDeck);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoredRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem("memory-match-best-score").then((value) => {
      if (value) setBestScore(Number(value));
    }).catch(() => undefined);
    return () => {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isRunning || result) return;
    const timer = setInterval(() => {
      if (startTimeRef.current) setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, result]);

  const accuracy = useMemo(() => getAccuracy(matchedPairs, moves), [matchedPairs, moves]);
  const liveScore = useMemo(() => Math.max(0, matchedPairs * 100 + streak * 20 - Math.max(0, moves - matchedPairs) * 10), [matchedPairs, moves, streak]);
  const remaining = PAIRS.length - matchedPairs;
  const progress = Math.round((matchedPairs / PAIRS.length) * 100);

  const restart = () => {
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    setDeck(createDeck());
    setSelectedIds([]);
    setMoves(0);
    setMatchedPairs(0);
    setStreak(0);
    setBestStreak(0);
    setElapsed(0);
    setIsRunning(false);
    setIsResolving(false);
    setResult(null);
    scoredRef.current = false;
    startTimeRef.current = null;
  };

  const finishRound = (nextPairs: number, nextMoves: number, nextStreak: number, nextElapsed: number, nextBestStreak: number) => {
    if (scoredRef.current) return;
    scoredRef.current = true;
    const finalResult = {
      time: nextElapsed,
      moves: nextMoves,
      accuracy: getAccuracy(nextPairs, nextMoves),
      streak: nextBestStreak,
    };
    const score = calculateScore(finalResult);
    const completed = { ...finalResult, score };
    setBestStreak(nextBestStreak);
    setResult(completed);
    setIsRunning(false);
    if (score > bestScore) {
      setBestScore(score);
      AsyncStorage.setItem("memory-match-best-score", String(score)).catch(() => undefined);
    }
    AsyncStorage.setItem("memory-match-last-result", JSON.stringify(completed)).catch(() => undefined);
  };

  const handleCardPress = (id: string) => {
    if (isResolving || selectedIds.includes(id)) return;
    const tapped = deck.find((card) => card.id === id);
    if (!tapped || tapped.isMatched) return;

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      setIsRunning(true);
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

    const nextSelected = [...selectedIds, id];
    setSelectedIds(nextSelected);
    setDeck((current) => current.map((card) => card.id === id ? { ...card, isFaceUp: true } : card));
    if (nextSelected.length !== 2) return;

    setIsResolving(true);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const [firstId, secondId] = nextSelected;
    const first = deck.find((card) => card.id === firstId);
    const second = deck.find((card) => card.id === secondId);
    const isMatch = first?.pair === second?.pair;

    if (isMatch) {
      const nextPairs = matchedPairs + 1;
      const nextStreak = streak + 1;
      const nextBestStreak = Math.max(bestStreak, nextStreak);
      setMatchedPairs(nextPairs);
      setStreak(nextStreak);
      setBestStreak(nextBestStreak);
      setDeck((current) => current.map((card) => nextSelected.includes(card.id) ? { ...card, isFaceUp: true, isMatched: true } : card));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      resolveTimerRef.current = setTimeout(() => {
        setSelectedIds([]);
        setIsResolving(false);
        if (nextPairs === PAIRS.length) {
          const finalElapsed = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : elapsed;
          setElapsed(finalElapsed);
          finishRound(nextPairs, nextMoves, nextStreak, finalElapsed, nextBestStreak);
        }
      }, 360);
      return;
    }

    setStreak(0);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    resolveTimerRef.current = setTimeout(() => {
      setDeck((current) => current.map((card) => nextSelected.includes(card.id) ? { ...card, isFaceUp: false } : card));
      setSelectedIds([]);
      setIsResolving(false);
    }, 760);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>✦</Text></View>
            <View>
              <Text style={styles.eyebrow}>CULTURE EDITION</Text>
              <Text style={styles.brandName}>Memory <Text style={styles.brandNameAccent}>Match</Text></Text>
            </View>
          </View>
          <View style={styles.bestPill}><Text style={styles.bestPillLabel}>BEST</Text><Text style={styles.bestPillValue}>{bestScore ? bestScore.toLocaleString() : "—"}</Text></View>
        </View>

        <View style={styles.introRow}>
          <View style={styles.introCopy}>
            <Text style={styles.title}>Find the{`\n`}shared story.</Text>
            <Text style={styles.subtitle}>Pair the cards. Meet the colours, rhythms, and traditions of Northeast India.</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressValue}>{String(matchedPairs).padStart(2, "0")}</Text>
            <Text style={styles.progressSlash}>/</Text>
            <Text style={styles.progressTotal}>{PAIRS.length}</Text>
            <Text style={styles.progressLabel}>PAIRS</Text>
          </View>
        </View>

        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>

        <View style={styles.metricsBar}>
          <Metric label="SCORE" value={liveScore.toLocaleString()} accent={PALETTE.coral} />
          <View style={styles.metricDivider} />
          <Metric label="TIME" value={formatTime(elapsed)} accent={PALETTE.saffron} />
          <View style={styles.metricDivider} />
          <Metric label="MOVES" value={String(moves)} accent={PALETTE.mint} />
          <View style={styles.metricDivider} />
          <Metric label="ACCURACY" value={`${accuracy}%`} accent={PALETTE.lilac} />
        </View>

        <View style={styles.boardHeader}>
          <View><Text style={styles.boardTitle}>THE BOARD</Text><Text style={styles.boardInstruction}>{isResolving ? "Hold that thought…" : remaining === 0 ? "All stories found." : `${remaining} pair${remaining === 1 ? "" : "s"} still hidden`}</Text></View>
          <View style={styles.streakPill}><Text style={styles.streakIcon}>✦</Text><Text style={styles.streakText}>{streak > 1 ? `${streak} STREAK` : "BUILD A STREAK"}</Text></View>
        </View>

        <View style={styles.board}>
          {deck.map((card) => (
            <MemoryCard key={card.id} card={card} onPress={() => handleCardPress(card.id)} disabled={isResolving || card.isMatched || card.isFaceUp} />
          ))}
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}><Text style={styles.tipIconText}>i</Text></View>
          <View style={styles.tipCopy}><Text style={styles.tipTitle}>HOW SCORING WORKS</Text><Text style={styles.tipText}>Pair points + accuracy + speed + streaks. Mismatches cost 15 points.</Text></View>
          <Text style={styles.tipArrow}>↗</Text>
        </View>

        <Text style={styles.footerNote}>INSPIRED BY THE LIVING CULTURES OF THE NORTHEAST</Text>
      </ScrollView>
      {result && <ScoreBreakdown result={result} onRestart={restart} />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: PALETTE.cream },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  brandLockup: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: PALETTE.indigo, alignItems: "center", justifyContent: "center" },
  brandMarkText: { color: PALETTE.saffron, fontSize: 16 },
  eyebrow: { color: PALETTE.coral, fontSize: 9, fontWeight: "800", letterSpacing: 1.6, marginBottom: 1 },
  brandName: { color: PALETTE.ink, fontSize: 21, fontWeight: "800", letterSpacing: -0.7 },
  brandNameAccent: { color: PALETTE.coral },
  bestPill: { minWidth: 66, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: PALETTE.paper, borderRadius: 12, borderWidth: 1, borderColor: PALETTE.line, alignItems: "flex-end" },
  bestPillLabel: { color: PALETTE.inkSoft, fontSize: 8, fontWeight: "800", letterSpacing: 1.2 },
  bestPillValue: { color: PALETTE.indigo, fontSize: 13, fontWeight: "800", marginTop: 1 },
  introRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 },
  introCopy: { flex: 1, paddingRight: 18 },
  title: { color: PALETTE.ink, fontSize: 34, lineHeight: 35, fontWeight: "800", letterSpacing: -1.4 },
  subtitle: { color: PALETTE.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 12, maxWidth: 285 },
  progressBadge: { width: 65, height: 65, borderRadius: 33, backgroundColor: PALETTE.indigo, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-7deg" }], marginBottom: 4 },
  progressValue: { color: PALETTE.saffron, fontSize: 21, lineHeight: 21, fontWeight: "800" },
  progressSlash: { color: "#7F99A6", fontSize: 10, position: "absolute", top: 28, left: 30 },
  progressTotal: { color: PALETTE.white, fontSize: 11, fontWeight: "800", position: "absolute", top: 31, left: 37 },
  progressLabel: { color: "#B6CAD1", fontSize: 7, letterSpacing: 1, fontWeight: "800", marginTop: 5 },
  progressTrack: { height: 4, borderRadius: 3, backgroundColor: "#E7DCD3", overflow: "hidden", marginBottom: 19 },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: PALETTE.coral },
  metricsBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: PALETTE.paper, borderRadius: 17, borderWidth: 1, borderColor: PALETTE.line, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 28 },
  metric: { flex: 1, alignItems: "center" },
  metricLabel: { color: PALETTE.inkSoft, fontSize: 8, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  metricDivider: { width: 1, height: 28, backgroundColor: PALETTE.line },
  boardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  boardTitle: { color: PALETTE.ink, fontSize: 12, letterSpacing: 1.8, fontWeight: "800" },
  boardInstruction: { color: PALETTE.inkSoft, fontSize: 11, marginTop: 3 },
  streakPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, backgroundColor: "#F2E8D7" },
  streakIcon: { color: PALETTE.saffron, fontSize: 12 },
  streakText: { color: "#8D6B32", fontSize: 8, fontWeight: "800", letterSpacing: 0.7 },
  board: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8, padding: 8, backgroundColor: PALETTE.indigoDeep, borderRadius: 22, borderWidth: 1, borderColor: "#345263", shadowColor: "#122B3A", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  cardPressable: { width: "22%", aspectRatio: 0.78 },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
  memoryCard: { flex: 1, borderRadius: 10, overflow: "hidden", backgroundColor: PALETTE.indigo },
  cardFace: { flex: 1, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#426478", backgroundColor: PALETTE.indigo, position: "relative" },
  cardFront: { backgroundColor: PALETTE.paper },
  cardImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  imageShade: { ...StyleSheet.absoluteFillObject, opacity: 0.82 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 7, paddingTop: 7 },
  cardGlyph: { color: PALETTE.white, fontSize: 13, fontWeight: "800" },
  cardRegion: { color: PALETTE.white, fontSize: 6, fontWeight: "800", letterSpacing: 0.7 },
  cardCaption: { position: "absolute", bottom: 7, left: 7, right: 7 },
  cardTitle: { color: PALETTE.white, fontSize: 10, fontWeight: "800", letterSpacing: -0.2 },
  cardHint: { color: "#FFF8EA", fontSize: 5.5, letterSpacing: 0.6, fontWeight: "800", marginTop: 2 },
  matchedDot: { position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.saffron, borderWidth: 1, borderColor: PALETTE.white },
  cardBackImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  cardBackWash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0B2637", opacity: 0.1 },
  cardBackMark: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardBackGlyph: { color: PALETTE.saffron, fontSize: 18, marginBottom: 2 },
  cardBackText: { color: PALETTE.white, fontSize: 8, fontWeight: "900", letterSpacing: 2 },
  tipCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#F2E8DC", borderRadius: 16, padding: 12, marginTop: 18, borderWidth: 1, borderColor: "#E8D8C8" },
  tipIcon: { width: 25, height: 25, borderRadius: 13, backgroundColor: PALETTE.indigo, alignItems: "center", justifyContent: "center", marginRight: 10 },
  tipIconText: { color: PALETTE.saffron, fontWeight: "900", fontSize: 15, fontStyle: "italic" },
  tipCopy: { flex: 1 },
  tipTitle: { color: PALETTE.ink, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  tipText: { color: PALETTE.inkSoft, fontSize: 11, lineHeight: 15, marginTop: 2 },
  tipArrow: { color: PALETTE.coral, fontSize: 20, marginLeft: 8 },
  footerNote: { color: "#9C8F84", fontSize: 8, letterSpacing: 1.3, fontWeight: "800", textAlign: "center", marginTop: 24 },
  modalScrim: { flex: 1, backgroundColor: "rgba(14, 31, 43, 0.70)", alignItems: "center", justifyContent: "center", padding: 20 },
  resultSheet: { width: "100%", maxWidth: 420, backgroundColor: PALETTE.cream, borderRadius: 25, padding: 22, borderWidth: 1, borderColor: "#F5E7D8" },
  resultKickerRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  resultKickerLine: { height: 1, backgroundColor: "#D9C9B9", width: 28 },
  resultKicker: { color: PALETTE.coral, fontSize: 8, fontWeight: "900", letterSpacing: 1.5 },
  resultTitle: { color: PALETTE.ink, textAlign: "center", fontSize: 26, lineHeight: 30, fontWeight: "800", letterSpacing: -0.8, marginTop: 13 },
  resultSubtitle: { color: PALETTE.inkSoft, textAlign: "center", fontSize: 12, marginTop: 5, marginBottom: 16 },
  finalScoreCard: { backgroundColor: PALETTE.indigo, borderRadius: 18, alignItems: "center", paddingVertical: 16, overflow: "hidden" },
  finalScoreLabel: { color: "#A8C0C8", fontSize: 8, fontWeight: "900", letterSpacing: 1.6 },
  finalScore: { color: PALETTE.saffron, fontSize: 42, lineHeight: 45, fontWeight: "900", letterSpacing: -1 },
  scoreTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, backgroundColor: "#2D5A67", marginTop: 4 },
  scoreTagText: { color: PALETTE.white, fontSize: 7, letterSpacing: 1, fontWeight: "900" },
  resultStats: { flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 13 },
  breakdown: { backgroundColor: PALETTE.paper, borderRadius: 15, borderWidth: 1, borderColor: PALETTE.line, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16 },
  breakdownTitle: { color: PALETTE.inkSoft, fontSize: 8, fontWeight: "900", letterSpacing: 1.3, marginBottom: 7 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  breakdownLabel: { color: PALETTE.inkSoft, fontSize: 11 },
  breakdownValue: { color: PALETTE.mint, fontSize: 11, fontWeight: "800" },
  penalty: { color: PALETTE.coral },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PALETTE.coral, borderRadius: 14, paddingVertical: 14 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  primaryButtonText: { color: PALETTE.white, fontSize: 12, letterSpacing: 1.3, fontWeight: "900" },
  primaryButtonArrow: { color: PALETTE.white, fontSize: 17, lineHeight: 15 },
});
