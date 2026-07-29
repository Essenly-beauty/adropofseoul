// Where a quiz attempt was started from. A fixed allowlist so a stray or forged
// `source_context` can never pollute the funnel metric or land arbitrary client
// text in the database (docs/07 §5 "source context allowlist"; mirrors the
// joinWaitlist normalization in app/actions/waitlist.ts). Hazard H14.

export const SOURCE_CONTEXTS = [
  "direct", // fallback / unknown
  "hub", // /beauty-profile hub
  "hair_landing", // /beauty-profile/hair chooser
  "article_cta", // an in-article profile CTA
  "nav", // global nav CTA
] as const;

export type SourceContext = (typeof SOURCE_CONTEXTS)[number];

const ALLOWED = new Set<string>(SOURCE_CONTEXTS);

export const DEFAULT_SOURCE_CONTEXT: SourceContext = "direct";

/**
 * Coerce a client-supplied source to the allowlist. Unknown / null / non-string
 * values normalize to "direct" — we never persist arbitrary client text.
 */
export function normalizeSourceContext(raw: unknown): SourceContext {
  return typeof raw === "string" && ALLOWED.has(raw)
    ? (raw as SourceContext)
    : DEFAULT_SOURCE_CONTEXT;
}
