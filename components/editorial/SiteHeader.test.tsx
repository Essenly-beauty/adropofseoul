import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
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
      "Guides",
      "The Edit",
      "About",
      "Search",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: "Skincare" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Hair Salons" })).toBeTruthy();
  });
  it("toggles the mobile menu panel", () => {
    render(<SiteHeader />);
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBe(null);
    const button = screen.getByRole("button", { name: /menu/i });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeTruthy();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: /beauty/i })).toBeTruthy();
  });
  it("exposes an All Places link in the Places dropdown", () => {
    render(<SiteHeader />);
    const allPlaces = screen.getByRole("link", { name: "All Places →" });
    expect(allPlaces.getAttribute("href")).toBe("/places");
  });
  it("does not duplicate the All Places link in the mobile menu", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole("button", { name: /menu/i }));
    fireEvent.click(screen.getByRole("button", { name: /places/i }));
    const mobileNav = screen.getByRole("navigation", { name: "Mobile" });
    const placesLinks = within(mobileNav)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/places");
    expect(placesLinks).toHaveLength(1);
    expect(placesLinks[0].textContent).toBe("All Places");
  });
});
