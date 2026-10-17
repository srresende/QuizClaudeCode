import { describe, expect, it } from "vitest";
import { feedbackAnnouncement, feedbackTitle } from "@/lib/feedback";

describe("feedback text", () => {
  it("only says it was right when the answer is correct", () => {
    const verdict = { correct: true, timedOut: false, correctAnswer: false };

    expect(feedbackTitle(verdict)).toBe("Correto!");
    expect(feedbackAnnouncement(verdict)).toBe("Correto!");
  });

  it("announces the right answer after a wrong one", () => {
    expect(feedbackAnnouncement({ correct: false, timedOut: false, correctAnswer: true })).toBe(
      "Incorreto. A afirmação é verdadeira.",
    );
  });

  it("announces a timeout and the right answer", () => {
    expect(feedbackAnnouncement({ correct: false, timedOut: true, correctAnswer: false })).toBe(
      "Tempo esgotado. A afirmação é falsa.",
    );
  });
});
