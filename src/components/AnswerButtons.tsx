interface AnswerButtonsProps {
  disabled: boolean;
  onAnswer: (value: boolean) => void;
}

const BASE =
  "flex min-h-14 flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function AnswerButtons({ disabled, onAnswer }: AnswerButtonsProps) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAnswer(true)}
        className={`${BASE} border-success/60 text-success hover:bg-success/10`}
      >
        Verdadeiro
        <kbd className="hidden rounded border border-current/40 px-1.5 font-mono text-xs sm:inline">
          V
        </kbd>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAnswer(false)}
        className={`${BASE} border-error/60 text-error hover:bg-error/10`}
      >
        Falso
        <kbd className="hidden rounded border border-current/40 px-1.5 font-mono text-xs sm:inline">
          F
        </kbd>
      </button>
    </div>
  );
}
