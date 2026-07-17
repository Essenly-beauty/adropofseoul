import { z } from "zod";
import { PLACE_CATEGORY_VALUES } from "@/lib/admin/enums";

// Output contracts for generateObject. Source-or-invalid is enforced at the
// schema level: a candidate without at least one source URL never parses
// (spec §3 "Sources over sizzle").

export const CandidateSchema = z.object({
  name: z.string().min(1),
  area: z.string().min(1),
  categoryGuess: z
    .enum(PLACE_CATEGORY_VALUES as [string, ...string[]])
    .nullable(),
  whyNotable: z.string().min(1),
  sourceUrls: z.array(z.url()).min(1),
  evidenceQuote: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const CandidateListSchema = z.object({
  candidates: z.array(CandidateSchema),
});

export const RunConfigSchema = z.object({
  area: z.string().min(1),
  sources: z.array(z.enum(["reddit", "web"])).default(["reddit", "web"]),
  limit: z.number().int().min(1).max(25).default(10),
});

export type Candidate = z.infer<typeof CandidateSchema>;
export type CandidateList = z.infer<typeof CandidateListSchema>;
export type RunConfig = z.infer<typeof RunConfigSchema>;
