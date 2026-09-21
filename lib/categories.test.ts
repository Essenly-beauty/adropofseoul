import { describe, it, expect } from "vitest";
import { categoryLabel } from "./categories";

describe("categoryLabel", () => {
  it("maps legacy beauty and hair categories to the current sections", () => {
    expect(categoryLabel("beauty")).toBe("Skincare");
    expect(categoryLabel("hair")).toBe("Hair & Scalp");
  });
  it("surfaces head-spa articles under Hair & Scalp", () => {
    expect(categoryLabel("head_spa")).toBe("Hair & Scalp");
    expect(categoryLabel("wellness")).toBe("Everyday Life");
  });
  it("labels Seoul categories with the current section name", () => {
    expect(categoryLabel("guides")).toBe("Places");
    expect(categoryLabel("places")).toBe("Places");
  });
  it("falls back to the raw value for unknown categories", () => {
    expect(categoryLabel("unknown")).toBe("unknown");
  });
});
