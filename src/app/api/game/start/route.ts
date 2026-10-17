import { NextResponse } from "next/server";
import { startGame } from "@/server/gameService";
import { withErrorHandling } from "@/server/http";

export const POST = withErrorHandling(async () => {
  return NextResponse.json(await startGame(), { status: 201 });
});
