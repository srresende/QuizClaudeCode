import "server-only";
import type {
  AnswerResponse,
  GameResultResponse,
  NextQuestionResponse,
  SaveScoreResponse,
  StartGameResponse,
  Tally,
} from "@/lib/api-types";
import { QUESTIONS_PER_GAME, SESSION_TTL_MS, TIME_LIMIT_MS } from "@/lib/constants";
import { validateNickname } from "@/lib/nickname";
import { CATEGORIES, DIFFICULTIES } from "@/lib/types";
import type { Category, Difficulty, Question } from "@/lib/types";
import { AppError } from "./http";
import { getAllQuestions, getQuestionById } from "./questions";
import { scoreAnswer } from "./scoring";
import { selectQuestions } from "./selectQuestions";
import { getSupabase } from "./supabase";

type SessionStatus = "in_progress" | "finished" | "saved";

interface StoredAnswer {
  questionId: string;
  answer: boolean | null;
  correct: boolean;
  timeMs: number;
  timedOut: boolean;
}

interface SessionRow {
  id: string;
  question_ids: string[];
  current_index: number;
  current_served_at: string | null;
  answers: StoredAnswer[];
  correct_count: number;
  total_time_ms: number;
  status: SessionStatus;
  created_at: string;
  finished_at: string | null;
}

const SESSIONS = "game_sessions";

async function loadSession(sessionId: string): Promise<SessionRow> {
  const { data, error } = await getSupabase()
    .from(SESSIONS)
    .select("*")
    .eq("id", sessionId)
    .maybeSingle<SessionRow>();
  if (error) throw error;
  if (!data) throw new AppError("SESSION_NOT_FOUND", "Partida não encontrada.", 404);
  return data;
}

function assertInProgress(session: SessionRow) {
  if (session.status !== "in_progress") {
    throw new AppError("GAME_NOT_IN_PROGRESS", "Esta partida já terminou.", 409);
  }
  if (Date.now() - Date.parse(session.created_at) > SESSION_TTL_MS) {
    throw new AppError("SESSION_EXPIRED", "A partida expirou. Comece uma nova.", 410);
  }
}

function questionAt(session: SessionRow, index: number): Question {
  const question = getQuestionById(session.question_ids[index]);
  if (!question) throw new Error(`Unknown question id in session ${session.id}`);
  return question;
}

export async function startGame(): Promise<StartGameResponse> {
  const { data, error } = await getSupabase()
    .from(SESSIONS)
    .insert({ question_ids: selectQuestions(getAllQuestions()) })
    .select("id")
    .single<{ id: string }>();
  if (error) throw error;
  return { sessionId: data.id, totalQuestions: QUESTIONS_PER_GAME, timeLimitMs: TIME_LIMIT_MS };
}

export async function nextQuestion(sessionId: string): Promise<NextQuestionResponse> {
  const session = await loadSession(sessionId);
  assertInProgress(session);

  const index = session.current_index;
  const question = questionAt(session, index);

  // Serve once: a repeated call returns the same question without restarting the timer.
  if (session.current_served_at === null) {
    const { error } = await getSupabase()
      .from(SESSIONS)
      .update({ current_served_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("current_index", index)
      .eq("status", "in_progress")
      .is("current_served_at", null);
    if (error) throw error;
  }

  return {
    index,
    category: question.category,
    difficulty: question.difficulty,
    statement: question.statement,
    id: question.id,
    timeLimitMs: TIME_LIMIT_MS,
  };
}

export async function answerQuestion(
  sessionId: string,
  index: number,
  answer: boolean | null,
): Promise<AnswerResponse> {
  const session = await loadSession(sessionId);
  if (session.status !== "in_progress" || index < session.current_index) {
    throw new AppError("ALREADY_ANSWERED", "Esta pergunta já foi respondida.", 409);
  }
  if (index !== session.current_index) {
    throw new AppError("INVALID_INDEX", "Pergunta fora de ordem.", 409);
  }
  if (session.current_served_at === null) {
    throw new AppError("QUESTION_NOT_SERVED", "A pergunta ainda não foi exibida.", 409);
  }

  const question = questionAt(session, index);
  const elapsedMs = Date.now() - Date.parse(session.current_served_at);
  const scored = scoreAnswer(answer, question.answer, elapsedMs);
  const isLast = index === QUESTIONS_PER_GAME - 1;

  const stored: StoredAnswer = { questionId: question.id, answer, ...scored };
  const { data, error } = await getSupabase()
    .from(SESSIONS)
    .update({
      current_index: index + 1,
      current_served_at: null,
      correct_count: session.correct_count + (scored.correct ? 1 : 0),
      total_time_ms: session.total_time_ms + scored.timeMs,
      answers: [...session.answers, stored],
      ...(isLast && { status: "finished", finished_at: new Date().toISOString() }),
    })
    .eq("id", sessionId)
    .eq("current_index", index)
    .eq("status", "in_progress")
    .select("id");
  if (error) throw error;
  if (data.length === 0) {
    throw new AppError("ALREADY_ANSWERED", "Esta pergunta já foi respondida.", 409);
  }

  return {
    correct: scored.correct,
    timedOut: scored.timedOut,
    correctAnswer: question.answer,
    explanation: question.explanation,
    isLast,
  };
}

function emptyTallies<K extends string>(keys: readonly K[]): Record<K, Tally> {
  return Object.fromEntries(keys.map((k) => [k, { correct: 0, total: 0 }])) as Record<K, Tally>;
}

export async function getResult(sessionId: string): Promise<GameResultResponse> {
  const session = await loadSession(sessionId);
  if (session.status === "in_progress") {
    throw new AppError("GAME_NOT_FINISHED", "A partida ainda não terminou.", 409);
  }

  const byDifficulty = emptyTallies<Difficulty>(DIFFICULTIES);
  const byCategory = emptyTallies<Category>(CATEGORIES);
  for (const item of session.answers) {
    const question = getQuestionById(item.questionId);
    if (!question) continue;
    for (const tally of [byDifficulty[question.difficulty], byCategory[question.category]]) {
      tally.total += 1;
      if (item.correct) tally.correct += 1;
    }
  }

  return {
    correctCount: session.correct_count,
    totalTimeMs: session.total_time_ms,
    byDifficulty,
    byCategory,
    saved: session.status === "saved",
  };
}

const SAVE_ERRORS: Record<string, [message: string, status: number]> = {
  SESSION_NOT_FOUND: ["Partida não encontrada.", 404],
  ALREADY_SAVED: ["Esta partida já foi salva no ranking.", 409],
  SESSION_NOT_FINISHED: ["A partida ainda não terminou.", 409],
  SESSION_EXPIRED: ["O prazo para salvar esta partida expirou.", 410],
};

export async function saveScore(sessionId: string, nickname: string): Promise<SaveScoreResponse> {
  const validation = validateNickname(nickname);
  if (!validation.ok) throw new AppError("INVALID_NICKNAME", validation.error, 400);

  const { data, error } = await getSupabase()
    .rpc("save_score", { p_session_id: sessionId, p_nickname: validation.value })
    .single<{ score_id: string; score_position: number }>();
  if (error) {
    const code = error.code === "23505" ? "ALREADY_SAVED" : error.message;
    const known = SAVE_ERRORS[code];
    if (known) throw new AppError(code, ...known);
    throw error;
  }
  return { scoreId: data.score_id, position: data.score_position };
}
