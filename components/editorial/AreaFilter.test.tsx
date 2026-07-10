import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AreaFilter } from "./AreaFilter";

describe("AreaFilter", () => {
  it("renders All plus a chip per area with correct hrefs and marks the active one", () => {
    render(<AreaFilter areas={["Seongsu", "Hannam"]} active="Seongsu" />);

    expect(screen.getByRole("link", { name: "All" }).getAttribute("href")).toBe(
      "/places"
    );

    const seongsu = screen.getByRole("link", { name: "Seongsu" });
    expect(seongsu.getAttribute("href")).toBe("/places?area=Seongsu");
    expect(seongsu.getAttribute("aria-current")).toBe("true");

    const hannam = screen.getByRole("link", { name: "Hannam" });
    expect(hannam.getAttribute("aria-current")).toBe(null);
  });

  it("marks All as active when no area is selected", () => {
    render(<AreaFilter areas={["Seongsu"]} />);
    expect(
      screen.getByRole("link", { name: "All" }).getAttribute("aria-current")
    ).toBe("true");
  });
});
