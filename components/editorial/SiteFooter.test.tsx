import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("renders the wordmark linking home", () => {
    render(<SiteFooter />);
    const home = screen.getByRole("link", { name: "A Drop of Seoul" });
    expect(home.getAttribute("href")).toBe("/");
  });
  it("renders curated column links and copyright", () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole("link", { name: "Beauty" }).getAttribute("href")
    ).toBe("/beauty");
    expect(
      screen.getByRole("link", { name: "Places" }).getAttribute("href")
    ).toBe("/places");
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }).getAttribute("href")
    ).toBe("/privacy");
    expect(
      screen.getByRole("link", { name: "Terms of Use" }).getAttribute("href")
    ).toBe("/terms");
    expect(screen.getByText(/All rights reserved/)).toBeTruthy();
  });
});
