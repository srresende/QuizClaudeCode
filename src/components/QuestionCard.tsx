import { QUESTIONS_PER_GAME } from "@/lib/constants";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/labels";
import type { Category, Difficulty } from "@/lib/types";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  facil: "border-success/60 text-success",
  medio: "border-warning/60 text-warning",
  dificil: "border-error/60 text-error",
};

interface QuestionCardProps {
  index: number;
  difficulty: Difficulty;
  category: Category;
  statement: string;
}

export function QuestionCard({ index, difficulty, category, statement }: QuestionCardProps) {
  const number = index + 1;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded border px-2 py-0.5 font-mono ${DIFFICULTY_STYLES[difficulty]}`}>
          {DIFFICULTY_LABELS[difficulty]}
        </span>
        <span className="rounded border border-border px-2 py-0.5 text-muted">
          {CATEGORY_LABELS[category]}
        </span>
        <span className="ml-auto font-mono text-muted">
          Pergunta {number} de {QUESTIONS_PER_GAME}
        </span>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-label="Progresso da partida"
        aria-valuemin={0}
        aria-valuemax={QUESTIONS_PER_GAME}
        aria-valuenow={number}
      >
        <div
          className="h-full bg-accent/70"
          style={{ width: `${(number / QUESTIONS_PER_GAME) * 100}%` }}
        />
      </div>
      <p className="flex gap-2 text-lg leading-relaxed sm:text-xl">
        <span aria-hidden className="select-none font-mono text-accent">
          &gt;
        </span>
        <span>{statement}</span>
      </p>
    </div>
  );
}
