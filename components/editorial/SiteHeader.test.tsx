import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("previews secondary destinations on hover and toggle while retaining direct links", () => {
    render(<SiteHeader />);
    const stories = screen.getByRole("button", { name: "All Stories preview" });
    fireEvent.mouseEnter(stories.parentElement!.parentElement!);
    fireEvent.click(stories);
    expect(stories.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen
        .getByRole("link", { name: "All Stories", exact: true })
        .getAttribute("href")
    ).toBe("/stories");
    expect(
      screen
        .getByRole("link", { name: /Browse all stories/ })
        .getAttribute("href")
    ).toBe("/stories");
    const about = screen.getByRole("button", { name: "About preview" });
    fireEvent.click(about);
    expect(stories.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.getByRole("link", { name: /Read our story/ }).getAttribute("href")
    ).toBe("/about");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(about.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(about);
  });
  it("toggles mobile previews independently of destination links", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const mobile = within(screen.getByRole("navigation", { name: "Mobile" }));
    fireEvent.click(mobile.getByRole("button", { name: "About preview" }));
    expect(
      mobile.getByRole("link", { name: /Read our story/ }).getAttribute("href")
    ).toBe("/about");
    fireEvent.click(
      mobile.getByRole("button", { name: "All Stories preview" })
    );
    expect(mobile.queryByRole("link", { name: /Read our story/ })).toBeNull();
    expect(
      mobile.getByRole("link", { name: /Browse all stories/ })
    ).toBeTruthy();
  });
  it("retains the primary landing routes and home wordmark", () => {
    render(<SiteHeader />);
    expect(
      screen.getByRole("link", { name: "A Drop of Seoul" }).getAttribute("href")
    ).toBe("/");
    const nav = within(screen.getByRole("navigation", { name: "Primary" }));
    for (const [name, href] of [
      ["Seoul, Explained", "/seoul-explained"],
      ["Places", "/seoul"],
      ["Beauty", "/beauty"],
    ]) {
      expect(
        nav.getByRole("link", { name, exact: true }).getAttribute("href")
      ).toBe(href);
    }
  });
  it("keeps the submenu open when clicking after hover, and closes on Escape", () => {
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: "Beauty submenu" });
    fireEvent.mouseEnter(trigger.parentElement!.parentElement!);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("link", { name: /The Edit/ }).getAttribute("href")
    ).toBe("/beauty/the-edit");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
  it("dismisses the submenu with an outside click", () => {
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: "Places submenu" });
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerDown(document.body);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
  it("expands mobile topics one section at a time", () => {
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const mobile = within(screen.getByRole("navigation", { name: "Mobile" }));
    expect(mobile.queryByRole("link", { name: "The Edit" })).toBeNull();
    fireEvent.click(mobile.getByRole("button", { name: "Beauty topics" }));
    expect(
      mobile.getByRole("link", { name: "The Edit" }).getAttribute("href")
    ).toBe("/beauty/the-edit");
    fireEvent.click(mobile.getByRole("button", { name: "Places topics" }));
    expect(mobile.queryByRole("link", { name: "The Edit" })).toBeNull();
    expect(
      mobile.getByRole("link", { name: "All Places" }).getAttribute("href")
    ).toBe("/seoul/places");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBeNull();
  });
  it("opens an accessible search form using the existing archive query", () => {
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: "Search stories" });
    fireEvent.click(trigger);
    const form = screen.getByRole("search");
    expect(form.getAttribute("action")).toBe("/stories");
    const input = screen.getByRole("searchbox", { name: "Search all stories" });
    expect(input.getAttribute("name")).toBe("q");
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("search")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
