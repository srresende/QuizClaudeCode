import { describe, expect, it } from "vitest";
import { validateNickname } from "@/lib/nickname";

describe("validateNickname", () => {
  it("accepts valid nicknames, including accents, digits, space, _ and -", () => {
    for (const nick of ["Ana", "João_dev-42", "Zé Ninguém", "abcdefghijklmnop"]) {
      expect(validateNickname(nick)).toEqual({ ok: true, value: nick });
    }
  });

  it("trims before validating", () => {
    expect(validateNickname("   Bia   ")).toEqual({ ok: true, value: "Bia" });
    expect(validateNickname("  ab  ").ok).toBe(false);
  });

  it("enforces length limits", () => {
    expect(validateNickname("ab").ok).toBe(false);
    expect(validateNickname("a".repeat(17)).ok).toBe(false);
    expect(validateNickname("").ok).toBe(false);
  });

  it("rejects invalid characters", () => {
    for (const nick of ["<script>", "ana!", "emoji😀", "a.b.c", "tab\tname"]) {
      expect(validateNickname(nick).ok).toBe(false);
    }
  });

  it("blocks bad words case- and accent-insensitively", () => {
    for (const nick of ["merda", "MERDA", "Mérda", "merda_123", "eu merda", "m e r d a"]) {
      expect(validateNickname(nick).ok).toBe(false);
    }
  });

  it("does not block words that merely contain a blocked word", () => {
    expect(validateNickname("computador").ok).toBe(true);
  });
});
