import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "./nav";

describe("NAV_ITEMS", () => {
  it("lists the primary nav in exact order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Beauty",
      "Hair",
      "Places",
      "Head Spa",
      "Guides",
      "Picks",
      "About",
    ]);
  });
  it("maps Head Spa to the /head-spa route and Places to the directory", () => {
    expect(NAV_ITEMS.find((i) => i.label === "Head Spa")?.href).toBe(
      "/head-spa"
    );
    expect(NAV_ITEMS.find((i) => i.label === "Places")?.href).toBe("/places");
  });
});
