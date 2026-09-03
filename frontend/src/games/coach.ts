import { store } from "@/lib/storage";
import { GameId } from "./engine";

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Deterministic adaptive difficulty ("AI coach").
 * Analyzes the patient's own past sessions for this game and returns level 1–4.
 * No manual level picking; no external LLM (safety + offline + explainable).
 *  - No history        -> start gentle at level 1.
 *  - Struggling/frustrated (low accuracy, quit, frustration_signal) -> step down.
 *  - Strong & unaided (high accuracy, few hints)                    -> step up.
 *  - Otherwise hold the last level.
 */
export async function recommendLevel(patientId: string, gameId: GameId): Promise<number> {
  const all = await store.getAll("game_sessions");
  const hist = all
    .filter((s: any) => s.patient_id === patientId && s.game_id === gameId)
    .sort((a: any, b: any) => String(a.played_at).localeCompare(String(b.played_at)));
  if (hist.length === 0) return 1;

  const lastLevel = hist[hist.length - 1].difficulty_level || 1;
  const recent = hist.slice(-3);
  const avgAcc = mean(recent.map((s: any) => s.accuracy || 0));
  const avgHints = mean(recent.map((s: any) => s.hints_used || 0));
  const struggled =
    recent.some((s: any) => s.frustration_signal) ||
    recent.some((s: any) => s.quit_event) ||
    avgAcc < 55;
  const mastered = avgAcc >= 85 && avgHints <= 1;

  let level = lastLevel;
  if (struggled) level = lastLevel - 1;
  else if (mastered) level = lastLevel + 1;
  return clamp(level, 1, 4);
}
