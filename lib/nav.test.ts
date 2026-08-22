import { describe, it, expect } from "vitest";
import { NAV_ITEMS, NAV_CTA } from "./nav";

describe("NAV_ITEMS", () => {
  it("lists the primary nav in exact order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Beauty",
      "Wellness",
      "A Local's Seoul",
      "Stories",
      "About",
    ]);
  });
  it("maps sections to their routes", () => {
    expect(NAV_ITEMS.find((i) => i.label === "A Local's Seoul")?.href).toBe(
      "/seoul"
    );
    expect(NAV_ITEMS.find((i) => i.label === "Beauty")?.href).toBe("/beauty");
    expect(NAV_ITEMS.find((i) => i.label === "Wellness")?.href).toBe(
      "/wellness"
    );
  });
  it("exposes sub-categories for the GNB preview", () => {
    const beauty = NAV_ITEMS.find((i) => i.label === "Beauty");
    expect(beauty?.children?.map((c) => c.href)).toEqual([
      "/skincare",
      "/haircare",
      "/beauty-profile",
    ]);
    const skincare = beauty?.children?.find((c) => c.href === "/skincare");
    expect(skincare?.children?.map((c) => c.href)).toEqual([
      "/ingredients",
      "/skincare/picks",
    ]);
    const profile = beauty?.children?.find((c) => c.href === "/beauty-profile");
    expect(profile?.children?.map((c) => c.href)).toEqual([
      "/beauty-profile/skin",
      "/beauty-profile/hair",
    ]);
    const seoul = NAV_ITEMS.find((i) => i.label === "A Local's Seoul");
    expect(seoul?.children?.map((c) => c.href)).toEqual([
      "/seoul/neighborhoods",
    ]);
    // Individual neighborhoods nest one level under "Neighborhoods".
    const hoods = seoul?.children?.find(
      (c) => c.href === "/seoul/neighborhoods"
    );
    expect(hoods?.children?.map((c) => c.href)).toEqual([
      "/seoul/neighborhoods/seongsu",
      "/seoul/neighborhoods/hongdae",
      "/seoul/neighborhoods/myeongdong",
      "/seoul/neighborhoods/gangnam-cheongdam",
      "/seoul/neighborhoods/hannam",
    ]);
    // Home / About stay flat
    expect(
      NAV_ITEMS.find((i) => i.label === "About")?.children
    ).toBeUndefined();
  });
  it("explains the My Seoul Drop CTA", () => {
    expect(NAV_CTA.eyebrow).toBe("Plan your Seoul");
    expect(NAV_CTA.label).toBe("My Seoul Drop");
  });
});
