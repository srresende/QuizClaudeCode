import type {
  AnswerResponse,
  ApiError,
  GameResultResponse,
  NextQuestionResponse,
  SaveScoreResponse,
  StartGameResponse,
} from "./api-types";

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// A hung request would otherwise leave the game stuck in "submitting" forever.
const REQUEST_TIMEOUT_MS = 10_000;

function networkError(): ApiClientError {
  return new ApiClientError("NETWORK_ERROR", "Falha de conexão. Verifique sua internet.", 0);
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body === undefined ? undefined : { "content-type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal,
    });
  } catch {
    throw networkError();
  }
  const data: unknown = await res.json().catch(() => null);
  if (signal.aborted) throw networkError();
  if (!res.ok) {
    const error = (data as ApiError | null)?.error;
    throw new ApiClientError(
      error?.code ?? "UNKNOWN_ERROR",
      error?.message ?? "Erro inesperado. Tente novamente.",
      res.status,
    );
  }
  return data as T;
}

export const api = {
  start: () => request<StartGameResponse>("/api/game/start", { method: "POST" }),
  next: (sessionId: string) =>
    request<NextQuestionResponse>("/api/game/next", { method: "POST", body: { sessionId } }),
  answer: (sessionId: string, index: number, answer: boolean | null) =>
    request<AnswerResponse>("/api/game/answer", {
      method: "POST",
      body: { sessionId, index, answer },
    }),
  result: (sessionId: string) =>
    request<GameResultResponse>(`/api/game/result?sessionId=${encodeURIComponent(sessionId)}`),
  saveScore: (sessionId: string, nickname: string) =>
    request<SaveScoreResponse>("/api/ranking", { method: "POST", body: { sessionId, nickname } }),
};
