import "server-only";
import type { RankingResponse, ScoreRow } from "@/lib/api-types";
import { RANKING_SIZE } from "@/lib/constants";
import { getSupabase } from "./supabase";

interface ScoreRecord {
  id: string;
  nickname: string;
  correct_count: number;
  total_time_ms: number;
  created_at: string;
}

const COLUMNS = "id, nickname, correct_count, total_time_ms, created_at";

function toRow(record: ScoreRecord, position: number): ScoreRow {
  return {
    id: record.id,
    nickname: record.nickname,
    correctCount: record.correct_count,
    totalTimeMs: record.total_time_ms,
    createdAt: record.created_at,
    position,
  };
}

export async function getTopScores(limit = RANKING_SIZE): Promise<ScoreRow[]> {
  const { data, error } = await getSupabase()
    .from("scores")
    .select(COLUMNS)
    .order("correct_count", { ascending: false })
    .order("total_time_ms", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(limit)
    .returns<ScoreRecord[]>();
  if (error) throw error;
  return data.map((record, i) => toRow(record, i + 1));
}

async function getScoreWithPosition(scoreId: string): Promise<ScoreRow | undefined> {
  const supabase = getSupabase();
  const [score, position] = await Promise.all([
    supabase.from("scores").select(COLUMNS).eq("id", scoreId).maybeSingle<ScoreRecord>(),
    supabase.rpc("score_position", { p_score_id: scoreId }),
  ]);
  if (score.error) throw score.error;
  if (position.error) throw position.error;
  if (!score.data || typeof position.data !== "number") return undefined;
  return toRow(score.data, position.data);
}

export async function getRanking(highlightId?: string): Promise<RankingResponse> {
  const [top, highlighted] = await Promise.all([
    getTopScores(),
    highlightId ? getScoreWithPosition(highlightId) : undefined,
  ]);
  return highlighted ? { top, highlighted } : { top };
}
