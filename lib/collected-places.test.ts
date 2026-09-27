import { describe, expect, it } from "vitest";
import {
  collectedPlaces,
  getCollectedPlace,
  mergeCollectedPlaces,
} from "./collected-places";

describe("collected Places directory", () => {
  it("serves unique photo-backed detail records with real map links", () => {
    expect(new Set(collectedPlaces.map((p) => p.slug)).size).toBe(
      collectedPlaces.length
    );
    for (const place of collectedPlaces) {
      expect(getCollectedPlace(place.slug)).toBe(place);
      expect(place.images.length).toBeGreaterThan(0);
      expect(place.googleMapUrl).toMatch(/^https:\/\/www.google.com\/maps\//);
    }
    expect(getCollectedPlace("missing-place")).toBeNull();
  });

  it("preserves CMS edits, deduplicates by slug, and applies filters before limits", () => {
    const local = collectedPlaces.find((p) => p.category === "salon")!;
    const cms = {
      ...local,
      name: "AAA CMS title",
      shortDescription: "CMS description",
      images: ["/cms.jpg"],
    };
    const result = mergeCollectedPlaces([cms], {
      category: "salon",
      areas: [local.area!],
      limit: 1,
    });
    expect(result).toEqual([cms]);
    expect(
      mergeCollectedPlaces([], { category: "museum", limit: 300 }).every(
        (p) => p.category === "museum"
      )
    ).toBe(true);
    expect(mergeCollectedPlaces([], { area: "No such area" })).toEqual([]);
  });
});
