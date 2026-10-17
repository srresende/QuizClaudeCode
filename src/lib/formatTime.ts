/** Formats milliseconds as `mm:ss.s` (tenths truncated), e.g. 83450 → "01:23.4". */
export function formatTime(ms: number): string {
  const tenths = Math.floor(Math.max(ms, 0) / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  const tenth = tenths % 10;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenth}`;
}
