import { describe, it, expect } from "vitest";
import { HAIR_PROFILES, getHairProfile } from "./profiles";

describe("HAIR_PROFILES", () => {
  it("has six profiles with unique slugs", () => {
    expect(HAIR_PROFILES).toHaveLength(6);
    expect(new Set(HAIR_PROFILES.map((p) => p.slug)).size).toBe(6);
  });

  it("gives every profile exactly four routine steps with non-empty copy", () => {
    for (const p of HAIR_PROFILES) {
      expect(p.routine, p.slug).toHaveLength(4);
      for (const s of p.routine) {
        expect(s.step.length, `${p.slug} step`).toBeGreaterThan(0);
        expect(s.detail.length, `${p.slug} detail`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps routine step labels unique within a profile", () => {
    for (const p of HAIR_PROFILES) {
      expect(new Set(p.routine.map((s) => s.step)).size, p.slug).toBe(4);
    }
  });

  it("looks a profile up by slug and misses cleanly", () => {
    expect(getHairProfile("hidden-wave")?.name).toBe("The Hidden Wave");
    expect(getHairProfile("nope")).toBeUndefined();
  });
});
