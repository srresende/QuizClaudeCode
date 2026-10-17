import "server-only";
import { QUESTIONS_PER_DIFFICULTY } from "@/lib/constants";
import { CATEGORIES, DIFFICULTIES } from "@/lib/types";
import type { Question } from "@/lib/types";

export type RandomFn = () => number;

function shuffle<T>(items: readonly T[], random: RandomFn): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function takeRandom<T>(pool: T[], random: RandomFn): T {
  const index = Math.floor(random() * pool.length);
  return pool.splice(index, 1)[0];
}

/**
 * Picks the question ids for one game: one block per difficulty (easy → hard).
 * Each block has one question per category plus random fillers, shuffled.
 */
export function selectQuestions(
  bank: readonly Question[],
  random: RandomFn = Math.random,
): string[] {
  return DIFFICULTIES.flatMap((difficulty) => {
    const remaining = bank.filter((q) => q.difficulty === difficulty);
    if (remaining.length < QUESTIONS_PER_DIFFICULTY) {
      throw new Error(
        `Not enough "${difficulty}" questions: need ${QUESTIONS_PER_DIFFICULTY}, have ${remaining.length}`,
      );
    }

    const block: Question[] = [];
    for (const category of CATEGORIES) {
      const ofCategory = remaining.filter((q) => q.category === category);
      if (ofCategory.length === 0) continue;
      const picked = takeRandom(ofCategory, random);
      block.push(picked);
      remaining.splice(remaining.indexOf(picked), 1);
    }
    while (block.length < QUESTIONS_PER_DIFFICULTY) {
      block.push(takeRandom(remaining, random));
    }

    return shuffle(block, random).map((q) => q.id);
  });
}
