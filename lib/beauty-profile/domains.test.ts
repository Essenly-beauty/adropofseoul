import { describe, expect, it } from "vitest";
import { BEAUTY_PROFILE_DOMAINS, getBeautyProfileDomain } from "./domains";

describe("beauty profile domains", () => {
  it("offers both completed profile experiences from the hub", () => {
    expect(BEAUTY_PROFILE_DOMAINS).toHaveLength(2);
    expect(
      BEAUTY_PROFILE_DOMAINS.every((domain) => domain.status === "available")
    ).toBe(true);
  });

  it("links Skin Profile to its live entry page", () => {
    expect(getBeautyProfileDomain("skin")).toMatchObject({
      href: "/beauty-profile/skin",
      status: "available",
    });
  });
});
