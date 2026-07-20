import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { PlacesDirectory } from "./PlacesDirectory";
import type { Place } from "@/lib/discovery";

const base: Omit<Place, "slug" | "name" | "type" | "neighborhood" | "summary"> =
  {
    overview: "",
    whyGo: [],
    bestFor: [],
    signatureServices: [],
  } as unknown as Omit<
    Place,
    "slug" | "name" | "type" | "neighborhood" | "summary"
  >;

function makePlace(
  slug: string,
  name: string,
  neighborhood: string,
  type: Place["type"] = "hair-salon"
): Place {
  return { ...base, slug, name, type, neighborhood, summary: name } as Place;
}

const places: Place[] = [
  makePlace("a", "Alpha Salon", "Hongdae"),
  makePlace("b", "Bravo Spa", "Seongsu", "head-spa"),
  makePlace("c", "Charlie Store", "Hongdae", "beauty-store"),
];

describe("PlacesDirectory", () => {
  it("shows all places by default", () => {
    render(<PlacesDirectory places={places} />);
    expect(screen.getByRole("link", { name: /Alpha Salon/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Bravo Spa/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Charlie Store/ })).toBeTruthy();
  });

  it("renders one chip per distinct neighborhood plus All", () => {
    render(<PlacesDirectory places={places} />);
    const filters = screen.getByRole("navigation", {
      name: "Neighborhood filters",
    });
    expect(within(filters).getByRole("button", { name: "All" })).toBeTruthy();
    expect(
      within(filters).getByRole("button", { name: "Hongdae" })
    ).toBeTruthy();
    expect(
      within(filters).getByRole("button", { name: "Seongsu" })
    ).toBeTruthy();
    // Hongdae appears twice in data but only one chip
    expect(
      within(filters).getAllByRole("button", { name: "Hongdae" }).length
    ).toBe(1);
  });

  it("filters the grid to the selected neighborhood and resets on All", () => {
    render(<PlacesDirectory places={places} />);
    fireEvent.click(screen.getByRole("button", { name: "Seongsu" }));
    expect(screen.getByRole("link", { name: /Bravo Spa/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Alpha Salon/ })).toBe(null);
    expect(screen.queryByRole("link", { name: /Charlie Store/ })).toBe(null);

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByRole("link", { name: /Alpha Salon/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Charlie Store/ })).toBeTruthy();
  });
});
