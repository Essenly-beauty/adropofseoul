import { describe, it, expect } from "vitest";
import { NAV_ITEMS, NAV_CTA } from "./nav";

describe("NAV_ITEMS", () => {
  it("lists the primary nav in exact order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Skincare",
      "Haircare",
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
    expect(NAV_ITEMS.find((i) => i.label === "Haircare")?.href).toBe(
      "/haircare"
    );
    expect(NAV_ITEMS.find((i) => i.label === "Wellness")?.href).toBe(
      "/wellness"
    );
  });
  it("exposes sub-categories for the GNB preview", () => {
    const skincare = NAV_ITEMS.find((i) => i.label === "Skincare");
    expect(skincare?.children?.map((c) => c.href)).toContain(
      "/beauty-profile/skin"
    );
    const haircare = NAV_ITEMS.find((i) => i.label === "Haircare");
    expect(haircare?.children?.map((c) => c.href)).toContain(
      "/beauty-profile/hair"
    );
    expect(haircare?.children?.map((c) => c.label)).toContain("Ingredients");
    const seoul = NAV_ITEMS.find((i) => i.label === "A Local's Seoul");
    expect(seoul?.children?.map((c) => c.href)).toEqual([
      "/seoul/places",
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
