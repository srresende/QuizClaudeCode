import Link from "next/link";
import { TerminalWindow } from "@/components/TerminalWindow";

export default function NotFound() {
  return (
    <TerminalWindow title="404">
      <div className="space-y-4">
        <p className="font-mono text-muted">
          <span className="text-accent">&gt;</span> página não encontrada
        </p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:opacity-90"
        >
          Voltar ao início
        </Link>
      </div>
    </TerminalWindow>
  );
}
