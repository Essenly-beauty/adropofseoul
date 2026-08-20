import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthorByline, EditorialNote } from "./AuthorByline";

describe("AuthorByline", () => {
  it("links publication bylines to the editorial standards", () => {
    render(<AuthorByline author="A Drop of Seoul Editorial" />);
    expect(
      screen
        .getByRole("link", { name: "A Drop of Seoul Editorial" })
        .getAttribute("href")
    ).toBe("/editorial-standards");
  });

  it("keeps the publication date", () => {
    render(
      <AuthorByline
        author="Jane Kim"
        publishedAt="2026-08-20T00:00:00.000Z"
      />
    );
    expect(screen.getByText(/Jane Kim/)).toBeTruthy();
    expect(screen.getByText(/August 20, 2026/)).toBeTruthy();
  });
});

describe("EditorialNote", () => {
  it("links to the sourcing policy", () => {
    render(<EditorialNote />);
    expect(
      screen
        .getByRole("link", { name: /editorial and sourcing standards/i })
        .getAttribute("href")
    ).toBe("/editorial-standards");
  });
});
