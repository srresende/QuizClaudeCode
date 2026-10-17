import type { ReactNode } from "react";

interface TerminalWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function TerminalWindow({ title, children, className = "" }: TerminalWindowProps) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-border bg-surface shadow-lg ${className}`}
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-3 rounded-full bg-error/80" />
          <span className="size-3 rounded-full bg-warning/80" />
          <span className="size-3 rounded-full bg-success/80" />
        </span>
        <span className="ml-2 truncate font-mono text-xs text-muted">{title}</span>
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}
