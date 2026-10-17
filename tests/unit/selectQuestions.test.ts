import { describe, expect, it } from "vitest";
import { QUESTIONS_PER_DIFFICULTY, QUESTIONS_PER_GAME } from "@/lib/constants";
import { CATEGORIES, DIFFICULTIES } from "@/lib/types";
import type { Category, Difficulty, Question } from "@/lib/types";
import { getAllQuestions } from "@/server/questions";
import { selectQuestions } from "@/server/selectQuestions";

function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeQuestion(id: string, difficulty: Difficulty, category: Category): Question {
  return { id, difficulty, category, statement: id, answer: true, explanation: id };
}

describe("selectQuestions", () => {
  const bank = getAllQuestions();
  const byId = new Map(bank.map((q) => [q.id, q]));

  it.each([1, 2, 3, 42, 1234])("builds a valid game (seed %i)", (seed) => {
    const ids = selectQuestions(bank, seeded(seed));

    expect(ids).toHaveLength(QUESTIONS_PER_GAME);
    expect(new Set(ids).size).toBe(QUESTIONS_PER_GAME);

    DIFFICULTIES.forEach((difficulty, blockIndex) => {
      const block = ids
        .slice(blockIndex * QUESTIONS_PER_DIFFICULTY, (blockIndex + 1) * QUESTIONS_PER_DIFFICULTY)
        .map((id) => byId.get(id)!);
      expect(block.every((q) => q.difficulty === difficulty)).toBe(true);
      for (const category of CATEGORIES) {
        expect(block.some((q) => q.category === category)).toBe(true);
      }
    });
  });

  it("is deterministic for the same random source", () => {
    expect(selectQuestions(bank, seeded(7))).toEqual(selectQuestions(bank, seeded(7)));
  });

  it("varies across random sources", () => {
    const games = new Set([1, 2, 3, 4, 5].map((s) => selectQuestions(bank, seeded(s)).join()));
    expect(games.size).toBeGreaterThan(1);
  });

  it("works with the minimum bank of 5 questions per difficulty", () => {
    const minimal = DIFFICULTIES.flatMap((d) => [
      ...CATEGORIES.map((c) => makeQuestion(`${d}-${c}`, d, c)),
      makeQuestion(`${d}-extra-1`, d, "features"),
      makeQuestion(`${d}-extra-2`, d, "fundamentos"),
    ]);
    const ids = selectQuestions(minimal, seeded(9));
    expect(new Set(ids)).toEqual(new Set(minimal.map((q) => q.id)));
  });

  it("throws when a difficulty has fewer than 5 questions", () => {
    const medio = bank.filter((q) => q.difficulty === "medio");
    const fewer = bank.filter((q) => q.difficulty !== "medio").concat(medio.slice(0, 4));
    expect(() => selectQuestions(fewer)).toThrow(/medio/);
  });
});
