import { describe, expect, it } from "vitest";
import { formatTime } from "@/lib/formatTime";

describe("formatTime", () => {
  it.each([
    [83450, "01:23.4"],
    [0, "00:00.0"],
    [999, "00:00.9"],
    [10000, "00:10.0"],
    [150000, "02:30.0"],
    [-20, "00:00.0"],
  ])("formats %i ms as %s", (ms, expected) => {
    expect(formatTime(ms)).toBe(expected);
  });
});
