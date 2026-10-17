"use client";

import Link from "next/link";
import type { GameResultResponse, SaveScoreResponse, Tally } from "@/lib/api-types";
import { QUESTIONS_PER_GAME } from "@/lib/constants";
import { formatTime } from "@/lib/formatTime";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/labels";
import { CATEGORIES, DIFFICULTIES } from "@/lib/types";
import { NicknameForm } from "./NicknameForm";
import { TerminalWindow } from "./TerminalWindow";

function performanceMessage(correct: number): string {
  if (correct === QUESTIONS_PER_GAME) return "Mestre do Claude Code!";
  if (correct >= 11) return "Avançado — mandou bem!";
  if (correct >= 6) return "Praticante — você já domina o básico.";
  return "Iniciante — bora explorar a documentação!";
}

function Breakdown({ title, rows }: { title: string; rows: [label: string, tally: Tally][] }) {
  return (
    <div>
      <h3 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">{title}</h3>
      <ul className="space-y-1">
        {rows.map(([label, { correct, total }]) => (
          <li key={label} className="flex justify-between gap-4 text-sm">
            <span>{label}</span>
            <span className="font-mono tabular-nums text-muted">
              {correct}/{total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ResultSummaryProps {
  result: GameResultResponse;
  saved?: SaveScoreResponse;
  onSave: (nickname: string) => Promise<string | null>;
  onPlayAgain: () => void;
}

export function ResultSummary({ result, saved, onSave, onPlayAgain }: ResultSummaryProps) {
  const isSaved = saved !== undefined || result.saved;

  return (
    <TerminalWindow title="resultado">
      <div className="space-y-6">
        <div className="text-center">
          <p className="font-mono text-5xl font-bold text-accent tabular-nums">
            {result.correctCount}/{QUESTIONS_PER_GAME}
          </p>
          <p className="mt-1 font-mono text-muted">
            tempo total: <span className="tabular-nums text-text">{formatTime(result.totalTimeMs)}</span>
          </p>
          <p className="mt-3 text-lg font-semibold">{performanceMessage(result.correctCount)}</p>
        </div>

        <div className="grid gap-6 border-y border-border py-4 sm:grid-cols-2">
          <Breakdown
            title="Por dificuldade"
            rows={DIFFICULTIES.map((d) => [DIFFICULTY_LABELS[d], result.byDifficulty[d]])}
          />
          <Breakdown
            title="Por categoria"
            rows={CATEGORIES.map((c) => [CATEGORY_LABELS[c], result.byCategory[c]])}
          />
        </div>

        {saved ? (
          <p className="text-center" role="status">
            <span aria-hidden className="text-success">✓ </span>
            Salvo! Você ficou em <strong className="text-accent">#{saved.position}</strong> no ranking.
          </p>
        ) : isSaved ? (
          <p className="text-center text-muted" role="status">
            <span aria-hidden className="text-success">✓ </span>
            Pontuação já salva no ranking.
          </p>
        ) : (
          <NicknameForm onSave={onSave} />
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-border px-4 py-2 hover:border-accent"
          >
            Jogar de novo
          </button>
          <Link
            href={saved ? `/ranking?highlight=${saved.scoreId}` : "/ranking"}
            className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-accent px-4 py-2 text-accent hover:bg-accent/10"
          >
            Ver ranking
          </Link>
        </div>
      </div>
    </TerminalWindow>
  );
}
