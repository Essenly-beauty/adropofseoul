import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "./nav";

describe("NAV_ITEMS", () => {
  it("lists the primary nav in exact order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Beauty",
      "Places",
      "Guides",
      "The Edit",
      "About",
      "Search",
    ]);
  });
  it("maps dropdown sections to discovery routes", () => {
    expect(
      NAV_ITEMS.find((i) => i.label === "Beauty")?.items?.map((i) => i.href)
    ).toEqual([
      "/beauty/skincare",
      "/ingredients",
      "/beauty/hair",
      "/beauty/scalp",
      "/beauty/treatments",
    ]);
    expect(NAV_ITEMS.find((i) => i.label === "Places")?.href).toBe("/places");
    expect(NAV_ITEMS.find((i) => i.label === "The Edit")?.href).toBe(
      "/the-edit"
    );
  });
});
