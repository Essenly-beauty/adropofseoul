import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceFilters } from "./PlaceFilters";

const kinds = [
  { value: "place", label: "Places" },
  { value: "experience", label: "Experiences" },
];
const types = [
  { slug: "cafe", label: "Café" },
  { slug: "salon", label: "Salon" },
];
const areas = ["Hannam", "Seongsu"];

describe("PlaceFilters", () => {
  it("keeps the other active dimensions when linking a type", () => {
    render(
      <PlaceFilters
        kinds={kinds}
        types={types}
        areas={areas}
        activeKind="experience"
        activeArea="Hannam"
      />
    );

    expect(
      screen.getByRole("link", { name: "Café" }).getAttribute("href")
    ).toBe("/seoul/places?kind=experience&area=Hannam&type=cafe");
  });

  it("keeps the other active dimensions when linking an area", () => {
    render(
      <PlaceFilters
        kinds={kinds}
        types={types}
        areas={areas}
        activeKind="place"
        activeType="cafe"
      />
    );

    expect(
      screen.getByRole("link", { name: "Seongsu" }).getAttribute("href")
    ).toBe("/seoul/places?kind=place&area=Seongsu&type=cafe");
  });

  it("marks the active chip with aria-current", () => {
    render(<PlaceFilters types={types} areas={areas} activeType="cafe" />);

    expect(
      screen.getByRole("link", { name: "Café" }).getAttribute("aria-current")
    ).toBe("true");
    expect(
      screen.getByRole("link", { name: "Salon" }).getAttribute("aria-current")
    ).toBeNull();
  });

  it("labels each filter group with the axis it controls", () => {
    render(<PlaceFilters kinds={kinds} types={types} areas={areas} />);

    expect(screen.getByText("Show")).not.toBeNull();
    expect(screen.getByText("Type")).not.toBeNull();
    expect(screen.getByText("Area")).not.toBeNull();
  });

  it("names each group's nav after its visible label", () => {
    render(<PlaceFilters kinds={kinds} types={types} areas={areas} />);

    expect(screen.getByRole("navigation", { name: "Show" })).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Type" })).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Area" })).not.toBeNull();
  });

  it("resets each group with a chip that just reads All", () => {
    render(<PlaceFilters kinds={kinds} types={types} areas={areas} />);

    const resets = screen.getAllByRole("link", { name: "All" });
    expect(resets.map((r) => r.getAttribute("href"))).toEqual([
      "/seoul/places",
      "/seoul/places",
      "/seoul/places",
    ]);
  });

  it("omits a group that has no options", () => {
    render(<PlaceFilters types={types} areas={[]} />);

    expect(screen.queryByRole("link", { name: "Places" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Seongsu" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Café" })).not.toBeNull();
  });
});
