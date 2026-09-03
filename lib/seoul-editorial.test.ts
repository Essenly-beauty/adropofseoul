import { describe, expect, it } from "vitest";
import { parseSeoulFacets, primarySeoulRegion } from "./seoul-editorial";

describe("Seoul editorial facets", () => {
  it("groups namespaced tags and ignores ordinary discovery tags", () => {
    expect(
      parseSeoulFacets([
        "seoul",
        "region:mangwon",
        "format:how-to",
        "interest:food",
        "interest:outdoors",
        "mood:slow",
      ])
    ).toEqual({
      region: ["mangwon"],
      format: ["how-to"],
      interest: ["food", "outdoors"],
      mood: ["slow"],
    });
  });

  it("uses the first region as the canonical neighborhood", () => {
    expect(primarySeoulRegion(["region:hongdae", "region:yeonnam"])).toBe(
      "hongdae"
    );
    expect(primarySeoulRegion(["seoul", "first trip"])).toBe("common");
  });
});
