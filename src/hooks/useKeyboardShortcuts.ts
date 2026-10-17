"use client";

import { useEffect, useRef } from "react";

export type KeyMap = Partial<Record<string, () => void>>;

/**
 * Binds keys (matched against `event.key`, case-insensitive) while `enabled`.
 * Ignores typing in form fields and Enter on focused buttons/links (they handle it natively).
 */
export function useKeyboardShortcuts(keyMap: KeyMap, enabled = true) {
  const keyMapRef = useRef(keyMap);

  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Enter" && target?.closest("button, a, summary")) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const action = keyMapRef.current[key];
      if (action) {
        event.preventDefault();
        action();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
