import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryIndex } from "./CategoryIndex";

describe("CategoryIndex", () => {
  it("renders a linked row per section", () => {
    render(<CategoryIndex />);
    // Accessible name is "<label> <blurb> Enter →" — anchor to the label so a
    // blurb that mentions another section (Stories mentions "Seoul") is ignored.
    expect(
      screen.getByRole("link", { name: /^Skincare/ }).getAttribute("href")
    ).toBe("/skincare");
    expect(
      screen.getByRole("link", { name: /^Wellness/ }).getAttribute("href")
    ).toBe("/wellness");
    expect(
      screen.getByRole("link", { name: /^Seoul/ }).getAttribute("href")
    ).toBe("/seoul");
  });
});
