import { NextResponse, type NextRequest } from "next/server";
import { saveScore } from "@/server/gameService";
import { parseJsonBody, withErrorHandling } from "@/server/http";
import { getRanking } from "@/server/rankingService";
import { saveScoreBodySchema, sessionIdSchema } from "@/server/schemas";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const highlight = request.nextUrl.searchParams.get("highlight");
  const highlightId = highlight === null ? undefined : sessionIdSchema.parse(highlight);
  return NextResponse.json(await getRanking(highlightId));
});

export const POST = withErrorHandling(async (request: Request) => {
  const { sessionId, nickname } = await parseJsonBody(request, saveScoreBodySchema);
  return NextResponse.json(await saveScore(sessionId, nickname), { status: 201 });
});
