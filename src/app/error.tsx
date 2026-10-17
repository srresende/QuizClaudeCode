"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TerminalWindow } from "@/components/TerminalWindow";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <TerminalWindow title="erro">
      <div className="space-y-4" role="alert">
        <p className="font-mono text-error">
          <span aria-hidden>✗ </span>
          Algo deu errado ao carregar esta página.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retry}
            className="min-h-11 rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:opacity-90"
          >
            Tentar de novo
          </button>
          <Link
            href="/"
            className="flex min-h-11 items-center rounded-lg border border-border px-4 py-2 hover:border-accent"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </TerminalWindow>
  );
}
