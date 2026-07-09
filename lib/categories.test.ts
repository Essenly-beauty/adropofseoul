import { describe, it, expect } from "vitest";
import {
  getCategoryBySlug,
  CATEGORY_SLUGS,
  CATEGORIES,
  categoryLabel,
} from "./categories";

describe("categories", () => {
  it("maps the head-spa route slug to the head_spa enum", () => {
    expect(getCategoryBySlug("head-spa")?.enumValue).toBe("head_spa");
  });
  it("maps beauty to itself", () => {
    expect(getCategoryBySlug("beauty")?.enumValue).toBe("beauty");
  });
  it("returns undefined for an unknown slug", () => {
    expect(getCategoryBySlug("nope")).toBeUndefined();
  });
  it("exposes the editorial category slugs (no places/picks)", () => {
    expect(CATEGORY_SLUGS).toEqual([
      "beauty",
      "hair",
      "head-spa",
      "wellness",
      "guides",
    ]);
  });
  it("gives every category a non-empty blurb", () => {
    expect(CATEGORIES.every((c) => c.blurb.length > 0)).toBe(true);
  });
  it("maps enum values to labels", () => {
    expect(categoryLabel("head_spa")).toBe("Head Spa");
    expect(categoryLabel("beauty")).toBe("Beauty");
    expect(categoryLabel("unknown")).toBe("unknown");
  });
});
