import { describe, expect, it } from "vitest";
import {
  getSkinGuideProfile,
  SKIN_GUIDE_PROFILES,
  SKIN_GUIDE_PROFILE_SLUGS,
} from "./profiles";

describe("skin guide profiles", () => {
  it("provides one guide for every quiz result slug", () => {
    expect(SKIN_GUIDE_PROFILES).toHaveLength(6);
    expect(new Set(SKIN_GUIDE_PROFILE_SLUGS).size).toBe(6);
  });

  it("returns a complete guide by slug", () => {
    expect(getSkinGuideProfile("hydration-seeker")).toMatchObject({
      name: "The Hydration Seeker",
      routine: expect.any(Array),
    });
    expect(getSkinGuideProfile("not-a-profile")).toBeUndefined();
  });
});
