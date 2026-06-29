import { describe, it, expect, vi } from "vitest";
import { mapPlaceRow, getPlaceBySlug } from "./places";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1",
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
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
});

describe("getPlaceBySlug", () => {
  it("returns null when not found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: null, error: null })
    );
    expect(await getPlaceBySlug("nope")).toBeNull();
  });
});
