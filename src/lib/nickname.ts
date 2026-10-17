import blockedWords from "@/data/blocked-words.json";
import { NICKNAME_MAX, NICKNAME_MIN } from "./constants";

const NICKNAME_PATTERN = new RegExp(
  `^[\\p{L}\\p{N} _-]{${NICKNAME_MIN},${NICKNAME_MAX}}$`,
  "u",
);

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

const BLOCKED = new Set(blockedWords.map(normalize));

export type NicknameResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/**
 * Words are compared whole (digits stripped), not as substrings, so that
 * e.g. "computador" isn't rejected for containing a blocked word.
 */
function containsBlockedWord(nickname: string): boolean {
  const words = normalize(nickname)
    .split(/[ _-]+/)
    .map((word) => word.replace(/\p{N}/gu, ""))
    .filter(Boolean);
  return [...words, words.join("")].some((word) => BLOCKED.has(word));
}

export function validateNickname(input: string): NicknameResult {
  const value = input.trim();
  if (value.length < NICKNAME_MIN || value.length > NICKNAME_MAX) {
    return {
      ok: false,
      error: `O nickname deve ter entre ${NICKNAME_MIN} e ${NICKNAME_MAX} caracteres.`,
    };
  }
  if (!NICKNAME_PATTERN.test(value)) {
    return {
      ok: false,
      error: "Use apenas letras, números, espaço, _ e -.",
    };
  }
  if (containsBlockedWord(value)) {
    return { ok: false, error: "Escolha outro nickname." };
  }
  return { ok: true, value };
}
