import { describe, expect, it } from "vitest";

import { calculateScore, getAccuracy } from "../lib/game-scoring";

describe("Memory Match scoring", () => {
  it("returns perfect accuracy before the first move", () => {
    expect(getAccuracy(0, 0)).toBe(100);
  });

  it("rounds match accuracy to a whole percentage", () => {
    expect(getAccuracy(4, 6)).toBe(67);
  });

  it("rewards a fast perfect round", () => {
    expect(calculateScore({ time: 20, moves: 8, accuracy: 100, streak: 8 })).toBe(1395);
  });

  it("applies mismatch penalties and never returns a negative score", () => {
    expect(calculateScore({ time: 75, moves: 12, accuracy: 67, streak: 4 })).toBe(489);
    expect(calculateScore({ time: 600, moves: 100, accuracy: 0, streak: 0 })).toBe(0);
  });
});
