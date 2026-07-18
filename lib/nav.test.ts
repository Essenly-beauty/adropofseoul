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
});
