import { describe, it, expect } from "vitest";
import { isValidEmail } from "./validation";

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
  });
  it("rejects missing @ or domain", () => {
    expect(isValidEmail("ab.com")).toBe(false);
    expect(isValidEmail("a@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
  it("trims surrounding whitespace before judging", () => {
    expect(isValidEmail("  a@b.com  ")).toBe(true);
  });
});
