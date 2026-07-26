import { describe, it, expect } from "vitest";
import {
  isPick,
  WELLNESS_CATEGORIES,
  getNeighborhood,
  regionForGuide,
  PLACE_TYPE_LABELS,
  placeCategoryFromType,
  placeTypeSlug,
  SECTIONS,
  SKINCARE_TABS,
  sectionForCategory,
  POST_CATEGORIES,
  POST_STATUSES,
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
    expect(placeCategoryFromType("personal-color")).toBe("personal_color");
    expect(placeTypeSlug("nail_lash")).toBe("nail-lash");
  });

  it("labels every directory category", () => {
    for (const cat of [
      "personal_color",
      "makeup",
      "spa",
      "facial",
      "nail_lash",
      "perfume",
      "cooking_class",
      "food_tour",
    ])
      expect(PLACE_TYPE_LABELS[cat]).toBeTruthy();
  });
});

describe("sections", () => {
  it("exposes the five content sections in order", () => {
    expect(SECTIONS.map((s) => s.slug)).toEqual([
      "skincare",
      "haircare",
      "wellness",
      "seoul",
      "stories",
    ]);
  });
  it("has the skincare tabs including Ingredients and Picks", () => {
    expect(SKINCARE_TABS.map((t) => t.key)).toEqual([
      "skincare",
      "ingredients",
      "picks",
    ]);
    expect(SKINCARE_TABS.find((t) => t.key === "ingredients")?.href).toBe(
      "/ingredients"
    );
    expect(SKINCARE_TABS.find((t) => t.key === "picks")?.href).toBe(
      "/skincare/picks"
    );
  });
});

describe("sectionForCategory", () => {
  it("maps DB categories to their new sections", () => {
    expect(sectionForCategory("beauty").href).toBe("/skincare");
    expect(sectionForCategory("hair").href).toBe("/haircare");
    expect(sectionForCategory("head_spa").href).toBe("/wellness");
    expect(sectionForCategory("wellness").href).toBe("/wellness");
    expect(sectionForCategory("places").href).toBe("/seoul");
    expect(sectionForCategory("guides").href).toBe("/seoul");
  });
});

describe("post taxonomy", () => {
  it("lists the post_category enum values", () => {
    expect(POST_CATEGORIES.map((c) => c.value)).toEqual([
      "beauty",
      "hair",
      "head_spa",
      "places",
      "wellness",
      "products",
      "guides",
    ]);
  });
  it("lists the post_status enum values", () => {
    expect(POST_STATUSES.map((s) => s.value)).toEqual(["draft", "published"]);
  });
});
