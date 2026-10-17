import { describe, expect, it } from "vitest";
import { scoreAnswer } from "@/server/scoring";

describe("scoreAnswer", () => {
  it("scores a correct answer", () => {
    expect(scoreAnswer(true, true, 3200)).toEqual({ correct: true, timedOut: false, timeMs: 3200 });
  });

  it("scores a wrong answer", () => {
    expect(scoreAnswer(false, true, 4100)).toEqual({ correct: false, timedOut: false, timeMs: 4100 });
  });

  it("treats a null answer as timeout", () => {
    expect(scoreAnswer(null, false, 10050)).toEqual({ correct: false, timedOut: true, timeMs: 10000 });
  });

  it("treats a late answer (> 12s) as timeout even if right", () => {
    expect(scoreAnswer(true, true, 12001)).toEqual({ correct: false, timedOut: true, timeMs: 10000 });
  });

  it("accepts answers within the network grace and caps time at 10s", () => {
    expect(scoreAnswer(true, true, 11500)).toEqual({ correct: true, timedOut: false, timeMs: 10000 });
    expect(scoreAnswer(true, true, 12000)).toEqual({ correct: true, timedOut: false, timeMs: 10000 });
  });

  it("never records negative time", () => {
    expect(scoreAnswer(true, true, -5).timeMs).toBe(0);
  });
});
