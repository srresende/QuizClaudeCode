import { NextResponse } from "next/server";
import { answerQuestion } from "@/server/gameService";
import { parseJsonBody, withErrorHandling } from "@/server/http";
import { answerBodySchema } from "@/server/schemas";

export const POST = withErrorHandling(async (request: Request) => {
  const { sessionId, index, answer } = await parseJsonBody(request, answerBodySchema);
  return NextResponse.json(await answerQuestion(sessionId, index, answer));
});
