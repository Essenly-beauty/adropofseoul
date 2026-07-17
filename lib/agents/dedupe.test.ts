import { describe, it, expect } from "vitest";
import { dedupeKey, isNearDuplicate, filterNewCandidates } from "./dedupe";
import type { Candidate } from "./schemas";

function candidate(name: string, area = "Seongsu"): Candidate {
  return {
    name,
    area,
    categoryGuess: null,
    whyNotable: "x",
    sourceUrls: ["https://example.com"],
    evidenceQuote: "q",
    confidence: 0.7,
  };
}

describe("dedupeKey", () => {
  it("normalizes case, punctuation, and whitespace", () => {
    expect(dedupeKey("Sool Loft", "Seongsu")).toBe("sool-loft|seongsu");
    expect(dedupeKey("SOOL  LOFT.", "Seongsu")).toBe("sool-loft|seongsu");
  });
  it("keys are area-scoped", () => {
    expect(dedupeKey("Sool Loft", "Seongsu")).not.toBe(
      dedupeKey("Sool Loft", "Hannam")
    );
  });
});

describe("isNearDuplicate", () => {
  it("matches case/punctuation variants in the same area", () => {
    expect(
      isNearDuplicate(candidate("Sool Loft"), candidate("sool loft!"))
    ).toBe(true);
  });
  it("matches containment (longer branded name vs short name)", () => {
    expect(
      isNearDuplicate(candidate("Sool Loft Head Spa"), candidate("Sool Loft"))
    ).toBe(true);
  });
  it("does not match across areas or unrelated names", () => {
    expect(
      isNearDuplicate(candidate("Sool Loft"), candidate("Sool Loft", "Hannam"))
    ).toBe(false);
    expect(
      isNearDuplicate(candidate("Sool Loft"), candidate("Onda Salon"))
    ).toBe(false);
  });
});

describe("filterNewCandidates", () => {
  it("drops candidates whose key is already known, keeps order", () => {
    const list = [
      candidate("A Spa"),
      candidate("B Salon"),
      candidate("C Cafe"),
    ];
    const existing = new Set([dedupeKey("B Salon", "Seongsu")]);
    const fresh = filterNewCandidates(list, existing);
    expect(fresh.map((c) => c.name)).toEqual(["A Spa", "C Cafe"]);
  });
  it("also drops near-duplicates within the same batch", () => {
    const list = [candidate("Sool Loft"), candidate("Sool Loft Head Spa")];
    const fresh = filterNewCandidates(list, new Set());
    expect(fresh).toHaveLength(1);
    expect(fresh[0].name).toBe("Sool Loft");
  });
});
