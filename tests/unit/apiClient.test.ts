import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError, api } from "@/lib/apiClient";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Replaces the request timeout with a signal the test aborts by hand. */
function controlTimeout(): AbortController {
  const controller = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
  return controller;
}

async function rejection(promise: Promise<unknown>): Promise<ApiClientError> {
  const error = await promise.then(
    () => expect.unreachable("request should have failed"),
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiClientError);
  return error as ApiClientError;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("apiClient", () => {
  it("returns the parsed body and sends JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ sessionId: "abc" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.next("abc")).resolves.toEqual({ sessionId: "abc" });

    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/game/next");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ sessionId: "abc" }));
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("maps an API error body to code, message and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "ALREADY_ANSWERED", message: "Já respondida." } }, 409),
      ),
    );

    const error = await rejection(api.answer("abc", 0, true));
    expect(error).toMatchObject({ code: "ALREADY_ANSWERED", message: "Já respondida.", status: 409 });
  });

  it("falls back to UNKNOWN_ERROR when the error body isn't JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 502 })));

    const error = await rejection(api.start());
    expect(error).toMatchObject({ code: "UNKNOWN_ERROR", status: 502 });
  });

  it("reports a failed fetch as NETWORK_ERROR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = await rejection(api.start());
    expect(error).toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });

  it("gives up with NETWORK_ERROR when the request times out", async () => {
    const timeout = controlTimeout();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_path: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          }),
      ),
    );

    const pending = api.next("abc");
    timeout.abort(new DOMException("timed out", "TimeoutError"));

    const error = await rejection(pending);
    expect(error.code).toBe("NETWORK_ERROR");
  });

  it("doesn't return null as data when the timeout cuts the body off", async () => {
    const timeout = controlTimeout();
    const response = jsonResponse({ sessionId: "abc" });
    vi.spyOn(response, "json").mockImplementation(() => {
      timeout.abort();
      return Promise.reject(new DOMException("aborted", "AbortError"));
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const error = await rejection(api.start());
    expect(error.code).toBe("NETWORK_ERROR");
  });
});
