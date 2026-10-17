import type { Category, Difficulty } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  fundamentos: "Fundamentos do Claude Code",
  features: "Features e Produtividade",
  "boas-praticas": "Boas Práticas",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};
