import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceCard } from "./PlaceCard";
import type { Place } from "@/services/types";

const place = {
  id: "1",
  name: "Sool Loft Head Spa",
  slug: "sool-loft-head-spa",
  category: "head_spa",
  area: "Seongsu",
  nameKr: "술로프트",
  entryType: "place",
  rating: null,
  reviewCount: null,
  websiteUrl: null,
  address: null,
  serviceDetail: null,
  shortDescription: "A minimalist scalp-care studio.",
  longDescription: null,
  whyWeLikeIt: null,
  bestFor: null,
  priceRange: null,
  instagramUrl: null,
  naverMapUrl: null,
  googleMapUrl: null,
  bookingUrl: null,
  languages: [],
  images: [],
} as Place;

describe("PlaceCard", () => {
  it("links to the place and shows name, area, description", () => {
    render(<PlaceCard place={place} />);
    const link = screen.getByRole("link", { name: /Sool Loft Head Spa/ });
    expect(link.getAttribute("href")).toBe("/seoul/places/sool-loft-head-spa");
    expect(screen.getAllByText("Seongsu").length).toBeGreaterThan(0);
    expect(screen.getByText(/minimalist scalp-care studio/)).toBeTruthy();
  });

  it("shows star rating with review count when present", () => {
    render(<PlaceCard place={{ ...place, rating: 4.9, reviewCount: 487 }} />);
    expect(screen.getByText("4.9")).toBeTruthy();
    expect(screen.getByText(/\(487\)/)).toBeTruthy();
    expect(screen.getByText(/★/)).toBeTruthy();
  });

  it("keeps the Korean name out of the heading", () => {
    render(<PlaceCard place={{ ...place, nameKr: "술로프트" }} />);

    expect(
      screen.getByRole("heading", { name: "Sool Loft Head Spa" })
    ).not.toBeNull();
    expect(screen.getByText("술로프트")).not.toBeNull();
  });

  // globals.css sets `h1,h2,h3 { @apply font-serif }` in the base layer, so the
  // sans face has to be asked for explicitly or it silently reverts.
  it("sets the place name in the sans face", () => {
    render(<PlaceCard place={place} />);

    const heading = screen.getByRole("heading", { name: "Sool Loft Head Spa" });
    expect(heading.className).toContain("font-sans");
  });

  it("sets the place name in ink rather than the full-strength text color", () => {
    render(<PlaceCard place={place} />);

    const heading = screen.getByRole("heading", { name: "Sool Loft Head Spa" });
    expect(heading.className).toContain("text-text-ink");
  });

  it("keeps a Korean name from breaking mid-word", () => {
    render(<PlaceCard place={{ ...place, nameKr: "오오네일 성수" }} />);

    expect(screen.getByText("오오네일 성수").className).toContain("break-keep");
  });

  it("puts the area in the meta line beside the service", () => {
    render(<PlaceCard place={place} />);

    const meta = screen.getByText("Seongsu").closest("p");
    expect(meta).not.toBeNull();
    expect(meta?.textContent).toContain("Head Spa");
  });

  it("labels experiences and shows the service detail", () => {
    render(
      <PlaceCard
        place={{
          ...place,
          entryType: "experience",
          serviceDetail: "Perfume-making class",
        }}
      />
    );
    expect(screen.getByText(/Experience/)).toBeTruthy();
    expect(screen.getByText(/Perfume-making class/)).toBeTruthy();
  });
});
