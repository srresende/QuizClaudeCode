import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { RankingTable } from "@/components/RankingTable";
import { TerminalWindow } from "@/components/TerminalWindow";
import { QUESTIONS_PER_GAME, TIME_LIMIT_MS } from "@/lib/constants";
import { getTopScores } from "@/server/rankingService";

const PREVIEW_SIZE = 5;

async function TopPreview() {
  await connection();
  const top = await getTopScores(PREVIEW_SIZE).catch((error: unknown) => {
    console.error(error);
    return null;
  });
  if (!top) return <p className="text-muted">Ranking indisponível no momento.</p>;
  return <RankingTable top={top} />;
}

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-mono text-3xl font-bold sm:text-4xl">
          <span className="text-accent">&gt;</span> quiz claude code
          <span aria-hidden className="animate-blink text-accent">
            _
          </span>
        </h1>
        <p className="text-lg text-muted">
          Quanto você sabe sobre o Claude Code? Julgue cada afirmação como verdadeira ou falsa e
          dispute um lugar no ranking.
        </p>
      </header>

      <TerminalWindow title="regras.md">
        <ul className="space-y-2 font-mono text-sm">
          <li>
            <span className="text-accent">$</span> {QUESTIONS_PER_GAME} perguntas de Verdadeiro ou Falso
          </li>
          <li>
            <span className="text-accent">$</span> {TIME_LIMIT_MS / 1000} segundos por pergunta
          </li>
          <li>
            <span className="text-accent">$</span> dificuldade progressiva: Fácil → Médio → Difícil
          </li>
          <li>
            <span className="text-accent">$</span> 1 ponto por acerto; desempate pelo menor tempo
          </li>
          <li className="text-muted">
            <span className="text-accent">$</span> atalhos: V / ← verdadeiro · F / → falso · Enter próxima
          </li>
        </ul>
      </TerminalWindow>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/play"
          className="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-accent px-6 py-3 text-lg font-semibold text-bg hover:opacity-90"
        >
          Começar
        </Link>
        <Link
          href="/ranking"
          className="flex min-h-12 flex-1 items-center justify-center rounded-lg border border-accent px-6 py-3 text-lg text-accent hover:bg-accent/10"
        >
          Ver ranking
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-mono text-sm uppercase tracking-wide text-muted">Top {PREVIEW_SIZE}</h2>
        <Suspense fallback={<p className="font-mono text-muted">carregando…</p>}>
          <TopPreview />
        </Suspense>
      </section>
    </div>
  );
}
