import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
import { toRow, listAllPlaces, createPlace } from "./places";
import type { PlaceWriteInput } from "@/lib/admin/places";

const input: PlaceWriteInput = {
  name: "Test",
  nameKr: "테스트",
  slug: "test",
  category: "salon",
  entryType: "place",
  area: "Hongdae",
  address: null,
  serviceDetail: null,
  shortDescription: null,
  longDescription: null,
  whyWeLikeIt: null,
  bestFor: null,
  priceRange: null,
  rating: 4.5,
  reviewCount: 10,
  websiteUrl: null,
  instagramUrl: null,
  naverMapUrl: "https://map.naver.com/x",
  googleMapUrl: null,
  bookingUrl: null,
  languages: ["English"],
  images: ["https://a.com/1.jpg"],
  isPublished: true,
};

describe("toRow", () => {
  it("maps camelCase input to snake_case columns incl slug", () => {
    const row = toRow(input, { includeSlug: true });
    expect(row.name_kr).toBe("테스트");
    expect(row.entry_type).toBe("place");
    expect(row.naver_map_url).toBe("https://map.naver.com/x");
    expect(row.is_published).toBe(true);
    expect(row.slug).toBe("test");
  });
  it("omits slug when includeSlug is false (edit)", () => {
    const row = toRow(input, { includeSlug: false });
    expect("slug" in row).toBe(false);
  });
});

describe("listAllPlaces", () => {
  beforeEach(() => vi.clearAllMocks());
  it("queries places ordered by name without the published filter", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          name: "A",
          slug: "a",
          category: "salon",
          area: null,
          name_kr: null,
          entry_type: "place",
          rating: null,
          review_count: null,
          website_url: null,
          address: null,
          service_detail: null,
          short_description: null,
          long_description: null,
          why_we_like_it: null,
          best_for: null,
          price_range: null,
          instagram_url: null,
          naver_map_url: null,
          google_map_url: null,
          booking_url: null,
          languages: [],
          images: [],
          is_published: false,
        },
      ],
      error: null,
    });
    const select = vi.fn(() => ({ order }));
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: () => ({ select }),
    });
    const rows = await listAllPlaces();
    expect(rows).toHaveLength(1);
    expect(rows[0].isPublished).toBe(false);
    expect(rows[0].slug).toBe("a");
  });
});

describe("createPlace", () => {
  beforeEach(() => vi.clearAllMocks());
  it("inserts and returns the new id", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "new" }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: () => ({ insert }),
    });
    const res = await createPlace(input);
    expect(res.id).toBe("new");
    expect(insert).toHaveBeenCalledOnce();
  });
});
