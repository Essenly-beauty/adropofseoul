import { describe, it, expect } from "vitest";
import {
  isProfileDomain,
  isQuestionType,
  isConsentType,
  validateResponse,
  MAX_TEXT_LENGTH,
  MAX_MULTI_SELECT,
} from "./validation";

describe("enum guards", () => {
  it("accepts canonical values and rejects others", () => {
    expect(isProfileDomain("skin")).toBe(true);
    expect(isProfileDomain("hair")).toBe(true);
    expect(isProfileDomain("nails")).toBe(false);
    expect(isProfileDomain(1)).toBe(false);
    expect(isQuestionType("single_select")).toBe(true);
    expect(isQuestionType("dropdown")).toBe(false);
    expect(isConsentType("marketing")).toBe(true);
    expect(isConsentType("cookies")).toBe(false);
  });
});

describe("validateResponse", () => {
  const opts = ["a", "b", "c"];

  it("single_select must be an allowed option key", () => {
    expect(validateResponse("single_select", "a", opts).ok).toBe(true);
    expect(validateResponse("single_select", "z", opts).ok).toBe(false);
    expect(validateResponse("single_select", ["a"], opts).ok).toBe(false);
  });

  it("multi_select must be a unique array of allowed keys within the cap", () => {
    expect(validateResponse("multi_select", ["a", "b"], opts).ok).toBe(true);
    expect(validateResponse("multi_select", ["a", "a"], opts).ok).toBe(false); // dup
    expect(validateResponse("multi_select", ["a", "z"], opts).ok).toBe(false); // not allowed
    expect(validateResponse("multi_select", "a", opts).ok).toBe(false); // not array
    const tooMany = Array.from(
      { length: MAX_MULTI_SELECT + 1 },
      (_, i) => `o${i}`
    );
    expect(validateResponse("multi_select", tooMany).ok).toBe(false);
  });

  it("scale must be a finite number", () => {
    expect(validateResponse("scale", 3).ok).toBe(true);
    expect(validateResponse("scale", "3").ok).toBe(false);
    expect(validateResponse("scale", Number.NaN).ok).toBe(false);
  });

  it("text must be a bounded string", () => {
    expect(validateResponse("text", "hello").ok).toBe(true);
    expect(validateResponse("text", "x".repeat(MAX_TEXT_LENGTH)).ok).toBe(true);
    expect(validateResponse("text", "x".repeat(MAX_TEXT_LENGTH + 1)).ok).toBe(
      false
    );
    expect(validateResponse("text", 5).ok).toBe(false);
  });

  it("info steps carry no answer; unknown types are rejected", () => {
    expect(validateResponse("info", undefined).ok).toBe(true);
    const bad = validateResponse("mystery", "x");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toBe("INVALID_QUESTION");
  });

  it("with no option constraint, any string key is allowed", () => {
    expect(validateResponse("single_select", "anything", []).ok).toBe(true);
  });
});
