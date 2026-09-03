export const BALL_COLORS = [
  { key: "red", value: "#e53935" },
  { key: "blue", value: "#1e88e5" },
  { key: "green", value: "#2e7d32" },
  { key: "yellow", value: "#f9a825" },
];

export interface WhackConfig {
  durationMs: number;
  spawnIntervalMs: number;
  ballLifetimeMs: number;
  maxBalls: number;
}

export function configForLevel(level: number): WhackConfig {
  const table: Record<number, WhackConfig> = {
    1: { durationMs: 45000, spawnIntervalMs: 1400, ballLifetimeMs: 2600, maxBalls: 3 },
    2: { durationMs: 45000, spawnIntervalMs: 1100, ballLifetimeMs: 2200, maxBalls: 4 },
    3: { durationMs: 45000, spawnIntervalMs: 900, ballLifetimeMs: 1800, maxBalls: 5 },
    4: { durationMs: 45000, spawnIntervalMs: 750, ballLifetimeMs: 1500, maxBalls: 6 },
  };
  return table[level] || table[2];
}

export function pickColor() {
  return BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
}

// Hit target color: +2, wrong color: -1, expiry: 0. Accuracy = correct / attempted taps.
export function scoreWhack(correct: number, wrong: number) {
  const attempted = correct + wrong;
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;
  const score = Math.max(0, correct * 2 - wrong);
  return { accuracy, score };
}
