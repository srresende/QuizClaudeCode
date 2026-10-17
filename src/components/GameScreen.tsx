"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { useGameMachine } from "@/hooks/useGameMachine";
import { useKeyboardShortcuts, type KeyMap } from "@/hooks/useKeyboardShortcuts";
import { feedbackAnnouncement } from "@/lib/feedback";
import { AnswerButtons } from "./AnswerButtons";
import { Feedback } from "./Feedback";
import { QuestionCard } from "./QuestionCard";
import { ResultSummary } from "./ResultSummary";
import { TerminalWindow } from "./TerminalWindow";
import { Timer } from "./Timer";

interface QuestionTimerProps {
  questionIndex: number;
  timeLimitMs: number;
  onExpire: () => void;
}

/** Owns the countdown so its 100ms ticks re-render only the timer, not the whole game screen. */
function QuestionTimer({ questionIndex, timeLimitMs, onExpire }: QuestionTimerProps) {
  const remainingMs = useCountdown(timeLimitMs, true, questionIndex, onExpire);
  return <Timer remainingMs={remainingMs} totalMs={timeLimitMs} />;
}

export function GameScreen() {
  const { state, start, answer, advance, resume, save } = useGameMachine();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  const expire = useCallback(() => void answer(null), [answer]);

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
                <QuestionTimer
                  questionIndex={question.index}
                  timeLimitMs={question.timeLimitMs}
                  onExpire={expire}
                />
                <AnswerButtons disabled={state.submitting} onAnswer={(v) => void answer(v)} />
              </>
            ) : (
              <Feedback key={question.index} feedback={state.feedback} onNext={() => void advance()} />
            )}
          </div>
          {/* Stays mounted from question to feedback so the verdict is announced as a change. */}
          <p className="sr-only" role="status">
            {state.phase === "feedback" ? feedbackAnnouncement(state.feedback) : ""}
          </p>
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
              {state.sessionId !== undefined && (
                <button
                  type="button"
                  onClick={() => void resume()}
                  className="min-h-11 rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:opacity-90"
                >
                  Continuar partida
                </button>
              )}
              <button
                type="button"
                onClick={() => void start()}
                className={
                  state.sessionId !== undefined
                    ? "min-h-11 rounded-lg border border-border px-4 py-2 hover:border-accent"
                    : "min-h-11 rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:opacity-90"
                }
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
