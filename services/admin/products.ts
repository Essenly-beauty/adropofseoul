import { createClient } from "@/lib/supabase/server";
import { mapProductRow } from "@/services/products";
import type { Product } from "@/services/types";
import type { ProductWriteInput } from "@/lib/admin/products";

export type AdminProduct = Product & {
  isPublished: boolean;
  updatedAt: string;
};

const COLUMNS =
  "id,name,brand,slug,category,description,price,image,affiliate_url,where_to_buy,best_for,ingredients,rating,disclosure_required,is_published,updated_at";

type RowWithPublished = Parameters<typeof mapProductRow>[0] & {
  is_published: boolean;
  updated_at: string;
};

function mapAdmin(row: RowWithPublished): AdminProduct {
  return {
    ...mapProductRow(row),
    isPublished: row.is_published,
    updatedAt: row.updated_at,
  };
}

export function toRow(
  input: ProductWriteInput,
  opts: { includeSlug: boolean }
) {
  const row: Record<string, unknown> = {
    name: input.name,
    brand: input.brand,
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
  if (opts.includeSlug) row.slug = input.slug;
  return row;
}

export async function listAllProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as RowWithPublished[] | null)?.map(mapAdmin) ?? [];
}

export async function getAdminProductById(
  id: string
): Promise<AdminProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdmin(data as RowWithPublished) : null;
}

export async function createProduct(
  input: ProductWriteInput
): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(toRow(input, { includeSlug: true }))
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

export async function updateProduct(
  id: string,
  input: ProductWriteInput
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(toRow(input, { includeSlug: false }))
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
