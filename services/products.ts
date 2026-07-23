import { cache } from "@/lib/react-cache";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductOffer } from "./types";

type ProductRow = {
  id: string;
  name: string;
  brand: string | null;
  slug: string;
  category: string | null;
  description: string | null;
  price: string | null;
  image: string | null;
  affiliate_url: string | null;
  where_to_buy: string | null;
  best_for: string | null;
  ingredients: string | null;
  rating: number | null;
  disclosure_required: boolean;
  tags: string[] | null;
  award_badge: string | null;
  product_offers:
    | { retailer: string; url: string; is_active: boolean; sort: number }[]
    | null;
};

const COLUMNS =
  "id,name,brand,slug,category,description,price,image,affiliate_url,where_to_buy,best_for,ingredients,rating,disclosure_required,tags,award_badge,product_offers(retailer,url,is_active,sort)";

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    slug: row.slug,
    category: row.category,
    description: row.description,
    price: row.price,
    image: row.image,
    affiliateUrl: row.affiliate_url,
    whereToBuy: row.where_to_buy,
    bestFor: row.best_for,
    ingredients: row.ingredients,
    rating: row.rating,
    disclosureRequired: row.disclosure_required,
    offers: (row.product_offers ?? [])
      .filter((o) => o.is_active)
      .sort((a, b) => a.sort - b.sort)
      .map((o) => ({ retailer: o.retailer, url: o.url }) as ProductOffer),
    tags: row.tags ?? [],
    awardBadge: row.award_badge ?? null,
  };
}

export async function listProducts(
  opts: { limit?: number } = {}
): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("is_published", true)
    .order("name", { ascending: true })
    .limit(opts.limit ?? 50);
  if (error) throw error;
  return (data as ProductRow[] | null)?.map(mapProductRow) ?? [];
}

export const getProductBySlug = cache(
  async (slug: string): Promise<Product | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProductRow(data as ProductRow) : null;
  }
);
