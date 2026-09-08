import { Ionicons } from "@expo/vector-icons";

type Glyph = keyof typeof Ionicons.glyphMap;

// Recognizable picture icons (not emoji) used as card faces.
const ICONS: { icon: Glyph; color: string }[] = [
  { icon: "sunny", color: "#ff8c00" },
  { icon: "leaf", color: "#2e7d32" },
  { icon: "flower", color: "#c2185b" },
  { icon: "fish", color: "#0277bd" },
  { icon: "home", color: "#5d4037" },
  { icon: "star", color: "#f9a825" },
  { icon: "heart", color: "#d32f2f" },
  { icon: "musical-notes", color: "#6a1b9a" },
];

export interface FlipCard {
  id: string;
  pairKey: number;
  icon: Glyph;
  color: string;
  revealed: boolean;
  matched: boolean;
}

export function pairsForLevel(level: number): number {
  return { 1: 3, 2: 4, 3: 6, 4: 8 }[level] || 4;
}

export function columnsForLevel(level: number): number {
  return level >= 3 ? 4 : level === 2 ? 4 : 3;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildDeck(level: number): FlipCard[] {
  const pairs = pairsForLevel(level);
  const chosen = ICONS.slice(0, pairs);
  const cards: FlipCard[] = [];
  chosen.forEach((c, idx) => {
    for (let k = 0; k < 2; k++) {
      cards.push({
        id: `${idx}-${k}`,
        pairKey: idx,
        icon: c.icon,
        color: c.color,
        revealed: false,
        matched: false,
      });
    }
  });
  return shuffle(cards);
}

// Score: reward matches, penalize extra moves; accuracy = pairs / moves.
export function scoreFlip(pairs: number, moves: number, hintsUsed: number) {
  const perfect = pairs;
  const accuracy = moves > 0 ? Math.min(100, (perfect / moves) * 100) : 100;
  const score = Math.max(0, pairs * 20 - Math.max(0, moves - pairs) * 5 - hintsUsed * 5);
  return { accuracy, score };
}
