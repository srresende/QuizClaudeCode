import { describe, expect, it } from "vitest";
import { gameReducer, type GameState } from "@/hooks/useGameMachine";
import type { NextQuestionResponse } from "@/lib/api-types";

const question: NextQuestionResponse = {
  id: "q1",
  index: 3,
  difficulty: "facil",
  category: "fundamentos",
  statement: "Afirmação",
  timeLimitMs: 10_000,
};

const error = (code: string) => ({ type: "error" as const, code, message: "falhou" });

describe("gameReducer error handling", () => {
  it("keeps the session so a failed answer can be resumed", () => {
    const state: GameState = { phase: "question", sessionId: "s1", question, submitting: true };

    expect(gameReducer(state, error("NETWORK_ERROR"))).toEqual({
      phase: "error",
      code: "NETWORK_ERROR",
      message: "falhou",
      sessionId: "s1",
    });
  });

  it("keeps the session when loading the next question fails", () => {
    const state: GameState = { phase: "loading", sessionId: "s1" };

    expect(gameReducer(state, error("ALREADY_ANSWERED"))).toMatchObject({ sessionId: "s1" });
  });

  it("keeps the session across a failed resume", () => {
    const state: GameState = { phase: "error", code: "NETWORK_ERROR", message: "falhou", sessionId: "s1" };

    expect(gameReducer(state, error("NETWORK_ERROR"))).toMatchObject({ sessionId: "s1" });
  });

  it("has nothing to resume when the game never started", () => {
    expect(gameReducer({ phase: "loading" }, error("NETWORK_ERROR"))).toMatchObject({
      phase: "error",
      sessionId: undefined,
    });
  });

  it.each(["SESSION_EXPIRED", "SESSION_NOT_FOUND"])("drops the session after %s", (code) => {
    const state: GameState = { phase: "question", sessionId: "s1", question, submitting: true };

    expect(gameReducer(state, error(code))).toMatchObject({ phase: "error", sessionId: undefined });
  });
});
