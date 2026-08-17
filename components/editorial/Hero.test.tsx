import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("leads with the two product journeys and explains editorial links", () => {
    render(<Hero />);

    const mySeoulDrop = screen.getByRole("link", {
      name: "Start My Seoul Drop ↗",
    });
    expect(mySeoulDrop.getAttribute("href")).toContain(
      "https://myseouldrop.app/"
    );
    expect(
      screen
        .getByRole("link", { name: "Find My Beauty Profile →" })
        .getAttribute("href")
    ).toBe("/beauty-profile");
    expect(
      screen
        .getByRole("link", { name: "Read Korean beauty guides →" })
        .getAttribute("href")
    ).toBe("/stories");
    expect(
      screen
        .getByRole("link", { name: "Browse vetted Seoul places →" })
        .getAttribute("href")
    ).toBe("/seoul/places");
  });
});
