import { NextResponse } from "next/server";
import { nextQuestion } from "@/server/gameService";
import { parseJsonBody, withErrorHandling } from "@/server/http";
import { nextBodySchema } from "@/server/schemas";

export const POST = withErrorHandling(async (request: Request) => {
  const { sessionId } = await parseJsonBody(request, nextBodySchema);
  return NextResponse.json(await nextQuestion(sessionId));
});
