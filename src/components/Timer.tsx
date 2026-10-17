interface TimerProps {
  remainingMs: number;
  totalMs: number;
}

const WARNING_SECONDS = 3;

function announcement(seconds: number): string {
  if (seconds <= WARNING_SECONDS) return "3 segundos restantes";
  if (seconds <= 5) return "5 segundos restantes";
  return "";
}

export function Timer({ remainingMs, totalMs }: TimerProps) {
  const seconds = Math.ceil(remainingMs / 1000);
  const warning = seconds <= WARNING_SECONDS;
  const percent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${warning ? "bg-warning" : "bg-accent"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        aria-hidden
        className={`w-10 text-right font-mono text-lg tabular-nums ${warning ? "text-warning" : "text-text"}`}
      >
        {seconds}s
      </span>
      {/* Announce only milestones to avoid flooding screen readers. */}
      <span className="sr-only" aria-live="polite">
        {announcement(seconds)}
      </span>
    </div>
  );
}
