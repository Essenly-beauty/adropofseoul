import { describe, it, expect } from "vitest";
import { readingTime } from "./reading-time";

describe("readingTime", () => {
  it("returns null for empty or missing body", () => {
    expect(readingTime(null)).toBe(null);
    expect(readingTime(undefined)).toBe(null);
    expect(readingTime("   ")).toBe(null);
  });
  it("rounds words at 200 wpm with a 1-minute floor", () => {
    expect(readingTime("word ".repeat(100))).toBe(1);
    expect(readingTime("word ".repeat(500))).toBe(3);
  });
});
