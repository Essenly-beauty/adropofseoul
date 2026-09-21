import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("provides one editorial heading, a real category anchor, and accessible imagery", () => {
    render(<Hero />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "A city is made of stories"
    );
    expect(
      screen
        .getByRole("link", { name: "Find your first story" })
        .getAttribute("href")
    ).toBe("#start-here");
    expect(screen.getByRole("img").getAttribute("alt")).toContain("Seoul");
    expect(screen.getByText("For my friends")).toBeTruthy();
  });
});
