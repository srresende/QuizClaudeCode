import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";
import { RankingTable } from "@/components/RankingTable";
import { TerminalWindow } from "@/components/TerminalWindow";
import { RANKING_SIZE } from "@/lib/constants";
import { getRanking } from "@/server/rankingService";

export const metadata: Metadata = {
  title: "Ranking · Quiz Claude Code",
};

async function RankingContent({ searchParams }: { searchParams: PageProps<"/ranking">["searchParams"] }) {
  await connection();
  const { highlight } = await searchParams;
  const parsed = z.uuid().safeParse(highlight);

  const ranking = await getRanking(parsed.success ? parsed.data : undefined).catch(
    (error: unknown) => {
      console.error(error);
      return null;
    },
  );
  if (!ranking) return <p className="text-error">Não foi possível carregar o ranking agora.</p>;
  return <RankingTable top={ranking.top} highlighted={ranking.highlighted} />;
}

export default function RankingPage({ searchParams }: PageProps<"/ranking">) {
  return (
    <div className="space-y-6">
      <h1 className="font-mono text-2xl">
        <span className="text-accent">&gt;</span> ranking
      </h1>
      <TerminalWindow title={`top ${RANKING_SIZE} · global`}>
        <Suspense fallback={<p className="font-mono text-muted">carregando ranking…</p>}>
          <RankingContent searchParams={searchParams} />
        </Suspense>
      </TerminalWindow>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/play"
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:opacity-90"
        >
          Jogar
        </Link>
        <Link
          href="/"
          className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-border px-4 py-2 hover:border-accent"
        >
          Início
        </Link>
      </div>
    </div>
  );
}
