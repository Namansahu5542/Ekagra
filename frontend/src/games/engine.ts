import { store } from "@/lib/storage";
import { nowIso, uuid } from "@/lib/ids";

export type GameId = "flip_cards" | "number_cards" | "whack_the_ball";

export interface SessionInput {
  patientId: string;
  gameId: GameId;
  difficulty: number;
  score: number;
  accuracy: number;
  completionTimeMs: number | null;
  hintsUsed: number;
  skippedQuestions: number;
  quitEvent: boolean;
  frustrationSignal: boolean;
}

// Persist a game session locally using the EXACT canonical field names.
export async function recordSession(input: SessionInput) {
  const rec = {
    session_id: uuid(),
    patient_id: input.patientId,
    game_id: input.gameId,
    difficulty_level: input.difficulty,
    score: Math.round(input.score),
    accuracy: Math.round(input.accuracy * 10) / 10,
    completion_time_ms: input.completionTimeMs,
    hints_used: input.hintsUsed,
    skipped_questions: input.skippedQuestions,
    quit_event: input.quitEvent,
    frustration_signal: input.frustrationSignal,
    played_at: nowIso(),
    synced: false,
  };
  await store.upsert("game_sessions", rec.session_id, rec);
  return rec;
}
