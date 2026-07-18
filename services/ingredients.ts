import { cache } from "@/lib/react-cache";
import { createClient } from "@/lib/supabase/server";
import { mapProductRow } from "./products";
import type { Ingredient, Product } from "./types";

type IngredientRow = {
  id: string;
  slug: string;
  name: string;
  inci_name: string | null;
  also_known_as: string[];
  functions: string[];
  summary: string | null;
  description: string | null;
  benefits: string | null;
  good_for_skin_types: string[];
  targets_concerns: string[];
  caution: string | null;
  seo_title: string | null;
  meta_description: string | null;
};

const COLUMNS =
  "id,slug,name,inci_name,also_known_as,functions,summary,description,benefits,good_for_skin_types,targets_concerns,caution,seo_title,meta_description";

export function mapIngredientRow(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    inciName: row.inci_name,
    alsoKnownAs: row.also_known_as ?? [],
    functions: row.functions ?? [],
    summary: row.summary,
    description: row.description,
    benefits: row.benefits,
    goodForSkinTypes: row.good_for_skin_types ?? [],
    targetsConcerns: row.targets_concerns ?? [],
    caution: row.caution,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
  };
}

export async function listIngredients(
  opts: { limit?: number; skinType?: string; func?: string } = {}
): Promise<Ingredient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ingredients")
    .select(COLUMNS)
    .eq("status", "published")
    .order("name", { ascending: true })
    .limit(opts.limit ?? 200);
  if (opts.skinType)
    query = query.contains("good_for_skin_types", [opts.skinType]);
  if (opts.func) query = query.contains("functions", [opts.func]);
  const { data, error } = await query;
  if (error) throw error;
  return (data as IngredientRow[] | null)?.map(mapIngredientRow) ?? [];
}

export const getIngredientBySlug = cache(
  async (slug: string): Promise<Ingredient | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select(COLUMNS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return data ? mapIngredientRow(data as IngredientRow) : null;
  }
);

const PRODUCT_COLUMNS =
  "id,name,brand,slug,category,description,price,image,affiliate_url,where_to_buy,best_for,ingredients,rating,disclosure_required";

export async function listProductsForIngredient(
  ingredientId: string
): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_ingredients")
    .select(`product:products(${PRODUCT_COLUMNS})`)
    .eq("ingredient_id", ingredientId)
    // Explicit publish filter on the embed (don't rely on RLS alone — an
    // authenticated admin session would otherwise see draft products here).
    // Non-matching embeds come back null and are dropped below.
    .eq("product.is_published", true)
    // Key ingredients first, then curated position (matches the junction
    // table's is_key/position columns).
    .order("is_key", { ascending: false })
    .order("position", { ascending: true, nullsFirst: false })
    .limit(24);
  if (error) throw error;
  const rows = (data as { product: unknown }[] | null) ?? [];
  return rows
    .map((r) => r.product)
    .filter(Boolean)
    .map((p) => mapProductRow(p as never));
}
