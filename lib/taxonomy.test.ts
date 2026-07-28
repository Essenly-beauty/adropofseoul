import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
  groupPlacesBySection,
  neighborhoodAreas,
  sectionDirectoryHref,
  SEOUL_NEIGHBORHOODS,
  type NeighborhoodSection,
  type Neighborhood,
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
  ) => ({
    category,
    entryType,
  });

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

describe("seoul neighborhoods", () => {
  it("exposes the four neighborhoods in order", () => {
    expect(SEOUL_NEIGHBORHOODS.map((n) => n.slug)).toEqual([
      "seongsu",
      "hongdae",
      "myeongdong",
      "gangnam-cheongdam",
    ]);
  });

  it("derives hub areas with label fallback", () => {
    expect(neighborhoodAreas(getNeighborhood("myeongdong")!)).toEqual([
      "Myeongdong",
    ]);
    expect(neighborhoodAreas(getNeighborhood("hongdae")!)).toEqual([
      "Hongdae",
      "Yeonnam",
    ]);
    expect(neighborhoodAreas(getNeighborhood("gangnam-cheongdam")!)).toEqual([
      "Gangnam",
      "Cheongdam",
      "Apgujeong",
      "Garosugil",
    ]);
  });

  it("only uses known place types in section configs", () => {
    for (const n of SEOUL_NEIGHBORHOODS)
      for (const s of n.sections ?? [])
        for (const c of s.categories)
          expect(
            PLACE_TYPE_LABELS[c],
            `${n.slug} / ${s.title} / ${c}`
          ).toBeTruthy();
  });

  it("only uses real area values in hub configs", () => {
    const curation = JSON.parse(
      readFileSync(join(__dirname, "../data/places-curation.en.json"), "utf8")
    ) as { places: Record<string, { area: string | null }> };
    const known = new Set(
      Object.values(curation.places)
        .map((p) => p.area)
        .filter(Boolean)
    );
    for (const n of SEOUL_NEIGHBORHOODS) {
      if (n.areas) expect(n.areas.length, n.slug).toBeGreaterThan(0);
      for (const a of neighborhoodAreas(n))
        expect(known.has(a), `${n.slug} / ${a}`).toBe(true);
    }
  });
});

describe("sectionDirectoryHref", () => {
  const single = (over: Partial<Neighborhood> = {}): Neighborhood => ({
    slug: "myeongdong",
    label: "Myeongdong",
    blurb: "",
    ...over,
  });
  const multi = (): Neighborhood => ({
    slug: "gangnam-cheongdam",
    label: "Gangnam & Cheongdam",
    blurb: "",
    areas: ["Gangnam", "Cheongdam"],
  });

  it("single-area + single-category → area and type", () => {
    expect(
      sectionDirectoryHref(single(), { title: "S", categories: ["facial"] })
    ).toBe("/seoul/places?area=Myeongdong&type=facial");
  });

  it("single-area + multi-category + entryType → area and kind", () => {
    expect(
      sectionDirectoryHref(single(), {
        title: "S",
        categories: ["perfume", "makeup"],
        entryType: "experience",
      })
    ).toBe("/seoul/places?area=Myeongdong&kind=experience");
  });

  it("multi-area + single-category → type only (no area)", () => {
    expect(
      sectionDirectoryHref(multi(), { title: "S", categories: ["salon"] })
    ).toBe("/seoul/places?type=salon");
  });

  it("multi-area + multi-category + no entryType → bare /seoul/places", () => {
    expect(
      sectionDirectoryHref(multi(), {
        title: "S",
        categories: ["salon", "makeup"],
      })
    ).toBe("/seoul/places");
  });
});
