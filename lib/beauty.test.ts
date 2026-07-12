import { describe, expect, it } from "vitest";
import {
  BEAUTY_SECTIONS,
  getBeautySectionBySlug,
  postMatchesBeautySection,
} from "./beauty";

describe("beauty sections", () => {
  it("keeps Beauty organized around editorial pillars", () => {
    expect(BEAUTY_SECTIONS.map((section) => section.slug)).toEqual([
      "ingredients",
      "routines",
      "products",
      "skin-concerns",
      "trends",
      "guides",
    ]);
  });

  it("finds sections and matches article tags", () => {
    const products = getBeautySectionBySlug("products");
    expect(products?.label).toBe("Products");
    expect(postMatchesBeautySection(["Shopping", "Sunscreen"], products!)).toBe(
      true
    );
    expect(postMatchesBeautySection(["head spa"], products!)).toBe(false);
  });
});
