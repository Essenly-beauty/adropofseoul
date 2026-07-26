import { describe, it, expect } from "vitest";
import { NAV_ITEMS, NAV_CTA } from "./nav";

describe("NAV_ITEMS", () => {
  it("lists the primary nav in exact order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Skincare",
      "Haircare",
      "Wellness",
      "Seoul",
      "Stories",
      "About",
    ]);
  });
  it("maps sections to their routes", () => {
    expect(NAV_ITEMS.find((i) => i.label === "Seoul")?.href).toBe("/seoul");
    expect(NAV_ITEMS.find((i) => i.label === "Haircare")?.href).toBe(
      "/haircare"
    );
    expect(NAV_ITEMS.find((i) => i.label === "Wellness")?.href).toBe(
      "/wellness"
    );
  });
  it("exposes sub-categories for the GNB preview", () => {
    const haircare = NAV_ITEMS.find((i) => i.label === "Haircare");
    expect(haircare?.children?.map((c) => c.href)).toContain(
      "/beauty-profile/hair"
    );
    expect(haircare?.children?.map((c) => c.label)).toContain("Ingredients");
    const seoul = NAV_ITEMS.find((i) => i.label === "Seoul");
    expect(seoul?.children?.map((c) => c.href)).toContain("/seoul/places");
    expect(seoul?.children?.map((c) => c.href)).toContain(
      "/seoul/neighborhoods"
    );
    expect(seoul?.children?.map((c) => c.href)).toContain(
      "/seoul/neighborhoods/seongsu"
    );
    // Home / About stay flat
    expect(
      NAV_ITEMS.find((i) => i.label === "About")?.children
    ).toBeUndefined();
  });
  it("exposes the Beauty Profile CTA", () => {
    expect(NAV_CTA.label).toBe("My Beauty Profile");
    expect(NAV_CTA.href).toBe("/beauty-profile");
  });
});
