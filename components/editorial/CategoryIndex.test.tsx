import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryIndex } from "./CategoryIndex";

describe("CategoryIndex", () => {
  it("renders a linked row per category", () => {
    render(<CategoryIndex />);
    const beauty = screen.getByRole("link", { name: /Beauty/ });
    expect(beauty.getAttribute("href")).toBe("/beauty");
    const headSpa = screen.getByRole("link", { name: /Head Spa/ });
    expect(headSpa.getAttribute("href")).toBe("/head-spa");
  });
});
