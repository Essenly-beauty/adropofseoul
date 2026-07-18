import { describe, it, expect } from "vitest";
import { categoryLabel } from "./categories";

describe("categoryLabel", () => {
  it("labels beauty and hair as themselves", () => {
    expect(categoryLabel("beauty")).toBe("Beauty");
    expect(categoryLabel("hair")).toBe("Hair");
  });
  it("surfaces head-spa articles under the Wellness label", () => {
    expect(categoryLabel("head_spa")).toBe("Wellness");
    expect(categoryLabel("wellness")).toBe("Wellness");
  });
  it("labels guides as Around Seoul", () => {
    expect(categoryLabel("guides")).toBe("Around Seoul");
  });
  it("falls back to the raw value for unknown categories", () => {
    expect(categoryLabel("unknown")).toBe("unknown");
  });
});
