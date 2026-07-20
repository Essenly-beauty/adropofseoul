import { createClient } from "@/lib/supabase/server";
import { mapPlaceRow } from "@/services/places";
import type { Place } from "@/services/types";
import type { PlaceWriteInput } from "@/lib/admin/places";

export type AdminPlace = Place & { isPublished: boolean };

const COLUMNS =
  "id,name,slug,category,area,name_kr,entry_type,rating,review_count,website_url,address,service_detail,short_description,long_description,why_we_like_it,best_for,price_range,instagram_url,naver_map_url,google_map_url,booking_url,languages,images,is_published";

type RowWithPublished = Parameters<typeof mapPlaceRow>[0] & {
  is_published: boolean;
};

function mapAdmin(row: RowWithPublished): AdminPlace {
  return { ...mapPlaceRow(row), isPublished: row.is_published };
}

export function toRow(input: PlaceWriteInput, opts: { includeSlug: boolean }) {
  const row: Record<string, unknown> = {
    name: input.name,
    name_kr: input.nameKr,
    category: input.category,
    entry_type: input.entryType,
    area: input.area,
    address: input.address,
    service_detail: input.serviceDetail,
    short_description: input.shortDescription,
    long_description: input.longDescription,
    why_we_like_it: input.whyWeLikeIt,
    best_for: input.bestFor,
    price_range: input.priceRange,
    rating: input.rating,
    review_count: input.reviewCount,
    website_url: input.websiteUrl,
    instagram_url: input.instagramUrl,
    naver_map_url: input.naverMapUrl,
    google_map_url: input.googleMapUrl,
    booking_url: input.bookingUrl,
    languages: input.languages,
    images: input.images,
    is_published: input.isPublished,
  };
  if (opts.includeSlug) row.slug = input.slug;
  return row;
}

export async function listAllPlaces(): Promise<AdminPlace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as RowWithPublished[] | null)?.map(mapAdmin) ?? [];
}

export async function getAdminPlaceById(
  id: string
): Promise<AdminPlace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdmin(data as RowWithPublished) : null;
}

export async function createPlace(
  input: PlaceWriteInput
): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .insert(toRow(input, { includeSlug: true }))
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

export async function updatePlace(
  id: string,
  input: PlaceWriteInput
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("places")
    .update(toRow(input, { includeSlug: false }))
    .eq("id", id);
  if (error) throw error;
}

export async function deletePlace(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("places").delete().eq("id", id);
  if (error) throw error;
}
