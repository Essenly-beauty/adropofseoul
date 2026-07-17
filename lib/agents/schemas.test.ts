import { describe, it, expect } from "vitest";
import { CandidateListSchema, RunConfigSchema } from "./schemas";
import { buildResearchExtractPrompt, RESEARCH_PROMPT_VERSION } from "./prompts";

const validCandidate = {
  name: "Sool Loft",
  area: "Seongsu",
  categoryGuess: "head_spa",
  whyNotable: "Repeatedly recommended for first-timer head spa sessions.",
  sourceUrls: ["https://www.reddit.com/r/seoul/comments/abc123"],
  evidenceQuote: "Sool Loft in Seongsu was the highlight of my trip.",
  confidence: 0.8,
};

describe("CandidateListSchema", () => {
  it("parses a valid candidate list", () => {
    const r = CandidateListSchema.safeParse({ candidates: [validCandidate] });
    expect(r.success).toBe(true);
  });
  it("rejects a candidate without source URLs (source-or-invalid)", () => {
    const r = CandidateListSchema.safeParse({
      candidates: [{ ...validCandidate, sourceUrls: [] }],
    });
    expect(r.success).toBe(false);
  });
  it("rejects non-URL sources and out-of-range confidence", () => {
    expect(
      CandidateListSchema.safeParse({
        candidates: [{ ...validCandidate, sourceUrls: ["not a url"] }],
      }).success
    ).toBe(false);
    expect(
      CandidateListSchema.safeParse({
        candidates: [{ ...validCandidate, confidence: 1.5 }],
      }).success
    ).toBe(false);
  });
  it("accepts a null category guess but rejects unknown categories", () => {
    expect(
      CandidateListSchema.safeParse({
        candidates: [{ ...validCandidate, categoryGuess: null }],
      }).success
    ).toBe(true);
    expect(
      CandidateListSchema.safeParse({
        candidates: [{ ...validCandidate, categoryGuess: "nightclub" }],
      }).success
    ).toBe(false);
  });
});

describe("RunConfigSchema", () => {
  it("applies defaults", () => {
    const r = RunConfigSchema.parse({ area: "Seongsu" });
    expect(r.sources).toEqual(["reddit", "web"]);
    expect(r.limit).toBe(10);
  });
  it("caps the limit", () => {
    expect(RunConfigSchema.safeParse({ area: "x", limit: 100 }).success).toBe(
      false
    );
  });
});

describe("buildResearchExtractPrompt", () => {
  it("contains the area, limit, and no-fabrication constraint", () => {
    const p = buildResearchExtractPrompt({
      area: "Seongsu",
      gathered: "SOURCE TEXT",
      limit: 5,
    });
    expect(p).toContain("Seongsu");
    expect(p).toContain("up to 5");
    expect(p).toContain("NEVER invent a place");
    expect(p).toContain("SOURCE TEXT");
  });
  it("exposes a version string for run traceability", () => {
    expect(RESEARCH_PROMPT_VERSION).toMatch(/^research-v\d+$/);
  });
});
