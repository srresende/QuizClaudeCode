"use client";

import { useEffect, useRef } from "react";
import type { Feedback as FeedbackData } from "@/hooks/useGameMachine";

interface FeedbackProps {
  feedback: FeedbackData;
  onNext: () => void;
}

export function Feedback({ feedback, onNext }: FeedbackProps) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const { correct, timedOut, correctAnswer, explanation, isLast } = feedback;

  useEffect(() => {
    nextRef.current?.focus();
  }, []);

  const title = correct ? "Correto!" : timedOut ? "Tempo esgotado" : "Incorreto";

  return (
    <div className="space-y-4" role="status">
      <p
        className={`flex items-center gap-2 text-xl font-semibold ${correct ? "text-success" : "text-error"}`}
      >
        <span aria-hidden className="font-mono">
          {correct ? "✓" : "✗"}
        </span>
        {title}
      </p>

      {correct ? (
        <details className="rounded-md border border-border p-3 text-muted">
          <summary className="cursor-pointer select-none text-text">Ver explicação</summary>
          <p className="mt-2 leading-relaxed">{explanation}</p>
        </details>
      ) : (
        <div className="space-y-2 rounded-md border border-error/40 bg-error/5 p-3">
          <p className="font-medium">
            A afirmação é{" "}
            <strong className={correctAnswer ? "text-success" : "text-error"}>
              {correctAnswer ? "VERDADEIRA" : "FALSA"}
            </strong>
            .
          </p>
          <p className="leading-relaxed text-muted">{explanation}</p>
        </div>
      )}

      <button
        ref={nextRef}
        type="button"
        onClick={onNext}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-bg transition-opacity hover:opacity-90"
      >
        {isLast ? "Ver resultado" : "Próxima pergunta"}
        <kbd className="hidden rounded border border-bg/40 px-1.5 font-mono text-xs sm:inline">
          Enter
        </kbd>
      </button>
    </div>
  );
}
