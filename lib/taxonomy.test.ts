import { describe, it, expect } from "vitest";
import {
  isPick,
  WELLNESS_CATEGORIES,
  getNeighborhood,
  regionForGuide,
  placeCategoryFromType,
  placeTypeSlug,
  SECTIONS,
  BEAUTY_TABS,
} from "./taxonomy";
import type { Post } from "@/services/types";

const post = (over: Partial<Post>): Post =>
  ({ slug: "x", tags: [], ...over }) as Post;

describe("isPick", () => {
  it("flags the known review slugs", () => {
    expect(isPick(post({ slug: "five-k-beauty-serums" }))).toBe(true);
    expect(isPick(post({ slug: "best-korean-serums-skin-type" }))).toBe(true);
  });
  it("flags any post tagged review/picks (admin-extensible)", () => {
    expect(isPick(post({ slug: "new-one", tags: ["review"] }))).toBe(true);
    expect(isPick(post({ slug: "new-two", tags: ["Picks"] }))).toBe(true);
  });
  it("does not flag a plain beauty tips article", () => {
    expect(
      isPick(post({ slug: "korean-3-step-skincare-routine", tags: ["beauty"] }))
    ).toBe(false);
  });
});

describe("wellness union", () => {
  it("includes both wellness and head_spa", () => {
    expect(WELLNESS_CATEGORIES).toContain("wellness");
    expect(WELLNESS_CATEGORIES).toContain("head_spa");
  });
});

describe("neighborhoods", () => {
  it("resolves a known neighborhood and rejects unknown", () => {
    expect(getNeighborhood("seongsu")?.label).toBe("Seongsu");
    expect(getNeighborhood("nope")).toBeUndefined();
  });
  it("defaults a guide's region to seongsu, honoring a region: tag", () => {
    expect(regionForGuide(post({ slug: "seongsu-beauty-spots" }))).toBe(
      "seongsu"
    );
    expect(
      regionForGuide(post({ slug: "citywide", tags: ["region:common"] }))
    ).toBe("common");
  });
});

describe("place types", () => {
  it("round-trips type slug and category enum", () => {
    expect(placeCategoryFromType("head-spa")).toBe("head_spa");
    expect(placeTypeSlug("head_spa")).toBe("head-spa");
  });
});

describe("sections", () => {
  it("exposes the four content sections in order", () => {
    expect(SECTIONS.map((s) => s.slug)).toEqual([
      "beauty",
      "places",
      "wellness",
      "around-seoul",
    ]);
  });
  it("has the five beauty tabs including Skincare and Ingredients", () => {
    expect(BEAUTY_TABS.map((t) => t.key)).toEqual([
      "all",
      "skincare",
      "hair",
      "ingredients",
      "picks",
    ]);
    expect(BEAUTY_TABS.find((t) => t.key === "ingredients")?.href).toBe(
      "/ingredients"
    );
    expect(BEAUTY_TABS.find((t) => t.key === "skincare")?.href).toBe(
      "/beauty/skincare"
    );
  });
});
