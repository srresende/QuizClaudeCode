import type { Category, Difficulty, PublicQuestion } from "./types";

export interface ApiError {
  error: { code: string; message: string };
}

export interface StartGameResponse {
  sessionId: string;
  totalQuestions: number;
  timeLimitMs: number;
}

export type NextQuestionResponse = PublicQuestion & { timeLimitMs: number };

export interface AnswerResponse {
  correct: boolean;
  timedOut: boolean;
  correctAnswer: boolean;
  explanation: string;
  isLast: boolean;
}

export interface Tally {
  correct: number;
  total: number;
}

export interface GameResultResponse {
  correctCount: number;
  totalTimeMs: number;
  byDifficulty: Record<Difficulty, Tally>;
  byCategory: Record<Category, Tally>;
  saved: boolean;
}

export interface SaveScoreResponse {
  scoreId: string;
  position: number;
}

export interface ScoreRow {
  id: string;
  nickname: string;
  correctCount: number;
  totalTimeMs: number;
  createdAt: string;
  position: number;
}

export interface RankingResponse {
  top: ScoreRow[];
  highlighted?: ScoreRow;
}
