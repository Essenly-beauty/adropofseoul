import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "./nav";

describe("NAV_ITEMS", () => {
  it("lists the primary nav in exact order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Beauty",
      "Places",
      "Wellness",
      "Around Seoul",
      "About",
    ]);
  });
  it("maps sections to their routes", () => {
    expect(NAV_ITEMS.find((i) => i.label === "Around Seoul")?.href).toBe(
      "/around-seoul"
    );
    expect(NAV_ITEMS.find((i) => i.label === "Places")?.href).toBe("/places");
    expect(NAV_ITEMS.find((i) => i.label === "Wellness")?.href).toBe(
      "/wellness"
    );
  });
  it("exposes sub-categories for the GNB preview", () => {
    const beauty = NAV_ITEMS.find((i) => i.label === "Beauty");
    expect(beauty?.children?.map((c) => c.label)).toEqual([
      "Skincare",
      "Hair",
      "Ingredients",
      "Picks",
    ]);
    const around = NAV_ITEMS.find((i) => i.label === "Around Seoul");
    expect(around?.children?.map((c) => c.label)).toContain("Seongsu");
    expect(around?.children?.map((c) => c.label)).toContain("Common");
    const places = NAV_ITEMS.find((i) => i.label === "Places");
    expect(places?.children?.map((c) => c.href)).toContain(
      "/places?type=head-spa"
    );
    // Home / About stay flat
    expect(
      NAV_ITEMS.find((i) => i.label === "About")?.children
    ).toBeUndefined();
  });
});
