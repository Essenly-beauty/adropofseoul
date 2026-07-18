import { describe, it, expect } from "vitest";
import {
  COURSE_1_STOPS,
  COURSE_2_STOPS,
  COURSE_1_ALTERNATES,
  DEEP_LOCAL_DETOURS,
  googleMapsUrl,
  naverMapUrl,
  getCourse,
  type Stop,
} from "./courses";

const ALL: Stop[] = [
  ...COURSE_1_STOPS,
  ...COURSE_2_STOPS,
  ...COURSE_1_ALTERNATES,
  ...DEEP_LOCAL_DETOURS,
];

describe("course data integrity", () => {
  it("has the expected numbered stop counts", () => {
    expect(COURSE_1_STOPS).toHaveLength(7);
    expect(COURSE_2_STOPS).toHaveLength(4);
    expect(COURSE_1_STOPS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(COURSE_2_STOPS.map((s) => s.n)).toEqual([1, 2, 3, 4]);
  });

  it("uses unique anchor ids across every list", () => {
    const ids = ALL.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps ratings and coordinates sane (within Seongsu)", () => {
    for (const s of ALL) {
      expect(s.rating).toBeGreaterThanOrEqual(0);
      expect(s.rating).toBeLessThanOrEqual(5);
      expect(s.lat).toBeGreaterThan(37.53);
      expect(s.lat).toBeLessThan(37.56);
      expect(s.lng).toBeGreaterThan(127.04);
      expect(s.lng).toBeLessThan(127.07);
      expect(s.placeId).toMatch(/^ChIJ/);
      expect(s.nameKr.length).toBeGreaterThan(0);
    }
  });
});

describe("map links", () => {
  const stop = COURSE_1_STOPS[0];

  it("builds a Google link pinned by place id + encoded Korean name", () => {
    const url = googleMapsUrl(stop);
    expect(url).toContain("query_place_id=" + stop.placeId);
    expect(url).toContain(encodeURIComponent(stop.nameKr));
    expect(() => new URL(url)).not.toThrow();
  });

  it("builds a Naver search link", () => {
    const url = naverMapUrl(stop);
    expect(url).toContain("map.naver.com/p/search/");
    expect(url).toContain(encodeURIComponent(stop.nameKr));
    expect(() => new URL(url)).not.toThrow();
  });
});

describe("getCourse", () => {
  it("returns the matching course", () => {
    expect(getCourse(1).stops).toBe(COURSE_1_STOPS);
    expect(getCourse(2).stops).toBe(COURSE_2_STOPS);
  });
});
