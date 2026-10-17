export const CATEGORIES = ["fundamentos", "features", "boas-praticas"] as const;
export const DIFFICULTIES = ["facil", "medio", "dificil"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  statement: string;
  answer: boolean;
  explanation: string;
}

export type PublicQuestion = Omit<Question, "answer" | "explanation"> & {
  index: number;
};
