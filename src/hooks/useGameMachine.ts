"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type {
  AnswerResponse,
  GameResultResponse,
  NextQuestionResponse,
  SaveScoreResponse,
} from "@/lib/api-types";
import { ApiClientError, api } from "@/lib/apiClient";

export type Feedback = AnswerResponse & { answer: boolean | null };

export type GameState =
  | { phase: "idle" }
  | { phase: "loading"; sessionId?: string }
  | { phase: "question"; sessionId: string; question: NextQuestionResponse; submitting: boolean }
  | { phase: "feedback"; sessionId: string; question: NextQuestionResponse; feedback: Feedback }
  | { phase: "finished"; sessionId: string; result: GameResultResponse }
  | { phase: "saved"; sessionId: string; result: GameResultResponse; saved: SaveScoreResponse }
  | { phase: "error"; code: string; message: string };

type Action =
  | { type: "loading"; sessionId?: string }
  | { type: "question"; sessionId: string; question: NextQuestionResponse }
  | { type: "submitting" }
  | { type: "feedback"; feedback: Feedback }
  | { type: "finished"; sessionId: string; result: GameResultResponse }
  | { type: "saved"; saved: SaveScoreResponse }
  | { type: "error"; code: string; message: string };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "loading":
      return { phase: "loading", sessionId: action.sessionId };
    case "question":
      return { phase: "question", sessionId: action.sessionId, question: action.question, submitting: false };
    case "submitting":
      return state.phase === "question" ? { ...state, submitting: true } : state;
    case "feedback":
      return state.phase === "question"
        ? { phase: "feedback", sessionId: state.sessionId, question: state.question, feedback: action.feedback }
        : state;
    case "finished":
      return { phase: "finished", sessionId: action.sessionId, result: action.result };
    case "saved":
      return state.phase === "finished" ? { ...state, phase: "saved", saved: action.saved } : state;
    case "error":
      return { phase: "error", code: action.code, message: action.message };
  }
}

function toErrorAction(error: unknown): Action {
  if (error instanceof ApiClientError) {
    return { type: "error", code: error.code, message: error.message };
  }
  return { type: "error", code: "UNKNOWN_ERROR", message: "Erro inesperado. Tente novamente." };
}

export function useGameMachine() {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });
  // Mirrors state for async callbacks and guards against double submissions.
  const stateRef = useRef<GameState>(state);
  const busyRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const run = useCallback(async (task: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await task();
    } catch (error) {
      dispatch(toErrorAction(error));
    } finally {
      busyRef.current = false;
    }
  }, []);

  const loadQuestion = useCallback(async (sessionId: string) => {
    dispatch({ type: "loading", sessionId });
    const question = await api.next(sessionId);
    dispatch({ type: "question", sessionId, question });
  }, []);

  const start = useCallback(
    () =>
      run(async () => {
        dispatch({ type: "loading" });
        const { sessionId } = await api.start();
        await loadQuestion(sessionId);
      }),
    [run, loadQuestion],
  );

  const answer = useCallback(
    (value: boolean | null) =>
      run(async () => {
        const current = stateRef.current;
        if (current.phase !== "question" || current.submitting) return;
        dispatch({ type: "submitting" });
        const response = await api.answer(current.sessionId, current.question.index, value);
        dispatch({ type: "feedback", feedback: { ...response, answer: value } });
      }),
    [run],
  );

  const advance = useCallback(
    () =>
      run(async () => {
        const current = stateRef.current;
        if (current.phase !== "feedback") return;
        if (current.feedback.isLast) {
          dispatch({ type: "loading", sessionId: current.sessionId });
          const result = await api.result(current.sessionId);
          dispatch({ type: "finished", sessionId: current.sessionId, result });
        } else {
          await loadQuestion(current.sessionId);
        }
      }),
    [run, loadQuestion],
  );

  /** Resolves to an error message for the form, or null on success. */
  const save = useCallback(async (nickname: string): Promise<string | null> => {
    const current = stateRef.current;
    if (current.phase !== "finished" || busyRef.current) return null;
    busyRef.current = true;
    try {
      const saved = await api.saveScore(current.sessionId, nickname);
      dispatch({ type: "saved", saved });
      return null;
    } catch (error) {
      return error instanceof ApiClientError ? error.message : "Erro inesperado. Tente novamente.";
    } finally {
      busyRef.current = false;
    }
  }, []);

  return { state, start, answer, advance, save };
}
