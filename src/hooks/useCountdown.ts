"use client";

import { useEffect, useRef, useState } from "react";

const TICK_MS = 100;

/**
 * Counts down from `durationMs` while `running`, restarting whenever `resetKey` changes.
 * Calls `onExpire` exactly once when it reaches zero.
 */
export function useCountdown(
  durationMs: number,
  running: boolean,
  resetKey: unknown,
  onExpire: () => void,
): number {
  const [tick, setTick] = useState({ key: resetKey, remainingMs: durationMs });
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!running) return;
    const startedAt = performance.now();

    const id = window.setInterval(() => {
      const remainingMs = Math.max(durationMs - (performance.now() - startedAt), 0);
      setTick({ key: resetKey, remainingMs });
      if (remainingMs === 0) {
        window.clearInterval(id);
        onExpireRef.current();
      }
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [durationMs, running, resetKey]);

  // A new resetKey starts from the full duration until the first tick lands.
  return tick.key === resetKey ? tick.remainingMs : durationMs;
}
