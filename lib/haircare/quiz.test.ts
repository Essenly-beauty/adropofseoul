import { describe, it, expect } from "vitest";
import { HAIR_QUIZ, HAIR_QUIZ_SECTIONS, hairOptionLabel } from "./quiz";
import { optionKeys } from "@/lib/profile/quiz-definition";
import { validateResponse } from "@/lib/profile/validation";

describe("HAIR_QUIZ", () => {
  it("is version 1 of the hair domain with 14 questions", () => {
    expect(HAIR_QUIZ.quizKey).toBe("hair");
    expect(HAIR_QUIZ.version).toBe(1);
    expect(HAIR_QUIZ.questions).toHaveLength(14);
  });

  it("has unique question keys", () => {
    const keys = HAIR_QUIZ.questions.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is fully answerable: every question is required, closed, and non-info", () => {
    for (const q of HAIR_QUIZ.questions) {
      expect(q.type, q.key).toMatch(/^(single|multi)_select$/);
      expect(q.isRequired, q.key).toBe(true);
      expect(q.options.length, q.key).toBeGreaterThan(1);
    }
  });

  it("keeps option key and value identical, and keys unique per question", () => {
    for (const q of HAIR_QUIZ.questions) {
      for (const o of q.options)
        expect(o.value, `${q.key}.${o.key}`).toBe(o.key);
      expect(new Set(optionKeys(q)).size, q.key).toBe(q.options.length);
      for (const o of q.options)
        expect(o.label.length, `${q.key}.${o.key} label`).toBeGreaterThan(0);
    }
  });

  it("agrees between type and allowsMultiple", () => {
    for (const q of HAIR_QUIZ.questions)
      expect(q.allowsMultiple, q.key).toBe(q.type === "multi_select");
  });

  it("uses only known sections", () => {
    for (const q of HAIR_QUIZ.questions)
      expect(HAIR_QUIZ_SECTIONS, q.key).toContain(q.sectionKey);
  });

  it("marks exactly the two multi-selects, each with an exclusive None", () => {
    const multi = HAIR_QUIZ.questions.filter((q) => q.type === "multi_select");
    expect(multi.map((q) => q.key)).toEqual([
      "scalp_concerns",
      "chemical_history",
    ]);
    for (const q of multi) {
      expect(q.validation?.exclusiveOptionKeys, q.key).toEqual(["none"]);
      expect(optionKeys(q), q.key).toContain("none");
    }
  });

  it("accepts every declared option and rejects an unknown one", () => {
    for (const q of HAIR_QUIZ.questions) {
      const allowed = optionKeys(q);
      for (const o of q.options) {
        const response = q.type === "multi_select" ? [o.key] : o.key;
        expect(validateResponse(q.type, response, allowed).ok, o.key).toBe(
          true
        );
      }
      const bogus = q.type === "multi_select" ? ["nope"] : "nope";
      expect(validateResponse(q.type, bogus, allowed).ok, q.key).toBe(false);
    }
  });

  it("looks up option labels and falls back to the key", () => {
    expect(hairOptionLabel("natural_pattern", "loose_wave")).toBe(
      "Forms loose S-shaped bends"
    );
    expect(hairOptionLabel("natural_pattern", "nope")).toBe("nope");
    expect(hairOptionLabel("nope", "loose_wave")).toBe("loose_wave");
  });
});
