import { slugify } from "@/lib/slug";
import { PLACE_TYPE_LABELS, PLACE_ENTRY_KINDS } from "@/lib/taxonomy";

export type PlaceWriteInput = {
  name: string;
  nameKr: string | null;
  slug: string;
  category: string;
  entryType: "place" | "experience";
  area: string | null;
  address: string | null;
  serviceDetail: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  whyWeLikeIt: string | null;
  bestFor: string | null;
  priceRange: string | null;
  rating: number | null;
  reviewCount: number | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  naverMapUrl: string | null;
  googleMapUrl: string | null;
  bookingUrl: string | null;
  languages: string[];
  images: string[];
  isPublished: boolean;
};

export type ParseResult =
  | { ok: true; value: PlaceWriteInput }
  | { ok: false; errors: Record<string, string> };

const URL_FIELDS = [
  "websiteUrl",
  "instagramUrl",
  "naverMapUrl",
  "googleMapUrl",
  "bookingUrl",
] as const;

const ENTRY_KINDS = PLACE_ENTRY_KINDS.map((k) => k.value);

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function nullable(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

function lines(fd: FormData, key: string): string[] {
  return String(fd.get(key) ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function parsePlaceForm(
  fd: FormData,
  opts: { mode: "create" | "edit" }
): ParseResult {
  const errors: Record<string, string> = {};

  const name = str(fd, "name");
  if (!name) errors.name = "Name is required.";

  const category = str(fd, "category");
  if (!(category in PLACE_TYPE_LABELS)) errors.category = "Pick a category.";

  const entryType = str(fd, "entryType");
  if (!ENTRY_KINDS.includes(entryType as (typeof ENTRY_KINDS)[number])) {
    errors.entryType = "Pick an entry type.";
  }

  // slug: create derives from provided slug or name; edit keeps existing (the
  // update service never writes slug), so a placeholder is fine here.
  const slugSource = str(fd, "slug") || name;
  const slug = slugify(slugSource);
  if (opts.mode === "create" && !slug) {
    errors.slug = "Could not derive a slug from the name.";
  }

  let rating: number | null = null;
  const ratingRaw = str(fd, "rating");
  if (ratingRaw !== "") {
    const n = Number(ratingRaw);
    if (Number.isNaN(n) || n < 0 || n > 5) {
      errors.rating = "Rating must be a number between 0 and 5.";
    } else {
      rating = n;
    }
  }

  let reviewCount: number | null = null;
  const reviewRaw = str(fd, "reviewCount");
  if (reviewRaw !== "") {
    const n = Number(reviewRaw);
    if (!Number.isInteger(n) || n < 0) {
      errors.reviewCount = "Review count must be a non-negative integer.";
    } else {
      reviewCount = n;
    }
  }

  const urls: Record<string, string | null> = {};
  for (const key of URL_FIELDS) {
    const v = nullable(fd, key);
    if (v && !/^https?:\/\//i.test(v)) {
      errors[key] = "Must start with http:// or https://";
    }
    urls[key] = v;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      nameKr: nullable(fd, "nameKr"),
      slug,
      category,
      entryType: entryType as "place" | "experience",
      area: nullable(fd, "area"),
      address: nullable(fd, "address"),
      serviceDetail: nullable(fd, "serviceDetail"),
      shortDescription: nullable(fd, "shortDescription"),
      longDescription: nullable(fd, "longDescription"),
      whyWeLikeIt: nullable(fd, "whyWeLikeIt"),
      bestFor: nullable(fd, "bestFor"),
      priceRange: nullable(fd, "priceRange"),
      rating,
      reviewCount,
      websiteUrl: urls.websiteUrl,
      instagramUrl: urls.instagramUrl,
      naverMapUrl: urls.naverMapUrl,
      googleMapUrl: urls.googleMapUrl,
      bookingUrl: urls.bookingUrl,
      languages: lines(fd, "languages"),
      images: lines(fd, "images"),
      isPublished: str(fd, "isPublished") === "on",
    },
  };
}
