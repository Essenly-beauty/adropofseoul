import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryIndex } from "./CategoryIndex";

describe("CategoryIndex", () => {
  it("renders a linked row per section", () => {
    render(<CategoryIndex />);
    // Accessible name is "<label> <blurb> Enter →" — anchor to the label so a
    // blurb that mentions another section (Stories mentions "Seoul") is ignored.
    expect(
      screen.getByRole("link", { name: /^Beauty/ }).getAttribute("href")
    ).toBe("/beauty");
    expect(
      screen
        .getByRole("link", { name: /^Seoul, Explained/ })
        .getAttribute("href")
    ).toBe("/seoul-explained");
    expect(
      screen.getByRole("link", { name: /^Places/ }).getAttribute("href")
    ).toBe("/seoul");
  });
});
