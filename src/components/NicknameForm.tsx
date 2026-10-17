"use client";

import { useState, type FormEvent } from "react";
import { NICKNAME_MAX, NICKNAME_MIN } from "@/lib/constants";
import { validateNickname } from "@/lib/nickname";

const STORAGE_KEY = "quiz-claude-code:nickname";

function readStoredNickname(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeNickname(nickname: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, nickname);
  } catch {
    // Storage unavailable (private mode, blocked): prefill is a convenience only.
  }
}

interface NicknameFormProps {
  /** Resolves to an error message, or null on success. */
  onSave: (nickname: string) => Promise<string | null>;
}

/** Only rendered client-side (after a game), so reading localStorage on init is safe. */
export function NicknameForm({ onSave }: NicknameFormProps) {
  const [nickname, setNickname] = useState(readStoredNickname);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateNickname(nickname);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    const saveError = await onSave(validation.value);
    if (saveError) {
      setError(saveError);
      setSubmitting(false);
    } else {
      storeNickname(validation.value);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <label htmlFor="nickname" className="block text-sm font-medium">
        Salvar no ranking
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          placeholder="Seu nickname"
          minLength={NICKNAME_MIN}
          maxLength={NICKNAME_MAX}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          aria-invalid={error !== null}
          aria-describedby="nickname-help"
          className="min-h-11 flex-1 rounded-lg border border-border bg-bg px-3 py-2 font-mono placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 rounded-lg bg-accent px-4 py-2 font-semibold text-bg hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Salvando…" : "Salvar"}
        </button>
      </div>
      <p
        id="nickname-help"
        className={`text-sm ${error ? "text-error" : "text-muted"}`}
        aria-live="polite"
      >
        {error ?? `${NICKNAME_MIN} a ${NICKNAME_MAX} caracteres: letras, números, espaço, _ e -.`}
      </p>
    </form>
  );
}
