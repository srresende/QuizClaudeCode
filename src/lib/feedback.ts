import type { AnswerResponse } from "./api-types";

type Verdict = Pick<AnswerResponse, "correct" | "timedOut" | "correctAnswer">;

export function feedbackTitle({ correct, timedOut }: Verdict): string {
  return correct ? "Correto!" : timedOut ? "Tempo esgotado" : "Incorreto";
}

/** What the screen-reader live region says once an answer is graded. */
export function feedbackAnnouncement(verdict: Verdict): string {
  const title = feedbackTitle(verdict);
  if (verdict.correct) return title;
  return `${title}. A afirmação é ${verdict.correctAnswer ? "verdadeira" : "falsa"}.`;
}
