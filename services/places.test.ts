import { describe, it, expect, vi } from "vitest";
import { mapPlaceRow, getPlaceBySlug } from "./places";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1",
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
  name_kr: "술로프트",
  entry_type: "place",
  rating: "4.9",
  review_count: 12,
  website_url: null,
  address: "서울 성동구",
  short_description: "x",
  long_description: null,
  why_we_like_it: null,
  best_for: null,
  price_range: null,
  instagram_url: null,
  naver_map_url: null,
  google_map_url: null,
  booking_url: null,
  languages: ["en"],
  images: ["a.jpg"],
};

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";

describe("mapPlaceRow", () => {
  it("maps row and coerces images to array", () => {
    const p = mapPlaceRow(row as never);
    expect(p.shortDescription).toBe("x");
    expect(p.images).toEqual(["a.jpg"]);
  });

  it("coerces numeric rating strings and maps directory fields", () => {
    const p = mapPlaceRow(row as never);
    expect(p.rating).toBe(4.9);
    expect(p.reviewCount).toBe(12);
    expect(p.nameKr).toBe("술로프트");
    expect(p.entryType).toBe("place");
    expect(p.address).toBe("서울 성동구");
  });

  it("defaults entry_type to place and keeps null rating", () => {
    const p = mapPlaceRow({ ...row, entry_type: null, rating: null } as never);
    expect(p.entryType).toBe("place");
    expect(p.rating).toBeNull();
  });
});

describe("getPlaceBySlug", () => {
  it("returns null when not found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: null, error: null })
    );
    expect(await getPlaceBySlug("nope")).toBeNull();
  });
});
