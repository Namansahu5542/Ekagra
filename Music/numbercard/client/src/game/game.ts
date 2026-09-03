export type GameMode = "mixed" | "addition" | "subtraction" | "multiplication" | "division" | "sequence";

export type QuestionType = Exclude<GameMode, "mixed">;

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  answer: number;
  options: number[];
  hint: string;
};

export type QuestionResult = {
  id: string;
  type: QuestionType;
  prompt: string;
  answer: number;
  chosen: number;
  correct: boolean;
  attempts: number;
  hintUsed: boolean;
  responseMs: number;
};

export type RoundSummary = {
  mode: GameMode;
  modeLabel: string;
  startedAt: string;
  finishedAt: string;
  elapsedSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageResponseSeconds: number;
  hintsUsed: number;
  results: QuestionResult[];
};

export const MODE_LABELS: Record<GameMode, string> = {
  mixed: "A little of everything",
  addition: "Adding together",
  subtraction: "Taking away",
  multiplication: "Making groups",
  division: "Sharing equally",
  sequence: "Number patterns",
};

const questionSets: Record<GameMode, Question[]> = {
  mixed: [
    { id: "mix-1", type: "addition", prompt: "6 + 3 = ?", answer: 9, options: [8, 9, 10], hint: "Count three more after 6." },
    { id: "mix-2", type: "subtraction", prompt: "10 − 4 = ?", answer: 6, options: [5, 6, 7], hint: "Take four away from ten." },
    { id: "mix-3", type: "multiplication", prompt: "3 × 2 = ?", answer: 6, options: [5, 6, 8], hint: "Think of 3 groups of 2." },
    { id: "mix-4", type: "division", prompt: "12 ÷ 3 = ?", answer: 4, options: [3, 4, 5], hint: "Share 12 into 3 equal groups." },
    { id: "mix-5", type: "sequence", prompt: "What comes next? 2, 4, 6, ?", answer: 8, options: [7, 8, 9], hint: "The numbers grow by two." },
  ],
  addition: [
    { id: "add-1", type: "addition", prompt: "4 + 3 = ?", answer: 7, options: [6, 7, 8], hint: "Count three more after 4." },
    { id: "add-2", type: "addition", prompt: "8 + 2 = ?", answer: 10, options: [9, 10, 12], hint: "Adding two makes the next round number." },
    { id: "add-3", type: "addition", prompt: "5 + 5 = ?", answer: 10, options: [8, 10, 12], hint: "Two fives make ten." },
    { id: "add-4", type: "addition", prompt: "7 + 2 = ?", answer: 9, options: [8, 9, 11], hint: "Count two steps after 7." },
    { id: "add-5", type: "addition", prompt: "6 + 6 = ?", answer: 12, options: [10, 11, 12], hint: "Double six." },
  ],
  subtraction: [
    { id: "sub-1", type: "subtraction", prompt: "9 − 3 = ?", answer: 6, options: [5, 6, 7], hint: "Take three steps back from 9." },
    { id: "sub-2", type: "subtraction", prompt: "10 − 2 = ?", answer: 8, options: [7, 8, 9], hint: "Two less than ten." },
    { id: "sub-3", type: "subtraction", prompt: "12 − 5 = ?", answer: 7, options: [6, 7, 8], hint: "Take five away from twelve." },
    { id: "sub-4", type: "subtraction", prompt: "8 − 4 = ?", answer: 4, options: [3, 4, 5], hint: "Four is halfway from 8 to 0." },
    { id: "sub-5", type: "subtraction", prompt: "11 − 1 = ?", answer: 10, options: [9, 10, 12], hint: "One less than eleven." },
  ],
  multiplication: [
    { id: "mul-1", type: "multiplication", prompt: "2 × 3 = ?", answer: 6, options: [5, 6, 7], hint: "Two groups of three." },
    { id: "mul-2", type: "multiplication", prompt: "4 × 2 = ?", answer: 8, options: [6, 8, 10], hint: "Double four." },
    { id: "mul-3", type: "multiplication", prompt: "3 × 3 = ?", answer: 9, options: [6, 8, 9], hint: "Three groups of three." },
    { id: "mul-4", type: "multiplication", prompt: "5 × 2 = ?", answer: 10, options: [8, 10, 12], hint: "Five pairs make ten." },
    { id: "mul-5", type: "multiplication", prompt: "2 × 6 = ?", answer: 12, options: [10, 11, 12], hint: "Double six." },
  ],
  division: [
    { id: "div-1", type: "division", prompt: "6 ÷ 2 = ?", answer: 3, options: [2, 3, 4], hint: "Share six between two people." },
    { id: "div-2", type: "division", prompt: "8 ÷ 2 = ?", answer: 4, options: [3, 4, 5], hint: "How many pairs are in eight?" },
    { id: "div-3", type: "division", prompt: "10 ÷ 2 = ?", answer: 5, options: [4, 5, 6], hint: "Half of ten is five." },
    { id: "div-4", type: "division", prompt: "12 ÷ 4 = ?", answer: 3, options: [2, 3, 4], hint: "Four groups of three make twelve." },
    { id: "div-5", type: "division", prompt: "9 ÷ 3 = ?", answer: 3, options: [2, 3, 4], hint: "Three groups of three make nine." },
  ],
  sequence: [
    { id: "seq-1", type: "sequence", prompt: "What comes next? 1, 2, 3, ?", answer: 4, options: [3, 4, 5], hint: "The numbers go up by one." },
    { id: "seq-2", type: "sequence", prompt: "What comes next? 5, 6, 7, ?", answer: 8, options: [7, 8, 9], hint: "The numbers go up by one." },
    { id: "seq-3", type: "sequence", prompt: "What comes next? 2, 4, 6, ?", answer: 8, options: [7, 8, 10], hint: "The numbers grow by two." },
    { id: "seq-4", type: "sequence", prompt: "What comes next? 10, 8, 6, ?", answer: 4, options: [3, 4, 5], hint: "The numbers go down by two." },
    { id: "seq-5", type: "sequence", prompt: "What comes next? 3, 6, 9, ?", answer: 12, options: [10, 11, 12], hint: "The numbers grow by three." },
  ],
};

function cloneQuestions(mode: GameMode): Question[] {
  return questionSets[mode].map((question) => ({ ...question, options: [...question.options] }));
}

export class GameSession {
  readonly mode: GameMode;
  readonly questions: Question[];
  private index = 0;
  private startedAt = Date.now();
  private questionStartedAt = Date.now();
  private questionPausedMs = 0;
  private pausedAt = 0;
  private totalPausedMs = 0;
  private currentAttempts = 0;
  private currentHintUsed = false;
  private results: QuestionResult[] = [];

  constructor(mode: GameMode) {
    this.mode = mode;
    this.questions = cloneQuestions(mode);
  }

  get current(): Question | null {
    return this.questions[this.index] ?? null;
  }

  get currentIndex(): number {
    return this.index;
  }

  get totalQuestions(): number {
    return this.questions.length;
  }

  get isComplete(): boolean {
    return this.index >= this.questions.length;
  }

  get isPaused(): boolean {
    return this.pausedAt > 0;
  }

  get elapsedSeconds(): number {
    const now = Date.now();
    const pausedNow = this.pausedAt ? now - this.pausedAt : 0;
    return Math.max(0, Math.round((now - this.startedAt - this.totalPausedMs - pausedNow) / 1000));
  }

  pause() {
    if (!this.isComplete && !this.pausedAt) this.pausedAt = Date.now();
  }

  resume() {
    if (this.pausedAt) {
      const pausedFor = Date.now() - this.pausedAt;
      this.totalPausedMs += pausedFor;
      this.questionPausedMs += pausedFor;
      this.pausedAt = 0;
    }
  }

  useHint(): string {
    this.currentHintUsed = true;
    return this.current?.hint ?? "Take your time. You are doing well.";
  }

  answer(chosen: number): { wasCorrect: boolean; completed: boolean; question: Question; attempts: number } | null {
    const question = this.current;
    if (!question || this.isPaused) return null;
    this.currentAttempts += 1;
    const wasCorrect = chosen === question.answer;
    if (!wasCorrect) return { wasCorrect, completed: false, question, attempts: this.currentAttempts };

    const responseMs = Math.max(250, Date.now() - this.questionStartedAt - this.questionPausedMs);
    this.results.push({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      answer: question.answer,
      chosen,
      correct: true,
      attempts: this.currentAttempts,
      hintUsed: this.currentHintUsed,
      responseMs,
    });
    this.index += 1;
    this.currentAttempts = 0;
    this.currentHintUsed = false;
    this.questionStartedAt = Date.now();
    this.questionPausedMs = 0;
    return { wasCorrect, completed: this.isComplete, question, attempts: this.results.at(-1)?.attempts ?? 1 };
  }

  summary(): RoundSummary {
    const elapsedSeconds = this.elapsedSeconds;
    const correctAnswers = this.results.filter((result) => result.correct).length;
    const totalResponseMs = this.results.reduce((sum, result) => sum + result.responseMs, 0);
    return {
      mode: this.mode,
      modeLabel: MODE_LABELS[this.mode],
      startedAt: new Date(this.startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      elapsedSeconds,
      totalQuestions: this.questions.length,
      correctAnswers,
      accuracy: this.questions.length ? Math.round((correctAnswers / this.questions.length) * 100) : 0,
      averageResponseSeconds: this.results.length ? Math.round((totalResponseMs / this.results.length) / 100) / 10 : 0,
      hintsUsed: this.results.filter((result) => result.hintUsed).length,
      results: this.results,
    };
  }
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function getStoredSummaries(): RoundSummary[] {
  try {
    const stored = localStorage.getItem("number-garden-history");
    return stored ? (JSON.parse(stored) as RoundSummary[]) : [];
  } catch {
    return [];
  }
}

export function storeSummary(summary: RoundSummary): RoundSummary[] {
  const next = [summary, ...getStoredSummaries()].slice(0, 6);
  try {
    localStorage.setItem("number-garden-history", JSON.stringify(next));
  } catch {
    // Local storage is a bonus; the current summary remains available in memory.
  }
  return next;
}
