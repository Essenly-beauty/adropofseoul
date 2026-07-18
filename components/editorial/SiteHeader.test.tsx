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
  it("shows sub-categories in the desktop dropdown markup", () => {
    render(<SiteHeader />);
    const primary = screen.getByRole("navigation", { name: "Primary" });
    const hrefs = Array.from(primary.querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs).toContain("/beauty/skincare");
    expect(hrefs).toContain("/ingredients");
    expect(hrefs).toContain("/around-seoul/seongsu");
  });
  it("lists sub-categories up front in the toggled mobile menu", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole("button", { name: /menu/i }));
    const mobile = screen.getByRole("navigation", { name: "Mobile" });
    const hrefs = Array.from(mobile.querySelectorAll("a")).map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs).toContain("/beauty/skincare");
    expect(hrefs).toContain("/ingredients");
    expect(hrefs).toContain("/places?type=head-spa");
    expect(hrefs).toContain("/around-seoul/common");
  });
});
