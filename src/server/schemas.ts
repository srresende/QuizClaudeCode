import "server-only";
import { z } from "zod";
import { QUESTIONS_PER_GAME } from "@/lib/constants";

export const sessionIdSchema = z.uuid();

export const nextBodySchema = z.object({ sessionId: sessionIdSchema });

export const answerBodySchema = z.object({
  sessionId: sessionIdSchema,
  index: z.int().min(0).max(QUESTIONS_PER_GAME - 1),
  answer: z.boolean().nullable(),
});

export const saveScoreBodySchema = z.object({
  sessionId: sessionIdSchema,
  nickname: z.string().max(100),
});
