"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { useGameMachine } from "@/hooks/useGameMachine";
import { useKeyboardShortcuts, type KeyMap } from "@/hooks/useKeyboardShortcuts";
import { TIME_LIMIT_MS } from "@/lib/constants";
import { AnswerButtons } from "./AnswerButtons";
import { Feedback } from "./Feedback";
import { QuestionCard } from "./QuestionCard";
import { ResultSummary } from "./ResultSummary";
import { TerminalWindow } from "./TerminalWindow";
import { Timer } from "./Timer";

export function GameScreen() {
  const { state, start, answer, advance, save } = useGameMachine();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  const inQuestion = state.phase === "question";
  const questionIndex = inQuestion ? state.question.index : -1;
  const remainingMs = useCountdown(
    inQuestion ? state.question.timeLimitMs : TIME_LIMIT_MS,
    inQuestion,
    questionIndex,
    useCallback(() => void answer(null), [answer]),
  );

  const keyMap = useMemo((): KeyMap => {
    if (state.phase === "question") {
      const answerTrue = () => void answer(true);
      const answerFalse = () => void answer(false);
      return { v: answerTrue, ArrowLeft: answerTrue, f: answerFalse, ArrowRight: answerFalse };
    }
    if (state.phase === "feedback") return { Enter: () => void advance() };
    return {};
  }, [state.phase, answer, advance]);
  useKeyboardShortcuts(keyMap);

  // Leaving mid-game loses the game (v1), so warn while a question is active.
  const gameActive = state.phase === "question" || state.phase === "feedback";
  useEffect(() => {
    if (!gameActive) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [gameActive]);

  switch (state.phase) {
    case "idle":
    case "loading":
      return (
        <TerminalWindow title="claude-code-quiz">
          <p className="font-mono text-muted" role="status">
            <span className="text-accent">&gt;</span> carregando
            <span className="animate-blink">_</span>
          </p>
        </TerminalWindow>
      );

    case "question":
    case "feedback": {
      const { question } = state;
      return (
        <TerminalWindow title={`pergunta ${question.index + 1}/15`}>
          <div className="space-y-6">
            <QuestionCard
              index={question.index}
              difficulty={question.difficulty}
              category={question.category}
              statement={question.statement}
            />
            {state.phase === "question" ? (
              <>
                <Timer remainingMs={remainingMs} totalMs={question.timeLimitMs} />
                <AnswerButtons disabled={state.submitting} onAnswer={(v) => void answer(v)} />
              </>
            ) : (
              <Feedback key={question.index} feedback={state.feedback} onNext={() => void advance()} />
            )}
          </div>
        </TerminalWindow>
      );
    }

    case "finished":
    case "saved":
      return (
        <ResultSummary
          result={state.result}
          saved={state.phase === "saved" ? state.saved : undefined}
          onSave={save}
          onPlayAgain={() => void start()}
        />
      );

    case "error":
      return (
        <TerminalWindow title="erro">
          <div className="space-y-4" role="alert">
            <p className="font-mono text-error">
              <span aria-hidden>✗ </span>
              {state.message}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void start()}
                className="min-h-11 rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:opacity-90"
              >
                Jogar de novo
              </button>
              <Link
                href="/"
                className="flex min-h-11 items-center rounded-lg border border-border px-4 py-2 hover:border-accent"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </TerminalWindow>
      );
  }
}
