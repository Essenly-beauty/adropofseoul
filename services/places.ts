import { cache } from "@/lib/react-cache";
import { createClient } from "@/lib/supabase/server";
import type { Place } from "./types";

type PlaceRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  area: string | null;
  name_kr: string | null;
  entry_type: "place" | "experience";
  rating: number | string | null;
  review_count: number | null;
  website_url: string | null;
  address: string | null;
  service_detail: string | null;
  short_description: string | null;
  long_description: string | null;
  why_we_like_it: string | null;
  best_for: string | null;
  price_range: string | null;
  instagram_url: string | null;
  naver_map_url: string | null;
  google_map_url: string | null;
  booking_url: string | null;
  languages: string[];
  images: string[];
};

const COLUMNS =
  "id,name,slug,category,area,name_kr,entry_type,rating,review_count,website_url,address,service_detail,short_description,long_description,why_we_like_it,best_for,price_range,instagram_url,naver_map_url,google_map_url,booking_url,languages,images";

export function mapPlaceRow(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    area: row.area,
    nameKr: row.name_kr,
    entryType: row.entry_type ?? "place",
    // numeric columns come back from PostgREST as strings
    rating: row.rating == null ? null : Number(row.rating),
    reviewCount: row.review_count,
    websiteUrl: row.website_url,
    address: row.address,
    serviceDetail: row.service_detail,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    whyWeLikeIt: row.why_we_like_it,
    bestFor: row.best_for,
    priceRange: row.price_range,
    instagramUrl: row.instagram_url,
    naverMapUrl: row.naver_map_url,
    googleMapUrl: row.google_map_url,
    bookingUrl: row.booking_url,
    languages: row.languages ?? [],
    images: Array.isArray(row.images) ? row.images : [],
  };
}

export async function listPlaces(
  opts: {
    limit?: number;
    category?: string;
    area?: string;
    areas?: string[];
  } = {}
): Promise<Place[]> {
  const supabase = await createClient();
  let query = supabase
    .from("places")
    .select(COLUMNS)
    .eq("is_published", true)
    .order("name", { ascending: true })
    .limit(opts.limit ?? 50);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.area) query = query.eq("area", opts.area);
  if (opts.areas?.length) query = query.in("area", opts.areas);
  const { data, error } = await query;
  if (error) throw error;
  return (data as PlaceRow[] | null)?.map(mapPlaceRow) ?? [];
}

export const getPlaceBySlug = cache(
  async (slug: string): Promise<Place | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("places")
      .select(COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return data ? mapPlaceRow(data as PlaceRow) : null;
  }
);
