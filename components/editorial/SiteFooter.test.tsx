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
      screen.getByRole("link", { name: "The Edit" }).getAttribute("href")
    ).toBe("/the-edit");
    expect(
      screen
        .getByRole("link", { name: "Affiliate Disclosure" })
        .getAttribute("href")
    ).toBe("/affiliate-disclosure");
    expect(screen.getByText(/All rights reserved/)).toBeTruthy();
  });
});
