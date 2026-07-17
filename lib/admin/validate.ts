import { isValidEmail } from "@/lib/validation";
import {
  POST_CATEGORY_VALUES,
  PLACE_CATEGORY_VALUES,
  BOOKING_CHANNEL_VALUES,
  EDITORIAL_STATUS_VALUES,
} from "./enums";
import { POST_STATUSES } from "./workflow";
import type {
  PostInput,
  PlaceInput,
  ProductInput,
} from "@/services/admin/types";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUS_VALUES = POST_STATUSES.map((s) => s.value);

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function required(map: Record<string, string>, field: string, value: string) {
  if (!value || !value.trim()) map[field] = "Required.";
}

function slugField(map: Record<string, string>, value: string) {
  if (!value || !value.trim()) {
    map.slug = "Required.";
  } else if (!SLUG_RE.test(value)) {
    map.slug = "Lowercase letters, numbers, and hyphens only.";
  }
}

function urlIfPresent(
  map: Record<string, string>,
  field: string,
  value: string | null
) {
  if (value && !isHttpUrl(value)) map[field] = "Must be a valid http(s) URL.";
}

export function validatePost(i: PostInput): Record<string, string> {
  const e: Record<string, string> = {};
  required(e, "title", i.title);
  slugField(e, i.slug);
  if (!POST_CATEGORY_VALUES.includes(i.category))
    e.category = "Choose a category.";
  if (!STATUS_VALUES.includes(i.status)) e.status = "Choose a status.";
  urlIfPresent(e, "featuredImage", i.featuredImage);
  return e;
}

export function validatePlace(i: PlaceInput): Record<string, string> {
  const e: Record<string, string> = {};
  required(e, "name", i.name);
  slugField(e, i.slug);
  if (!PLACE_CATEGORY_VALUES.includes(i.category))
    e.category = "Choose a category.";
  urlIfPresent(e, "instagramUrl", i.instagramUrl);
  urlIfPresent(e, "naverMapUrl", i.naverMapUrl);
  urlIfPresent(e, "googleMapUrl", i.googleMapUrl);
  urlIfPresent(e, "bookingUrl", i.bookingUrl);
  if (i.contactEmail && !isValidEmail(i.contactEmail))
    e.contactEmail = "Invalid email.";
  if (i.geoLat !== null && (Number.isNaN(i.geoLat) || Math.abs(i.geoLat) > 90))
    e.geoLat = "Latitude must be between -90 and 90.";
  if (i.geoLng !== null && (Number.isNaN(i.geoLng) || Math.abs(i.geoLng) > 180))
    e.geoLng = "Longitude must be between -180 and 180.";
  if (
    i.priceMinKrw !== null &&
    (Number.isNaN(i.priceMinKrw) || i.priceMinKrw < 0)
  )
    e.priceMinKrw = "Must be a non-negative amount.";
  if (
    i.priceMaxKrw !== null &&
    (Number.isNaN(i.priceMaxKrw) || i.priceMaxKrw < 0)
  )
    e.priceMaxKrw = "Must be a non-negative amount.";
  if (
    i.priceMinKrw !== null &&
    i.priceMaxKrw !== null &&
    i.priceMinKrw > i.priceMaxKrw
  )
    e.priceMaxKrw = "Max must be ≥ min.";
  if (i.bookingChannel && !BOOKING_CHANNEL_VALUES.includes(i.bookingChannel))
    e.bookingChannel = "Choose a booking channel.";
  if (!EDITORIAL_STATUS_VALUES.includes(i.editorialStatus))
    e.editorialStatus = "Choose a status.";
  return e;
}

export function validateProduct(i: ProductInput): Record<string, string> {
  const e: Record<string, string> = {};
  required(e, "name", i.name);
  slugField(e, i.slug);
  urlIfPresent(e, "image", i.image);
  urlIfPresent(e, "affiliateUrl", i.affiliateUrl);
  if (
    i.rating !== null &&
    (Number.isNaN(i.rating) || i.rating < 0 || i.rating > 5)
  )
    e.rating = "Must be 0–5.";
  return e;
}
