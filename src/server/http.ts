import "server-only";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { z } from "zod";

export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Wraps a route handler so thrown errors become `{ error: { code, message } }` responses. */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Let Next.js internal control-flow errors (e.g. prerender bail-out) propagate.
      unstable_rethrow(error);
      if (error instanceof AppError) {
        return errorResponse(error.code, error.message, error.status);
      }
      if (error instanceof z.ZodError) {
        return errorResponse("INVALID_INPUT", "Dados inválidos na requisição.", 400);
      }
      console.error(error);
      return errorResponse("INTERNAL_ERROR", "Erro inesperado. Tente novamente.", 500);
    }
  };
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("INVALID_INPUT", "Corpo da requisição não é um JSON válido.", 400);
  }
  return schema.parse(body);
}
