import { describe, expect, it } from "vitest";
import rawQuestions from "@/data/questions.json";
import { QUESTIONS_PER_DIFFICULTY } from "@/lib/constants";
import { CATEGORIES, DIFFICULTIES } from "@/lib/types";
import { questionBankSchema } from "@/server/questions";

describe("questions.json", () => {
  const questions = questionBankSchema.parse(rawQuestions);

  it("matches the schema", () => {
    expect(questionBankSchema.safeParse(rawQuestions).success).toBe(true);
  });

  it("has unique ids", () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(DIFFICULTIES)(
    "has enough questions and every category for difficulty %s",
    (difficulty) => {
      const pool = questions.filter((q) => q.difficulty === difficulty);
      expect(pool.length).toBeGreaterThanOrEqual(QUESTIONS_PER_DIFFICULTY);
      for (const category of CATEGORIES) {
        expect(pool.some((q) => q.category === category)).toBe(true);
      }
    },
  );
});
