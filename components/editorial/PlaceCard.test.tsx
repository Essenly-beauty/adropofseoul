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
    expect(link.getAttribute("href")).toBe("/places/sool-loft-head-spa");
    expect(screen.getAllByText("Seongsu").length).toBeGreaterThan(0);
    expect(screen.getByText(/minimalist scalp-care studio/)).toBeTruthy();
  });

  it("shows rating with review count when present", () => {
    render(<PlaceCard place={{ ...place, rating: 4.9, reviewCount: 487 }} />);
    expect(screen.getByText("★ 4.9 (487)")).toBeTruthy();
  });

  it("labels experiences", () => {
    render(<PlaceCard place={{ ...place, entryType: "experience" }} />);
    expect(screen.getByText("Experience")).toBeTruthy();
  });
});
