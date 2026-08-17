import { describe, it, expect } from "vitest";
import { categoryLabel } from "./categories";

describe("categoryLabel", () => {
  it("maps legacy beauty and hair categories to the current sections", () => {
    expect(categoryLabel("beauty")).toBe("Skincare");
    expect(categoryLabel("hair")).toBe("Haircare");
  });
  it("surfaces head-spa articles under the Wellness label", () => {
    expect(categoryLabel("head_spa")).toBe("Wellness");
    expect(categoryLabel("wellness")).toBe("Wellness");
  });
  it("labels Seoul categories with the current section name", () => {
    expect(categoryLabel("guides")).toBe("A Local's Seoul");
    expect(categoryLabel("places")).toBe("A Local's Seoul");
  });
  it("falls back to the raw value for unknown categories", () => {
    expect(categoryLabel("unknown")).toBe("unknown");
  });
});
