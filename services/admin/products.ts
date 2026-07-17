import { createClient } from "@/lib/supabase/server";
import type { AdminProduct, ProductInput, WriteResult, Counts } from "./types";

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
  is_published: boolean;
  updated_at: string;
};

const COLUMNS =
  "id,name,brand,slug,category,description,price,image,affiliate_url,where_to_buy,best_for,ingredients,rating,disclosure_required,is_published,updated_at";

export function mapAdminProductRow(row: ProductRow): AdminProduct {
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
    isPublished: row.is_published,
    updatedAt: row.updated_at,
  };
}

function toRow(input: ProductInput) {
  return {
    name: input.name,
    brand: input.brand,
    slug: input.slug,
    category: input.category,
    description: input.description,
    price: input.price,
    image: input.image,
    affiliate_url: input.affiliateUrl,
    where_to_buy: input.whereToBuy,
    best_for: input.bestFor,
    ingredients: input.ingredients,
    rating: input.rating,
    disclosure_required: input.disclosureRequired,
    is_published: input.isPublished,
  };
}

export async function listAllProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as ProductRow[] | null)?.map(mapAdminProductRow) ?? [];
}

export async function getProductById(id: string): Promise<AdminProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdminProductRow(data as ProductRow) : null;
}

export async function createProduct(input: ProductInput): Promise<WriteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(toRow(input))
    .eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function removeProduct(id: string): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function productCounts(): Promise<Counts> {
  const supabase = await createClient();
  const total = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });
  const live = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);
  const t = total.count ?? 0;
  const l = live.count ?? 0;
  return { total: t, live: l, hidden: t - l };
}
