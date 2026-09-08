export interface NumberQuestion {
  prompt: string;
  options: number[];
  answer: number;
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeOptions(answer: number): number[] {
  const set = new Set<number>([answer]);
  while (set.size < 3) {
    const delta = rnd(1, 4) * (Math.random() < 0.5 ? -1 : 1);
    const cand = answer + delta;
    if (cand >= 0) set.add(cand);
  }
  return [...set].sort(() => Math.random() - 0.5);
}

function makeQuestion(level: number): NumberQuestion {
  let a: number, b: number, answer: number, prompt: string;
  if (level === 1) {
    a = rnd(1, 5); b = rnd(1, 5); answer = a + b; prompt = `${a} + ${b} = ?`;
  } else if (level === 2) {
    a = rnd(3, 12); b = rnd(1, a); const add = Math.random() < 0.5;
    answer = add ? a + b : a - b; prompt = `${a} ${add ? "+" : "−"} ${b} = ?`;
  } else if (level === 3) {
    const kind = rnd(0, 2);
    if (kind === 0) { a = rnd(2, 6); b = rnd(2, 6); answer = a * b; prompt = `${a} × ${b} = ?`; }
    else if (kind === 1) { a = rnd(10, 30); b = rnd(1, 9); answer = a - b; prompt = `${a} − ${b} = ?`; }
    else { const start = rnd(2, 6); const step = rnd(2, 4); answer = start + step * 3; prompt = `${start}, ${start + step}, ${start + step * 2}, ?`; }
  } else {
    const kind = rnd(0, 2);
    if (kind === 0) { b = rnd(2, 6); answer = rnd(2, 9); a = b * answer; prompt = `${a} ÷ ${b} = ?`; }
    else if (kind === 1) { a = rnd(4, 9); b = rnd(3, 8); answer = a * b; prompt = `${a} × ${b} = ?`; }
    else { const start = rnd(3, 9); const step = rnd(3, 6); answer = start + step * 4; prompt = `${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ?`; }
  }
  return { prompt, options: makeOptions(answer), answer };
}

export function buildRound(level: number, count = 5): NumberQuestion[] {
  return Array.from({ length: count }, () => makeQuestion(level));
}

export function scoreNumbers(correct: number, total: number, hintsUsed: number, skipped: number) {
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const score = Math.max(0, correct * 20 - hintsUsed * 5 - skipped * 5);
  return { accuracy, score };
}
