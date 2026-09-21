import { describe, it, expect } from "vitest";
import { NAV_ITEMS, NAV_SECONDARY, NAV_CTA } from "./nav";
describe("approved navigation", () => {
  it("separates the three primary sections from archive and about", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Seoul, Explained",
      "Places",
      "Beauty",
    ]);
    expect(NAV_SECONDARY.map((i) => i.label)).toEqual(["All Stories", "About"]);
    expect(NAV_SECONDARY.every((i) => !i.children)).toBe(true);
  });
  it("offers the complete beauty journal before focused topics and the profile tool", () => {
    expect(NAV_ITEMS[2].children?.map((c) => c.label)).toEqual([
      "The Edit",
      "Skincare",
      "Hair & Scalp",
      "Ingredients",
      "Picks",
      "Beauty Profile",
    ]);
    expect(NAV_ITEMS[2].children?.at(-1)?.divider).toBe(true);
    expect(
      NAV_ITEMS.flatMap((i) => i.children ?? []).every(
        (c) => !("children" in c)
      )
    ).toBe(true);
  });
  it("retains the companion planning CTA", () => {
    expect(NAV_CTA.eyebrow).toBe("Plan your Seoul");
    expect(NAV_CTA.label).toBe("My Seoul Drop");
  });
});
