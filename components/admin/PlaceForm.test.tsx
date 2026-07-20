import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceForm } from "./PlaceForm";
import type { AdminPlace } from "@/services/admin/places";

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    useFormState: (_action: unknown, initial: unknown) => [initial, vi.fn()],
  };
});

vi.mock("@/app/admin/places/actions", () => ({
  createPlaceAction: vi.fn(),
  updatePlaceAction: vi.fn(),
  deletePlaceAction: vi.fn(),
}));

const place: AdminPlace = {
  id: "1",
  name: "Test Salon",
  slug: "test-salon",
  category: "salon",
  area: "Hongdae",
  nameKr: "테스트",
  entryType: "place",
  rating: 4.5,
  reviewCount: 10,
  websiteUrl: null,
  address: null,
  serviceDetail: null,
  shortDescription: null,
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
  isPublished: true,
};

describe("PlaceForm", () => {
  it("renders core fields prefilled in edit mode with read-only slug", () => {
    render(<PlaceForm mode="edit" place={place} />);
    expect(
      (screen.getByLabelText(/Name \(English\)/i) as HTMLInputElement).value
    ).toBe("Test Salon");
    const slug = screen.getByLabelText(/Slug/i) as HTMLInputElement;
    expect(slug.value).toBe("test-salon");
    expect(slug.readOnly).toBe(true);
    // delete button shows only in edit mode
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
  });

  it("shows an editable slug and no delete button in create mode", () => {
    render(<PlaceForm mode="create" />);
    const slug = screen.getByLabelText(/Slug/i) as HTMLInputElement;
    expect(slug.readOnly).toBe(false);
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });
});
