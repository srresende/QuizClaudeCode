import type { ScoreRow } from "@/lib/api-types";
import { QUESTIONS_PER_GAME } from "@/lib/constants";
import { formatTime } from "@/lib/formatTime";

const MEDALS: Record<number, { label: string; className: string }> = {
  1: { label: "Ouro", className: "text-gold" },
  2: { label: "Prata", className: "text-silver" },
  3: { label: "Bronze", className: "text-bronze" },
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function Row({ row, highlighted }: { row: ScoreRow; highlighted: boolean }) {
  const medal = MEDALS[row.position];
  return (
    <tr
      className={`border-b border-border/60 ${highlighted ? "bg-accent/15 outline outline-1 -outline-offset-1 outline-accent" : ""}`}
      aria-current={highlighted ? "true" : undefined}
    >
      <td className={`py-2 pr-2 pl-3 font-mono tabular-nums ${medal?.className ?? "text-muted"}`}>
        {medal && <span className="sr-only">{medal.label}, </span>}
        {medal ? "★ " : ""}#{row.position}
      </td>
      <td className="max-w-[9rem] truncate py-2 pr-2 font-medium sm:max-w-none">
        {row.nickname}
        {highlighted && <span className="ml-2 text-xs text-accent">(você)</span>}
      </td>
      <td className="py-2 pr-2 text-right font-mono tabular-nums">
        {row.correctCount}/{QUESTIONS_PER_GAME}
      </td>
      <td className="py-2 pr-2 text-right font-mono tabular-nums text-muted">
        {formatTime(row.totalTimeMs)}
      </td>
      <td className="hidden py-2 pr-3 text-right font-mono text-xs text-muted sm:table-cell">
        {dateFormat.format(new Date(row.createdAt))}
      </td>
    </tr>
  );
}

interface RankingTableProps {
  top: ScoreRow[];
  highlighted?: ScoreRow;
}

export function RankingTable({ top, highlighted }: RankingTableProps) {
  if (top.length === 0) {
    return <p className="text-muted">Ninguém no ranking ainda. Seja o primeiro!</p>;
  }

  const outsideTop = highlighted && !top.some((row) => row.id === highlighted.id);

  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-xs uppercase text-muted">
            <th scope="col" className="py-2 pr-2 pl-3 font-normal">Pos.</th>
            <th scope="col" className="py-2 pr-2 font-normal">Nickname</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Acertos</th>
            <th scope="col" className="py-2 pr-2 text-right font-normal">Tempo</th>
            <th scope="col" className="hidden py-2 pr-3 text-right font-normal sm:table-cell">Data</th>
          </tr>
        </thead>
        <tbody>
          {top.map((row) => (
            <Row key={row.id} row={row} highlighted={row.id === highlighted?.id} />
          ))}
          {outsideTop && (
            <>
              <tr aria-hidden>
                <td colSpan={5} className="py-1 text-center font-mono text-muted">
                  ⋮
                </td>
              </tr>
              <Row row={highlighted} highlighted />
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
