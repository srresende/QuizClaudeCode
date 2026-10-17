import { NextResponse, type NextRequest } from "next/server";
import { getResult } from "@/server/gameService";
import { withErrorHandling } from "@/server/http";
import { sessionIdSchema } from "@/server/schemas";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const sessionId = sessionIdSchema.parse(request.nextUrl.searchParams.get("sessionId"));
  return NextResponse.json(await getResult(sessionId));
});
