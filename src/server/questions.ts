import "server-only";
import { z } from "zod";
import rawQuestions from "@/data/questions.json";
import { CATEGORIES, DIFFICULTIES } from "@/lib/types";
import type { Difficulty, Question } from "@/lib/types";

export const questionSchema = z.object({
  id: z.string().min(1),
  category: z.enum(CATEGORIES),
  difficulty: z.enum(DIFFICULTIES),
  statement: z.string().trim().min(1),
  answer: z.boolean(),
  explanation: z.string().trim().min(1),
});

export const questionBankSchema = z.array(questionSchema);

const questions: Question[] = questionBankSchema.parse(rawQuestions);
const byId = new Map(questions.map((q) => [q.id, q]));

export function getAllQuestions(): readonly Question[] {
  return questions;
}

export function getQuestionById(id: string): Question | undefined {
  return byId.get(id);
}

export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
  return questions.filter((q) => q.difficulty === difficulty);
}
