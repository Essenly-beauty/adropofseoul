import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
      "Hair",
      "Places",
      "Head Spa",
      "Guides",
      "Picks",
      "About",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }
  });
});
