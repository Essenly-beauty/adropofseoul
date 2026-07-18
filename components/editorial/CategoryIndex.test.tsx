import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryIndex } from "./CategoryIndex";

describe("CategoryIndex", () => {
  it("renders a linked row per section", () => {
    render(<CategoryIndex />);
    expect(
      screen.getByRole("link", { name: /Beauty/ }).getAttribute("href")
    ).toBe("/beauty");
    expect(
      screen.getByRole("link", { name: /Wellness/ }).getAttribute("href")
    ).toBe("/wellness");
    expect(
      screen.getByRole("link", { name: /Around Seoul/ }).getAttribute("href")
    ).toBe("/around-seoul");
  });
});
