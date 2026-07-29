import { describe, it, expect } from "vitest";
import {
  normalizeSourceContext,
  SOURCE_CONTEXTS,
  DEFAULT_SOURCE_CONTEXT,
} from "./source-context";

describe("normalizeSourceContext", () => {
  it("passes through every allowlisted token", () => {
    for (const s of SOURCE_CONTEXTS) {
      expect(normalizeSourceContext(s)).toBe(s);
    }
  });

  it("coerces unknown / forged strings to the default", () => {
    expect(normalizeSourceContext("evil'; drop table--")).toBe(
      DEFAULT_SOURCE_CONTEXT
    );
    expect(normalizeSourceContext("https://example.com/tracker")).toBe(
      DEFAULT_SOURCE_CONTEXT
    );
    expect(normalizeSourceContext("")).toBe(DEFAULT_SOURCE_CONTEXT);
  });

  it("coerces non-string values to the default", () => {
    expect(normalizeSourceContext(null)).toBe(DEFAULT_SOURCE_CONTEXT);
    expect(normalizeSourceContext(undefined)).toBe(DEFAULT_SOURCE_CONTEXT);
    expect(normalizeSourceContext(42)).toBe(DEFAULT_SOURCE_CONTEXT);
    expect(normalizeSourceContext({})).toBe(DEFAULT_SOURCE_CONTEXT);
  });
});
