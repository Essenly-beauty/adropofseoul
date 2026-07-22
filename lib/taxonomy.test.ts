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
  BEAUTY_TABS,
  POST_CATEGORIES,
  POST_STATUSES,
  groupPlacesBySection,
  type NeighborhoodSection,
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

describe("groupPlacesBySection", () => {
  const sections: NeighborhoodSection[] = [
    { title: "Shops", categories: ["shop"] },
    {
      title: "Classes",
      categories: ["perfume", "facial"],
      entryType: "experience",
    },
    { title: "Services", categories: ["salon", "facial"], entryType: "place" },
  ];
  const p = (
    category: string,
    entryType: "place" | "experience" = "place"
  ) => ({ category, entryType });

  it("groups by category in section order and drops empty sections", () => {
    const groups = groupPlacesBySection([p("salon"), p("shop")], sections);
    expect(groups.map((g) => g.section.title)).toEqual(["Shops", "Services"]);
  });

  it("routes the same category to different sections by entry type", () => {
    const groups = groupPlacesBySection(
      [p("facial", "experience"), p("facial", "place")],
      sections
    );
    expect(groups.map((g) => g.section.title)).toEqual(["Classes", "Services"]);
    expect(groups[0].places).toHaveLength(1);
  });

  it("assigns each place to the first matching section only", () => {
    const overlapping: NeighborhoodSection[] = [
      { title: "A", categories: ["shop"] },
      { title: "B", categories: ["shop"] },
    ];
    const groups = groupPlacesBySection([p("shop")], overlapping);
    expect(groups).toHaveLength(1);
    expect(groups[0].section.title).toBe("A");
  });

  it("returns nothing when no places match", () => {
    expect(groupPlacesBySection([p("cafe")], sections)).toEqual([]);
  });

  it("gives Seongsu a purpose-section config in editorial order", () => {
    expect(getNeighborhood("seongsu")?.sections?.map((s) => s.title)).toEqual([
      "Shop the flagships",
      "Warehouse cafés",
      "Make something",
      "Beauty services on the rise",
    ]);
  });
});
