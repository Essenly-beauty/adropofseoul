import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceCard } from "./PlaceCard";
import type { Place } from "@/services/types";

const place = {
  id: "1",
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
  shortDescription: "A minimalist scalp studio.",
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
  it("links to the place and shows name + area", () => {
    render(<PlaceCard place={place} />);
    const link = screen.getByRole("link", { name: /Sool Loft/ });
    expect(link.getAttribute("href")).toBe("/places/sool-loft");
    expect(screen.getByText("Seongsu")).toBeTruthy();
  });
});
