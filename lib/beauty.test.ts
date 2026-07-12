import { describe, expect, it } from "vitest";
import {
  BEAUTY_SECTIONS,
  getBeautySectionBySlug,
  postMatchesBeautySection,
} from "./beauty";

describe("beauty sections", () => {
  it("keeps Beauty organized around editorial pillars", () => {
    expect(BEAUTY_SECTIONS.map((section) => section.slug)).toEqual([
      "skincare",
      "hair",
      "scalp",
      "treatments",
    ]);
  });

  it("finds sections and matches article tags", () => {
    const skincare = getBeautySectionBySlug("skincare");
    expect(skincare?.label).toBe("Skincare");
    expect(postMatchesBeautySection(["routine", "Sunscreen"], skincare!)).toBe(
      true
    );
    expect(postMatchesBeautySection(["head spa"], skincare!)).toBe(false);
  });
});
