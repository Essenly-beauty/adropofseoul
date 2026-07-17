import { z } from "zod";
import { PLACE_CATEGORY_VALUES } from "@/lib/admin/enums";

// Output contracts for generateObject. Source-or-invalid is enforced at the
// schema level: a candidate without at least one source URL never parses
// (spec §3 "Sources over sizzle").

// z.url() accepts javascript:/data: schemes — these URLs are rendered as
// hrefs/srcs in the admin, so enforce http(s) at the schema boundary.
const HttpUrl = z
  .url()
  .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
    message: "http(s) URLs only",
  });

export const CandidateSchema = z.object({
  name: z.string().min(1),
  area: z.string().min(1),
  categoryGuess: z
    .enum(PLACE_CATEGORY_VALUES as [string, ...string[]])
    .nullable(),
  whyNotable: z.string().min(1),
  sourceUrls: z.array(HttpUrl).min(1),
  evidenceQuote: z.string().min(1),
  confidence: z.number().min(0).max(1),
  // Direct image URLs that appear in the source material for THIS place —
  // reality shots. The model may only echo URLs present in the material
  // (additionally enforced in the pipeline against the gathered text).
  imageUrls: z.array(HttpUrl).max(4).default([]),
  // Booking-service hints — ONLY when present verbatim in the material.
  nameKr: z.string().nullable().default(null),
  addressHint: z.string().nullable().default(null),
});

export const CandidateListSchema = z.object({
  candidates: z.array(CandidateSchema),
});

export const RunConfigSchema = z.object({
  area: z.string().min(1),
  sources: z.array(z.enum(["reddit", "web"])).default(["reddit", "web"]),
  limit: z.number().int().min(1).max(25).default(10),
  // Also collect image candidates (reality shots from sources + stock pool).
  images: z.boolean().default(true),
});

export type Candidate = z.infer<typeof CandidateSchema>;
export type CandidateList = z.infer<typeof CandidateListSchema>;
export type RunConfig = z.infer<typeof RunConfigSchema>;

// Writer output contract (Track 3). Body carries [[ NOTE: … ]] slots for
// first-hand detail — the model must never fabricate experience.
export const GuideDraftSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case slug"),
  subtitle: z.string().min(1),
  excerpt: z.string().min(1),
  bodyMarkdown: z.string().min(200),
  tags: z.array(z.string()).max(8).default([]),
  seoTitle: z.string().min(1),
  metaDescription: z.string().min(50).max(200),
});

export type GuideDraft = z.infer<typeof GuideDraftSchema>;

/** A gathered image before persistence (services add run/candidate links). */
export type ImageSeed = {
  url: string;
  sourceUrl: string;
  sourceType: "reddit" | "web" | "unsplash" | "pexels";
  description: string | null;
  suggestedUse: "thumbnail" | "inline";
  license: "commercial-ok" | "attribution-required" | "unverified";
  attribution: string | null;
};
