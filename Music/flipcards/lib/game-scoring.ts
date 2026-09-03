export type ScoreMetrics = {
  time: number;
  moves: number;
  accuracy: number;
  streak: number;
};

export const getAccuracy = (pairs: number, moves: number) =>
  moves === 0 ? 100 : Math.round((pairs / moves) * 100);

export const calculateScore = (result: ScoreMetrics) => {
  const pairPoints = result.streak * 100;
  const accuracyBonus = Math.round(result.accuracy * 2);
  const speedBonus = Math.max(0, 300 - result.time * 4);
  const streakBonus = Math.max(0, result.streak - 1) * 25;
  const mismatchPenalty = Math.max(0, result.moves - result.streak) * 15;
  return Math.max(0, pairPoints + accuracyBonus + speedBonus + streakBonus - mismatchPenalty);
};
