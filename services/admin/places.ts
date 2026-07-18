import { createClient } from "@/lib/supabase/server";
import type { AdminPlace, PlaceInput, WriteResult, Counts } from "./types";

type PlaceRow = {
  id: string;
  name: string;
  name_kr: string | null;
  slug: string;
  category: string;
  area: string | null;
  address: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  price_min_krw: number | null;
  price_max_krw: number | null;
  booking_channel: string | null;
  deposit_policy: string | null;
  editorial_status: string;
  last_verified_at: string | null;
  short_description: string | null;
  long_description: string | null;
  why_we_like_it: string | null;
  best_for: string | null;
  price_range: string | null;
  instagram_url: string | null;
  naver_map_url: string | null;
  google_map_url: string | null;
  booking_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  languages: string[] | null;
  is_published: boolean;
  notes: string | null;
  updated_at: string;
};

const COLUMNS =
  "id,name,name_kr,slug,category,area,address,geo_lat,geo_lng,price_min_krw,price_max_krw,booking_channel,deposit_policy,editorial_status,last_verified_at,short_description,long_description,why_we_like_it,best_for,price_range,instagram_url,naver_map_url,google_map_url,booking_url,contact_email,contact_phone,languages,is_published,notes,updated_at";

export function mapAdminPlaceRow(row: PlaceRow): AdminPlace {
  return {
    id: row.id,
    name: row.name,
    nameKr: row.name_kr,
    slug: row.slug,
    category: row.category,
    area: row.area,
    address: row.address,
    geoLat: row.geo_lat,
    geoLng: row.geo_lng,
    priceMinKrw: row.price_min_krw,
    priceMaxKrw: row.price_max_krw,
    bookingChannel: row.booking_channel,
    depositPolicy: row.deposit_policy,
    editorialStatus: row.editorial_status,
    lastVerifiedAt: row.last_verified_at,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    whyWeLikeIt: row.why_we_like_it,
    bestFor: row.best_for,
    priceRange: row.price_range,
    instagramUrl: row.instagram_url,
    naverMapUrl: row.naver_map_url,
    googleMapUrl: row.google_map_url,
    bookingUrl: row.booking_url,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    languages: row.languages ?? [],
    isPublished: row.is_published,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

function toRow(input: PlaceInput) {
  return {
    name: input.name,
    name_kr: input.nameKr,
    slug: input.slug,
    category: input.category,
    area: input.area,
    address: input.address,
    geo_lat: input.geoLat,
    geo_lng: input.geoLng,
    price_min_krw: input.priceMinKrw,
    price_max_krw: input.priceMaxKrw,
    booking_channel: input.bookingChannel,
    deposit_policy: input.depositPolicy,
    editorial_status: input.editorialStatus,
    last_verified_at: input.lastVerifiedAt,
    short_description: input.shortDescription,
    long_description: input.longDescription,
    why_we_like_it: input.whyWeLikeIt,
    best_for: input.bestFor,
    price_range: input.priceRange,
    instagram_url: input.instagramUrl,
    naver_map_url: input.naverMapUrl,
    google_map_url: input.googleMapUrl,
    booking_url: input.bookingUrl,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    languages: input.languages,
    is_published: input.isPublished,
    notes: input.notes,
  };
}

export async function listAllPlaces(): Promise<AdminPlace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as PlaceRow[] | null)?.map(mapAdminPlaceRow) ?? [];
}

export async function getPlaceBySlug(slug: string): Promise<AdminPlace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdminPlaceRow(data as PlaceRow) : null;
}

export async function getPlaceById(id: string): Promise<AdminPlace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdminPlaceRow(data as PlaceRow) : null;
}

export async function createPlace(input: PlaceInput): Promise<WriteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

export async function updatePlace(
  id: string,
  input: PlaceInput
): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("places")
    .update(toRow(input))
    .eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function removePlace(id: string): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("places").delete().eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function placeCounts(): Promise<Counts> {
  const supabase = await createClient();
  const total = await supabase
    .from("places")
    .select("*", { count: "exact", head: true });
  const live = await supabase
    .from("places")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);
  const t = total.count ?? 0;
  const l = live.count ?? 0;
  return { total: t, live: l, hidden: t - l };
}
