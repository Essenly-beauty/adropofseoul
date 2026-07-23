import { describe, it, expect, vi } from "vitest";
import { mapProductRow, getProductBySlug } from "./products";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1",
  name: "Rice Toner",
  brand: "Beauty of Joseon",
  slug: "boj-rice-toner",
  category: "toner",
  description: "milky",
  price: "$17",
  image: null,
  affiliate_url: null,
  where_to_buy: null,
  best_for: "dull skin",
  ingredients: null,
  rating: 4.5,
  disclosure_required: true,
};

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";

describe("mapProductRow", () => {
  it("maps affiliate + disclosure fields", () => {
    const p = mapProductRow(row as never);
    expect(p.disclosureRequired).toBe(true);
    expect(p.rating).toBe(4.5);
  });

  it("maps offers (active only, sorted), tags, award badge", () => {
    const p = mapProductRow({
      ...row,
      tags: ["Dry", "Hydration"],
      award_badge: "Olive Young Awards 2024 · Essence/Serum",
      product_offers: [
        {
          retailer: "amazon_us",
          url: "https://amzn.example/x",
          is_active: true,
          sort: 2,
        },
        {
          retailer: "oliveyoung_global",
          url: "https://oy.example/g",
          is_active: true,
          sort: 1,
        },
        {
          retailer: "amazon_us",
          url: "https://amzn.example/dead",
          is_active: false,
          sort: 0,
        },
      ],
    } as never);
    expect(p.offers).toEqual([
      { retailer: "oliveyoung_global", url: "https://oy.example/g" },
      { retailer: "amazon_us", url: "https://amzn.example/x" },
    ]);
    expect(p.tags).toEqual(["Dry", "Hydration"]);
    expect(p.awardBadge).toBe("Olive Young Awards 2024 · Essence/Serum");
  });

  it("defaults offers/tags/awardBadge when columns absent", () => {
    const p = mapProductRow(row as never);
    expect(p.offers).toEqual([]);
    expect(p.tags).toEqual([]);
    expect(p.awardBadge).toBeNull();
  });
});

describe("getProductBySlug", () => {
  it("returns mapped product when found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: row, error: null })
    );
    expect((await getProductBySlug("boj-rice-toner"))?.brand).toBe(
      "Beauty of Joseon"
    );
  });
});
