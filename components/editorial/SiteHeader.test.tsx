import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("renders the wordmark linking home", () => {
    render(<SiteHeader />);
    const home = screen.getByRole("link", { name: "A Drop of Seoul" });
    expect(home.getAttribute("href")).toBe("/");
  });
  it("renders every primary nav link", () => {
    render(<SiteHeader />);
    for (const label of [
      "Beauty",
      "Places",
      "Wellness",
      "Around Seoul",
      "About",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }
  });
  it("toggles the mobile menu panel", () => {
    render(<SiteHeader />);
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBe(null);
    const button = screen.getByRole("button", { name: /menu/i });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeTruthy();
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });
});
