import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("explains the brand relationship and leads into site exploration", () => {
    render(<Hero />);

    expect(
      screen.getByText(/A considered guide to Korean beauty/)
    ).toBeTruthy();
    expect(screen.getByText("Discover")).toBeTruthy();
    expect(screen.getByText("Plan & save")).toBeTruthy();
    expect(screen.getByText(/Guides and practical information/)).toBeTruthy();
    expect(screen.getByText(/Your personal space to save/)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Explore Seoul & Beauty ↓" })
        .getAttribute("href")
    ).toBe("#explore");
    expect(
      screen
        .getByRole("link", { name: "Find My Beauty Profile →" })
        .getAttribute("href")
    ).toBe("/beauty-profile");
  });
});
