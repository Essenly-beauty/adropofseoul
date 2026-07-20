import { slugify } from "@/lib/slug";

export type ProductWriteInput = {
  name: string;
  brand: string | null;
  slug: string;
  category: string | null;
  description: string | null;
  price: string | null;
  image: string | null;
  affiliateUrl: string | null;
  whereToBuy: string | null;
  bestFor: string | null;
  ingredients: string | null;
  rating: number | null;
  disclosureRequired: boolean;
  isPublished: boolean;
};

export type ParseResult =
  | { ok: true; value: ProductWriteInput }
  | { ok: false; errors: Record<string, string> };

const URL_FIELDS = ["image", "affiliateUrl"] as const;

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function nullable(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

export function parseProductForm(
  fd: FormData,
  opts: { mode: "create" | "edit" }
): ParseResult {
  const errors: Record<string, string> = {};

  const name = str(fd, "name");
  if (!name) errors.name = "Name is required.";

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
      brand: nullable(fd, "brand"),
      slug,
      category: nullable(fd, "category"),
      description: nullable(fd, "description"),
      price: nullable(fd, "price"),
      image: urls.image,
      affiliateUrl: urls.affiliateUrl,
      whereToBuy: nullable(fd, "whereToBuy"),
      bestFor: nullable(fd, "bestFor"),
      ingredients: nullable(fd, "ingredients"),
      rating,
      disclosureRequired: str(fd, "disclosureRequired") === "on",
      isPublished: str(fd, "isPublished") === "on",
    },
  };
}
