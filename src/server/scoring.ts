import "server-only";
import { NETWORK_GRACE_MS, TIME_LIMIT_MS } from "@/lib/constants";

export interface ScoredAnswer {
  correct: boolean;
  timedOut: boolean;
  timeMs: number;
}

/** `answer === null` means the client timer ran out. */
export function scoreAnswer(
  answer: boolean | null,
  expected: boolean,
  elapsedMs: number,
): ScoredAnswer {
  const timedOut = answer === null || elapsedMs > TIME_LIMIT_MS + NETWORK_GRACE_MS;
  return {
    correct: !timedOut && answer === expected,
    timedOut,
    timeMs: timedOut
      ? TIME_LIMIT_MS
      : Math.min(Math.max(Math.round(elapsedMs), 0), TIME_LIMIT_MS),
  };
}
