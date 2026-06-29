import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("The Seoul Head Spa Ritual")).toBe(
      "the-seoul-head-spa-ritual"
    );
  });
  it("strips punctuation and collapses spaces", () => {
    expect(slugify("Five K-Beauty  Serums!")).toBe("five-k-beauty-serums");
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("  Hello  ")).toBe("hello");
  });
});
