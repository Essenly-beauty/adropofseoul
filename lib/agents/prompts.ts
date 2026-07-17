// Versioned prompt builders. The version string is persisted on every
// research_runs row so any candidate/draft is traceable to the prompt that
// produced it (spec §5.1). Bump the version whenever the prompt changes.

export const RESEARCH_PROMPT_VERSION = "research-v1";
export const WRITER_PROMPT_VERSION = "writer-v1";

export type WriterPlace = {
  name: string;
  nameKr: string | null;
  category: string;
  area: string | null;
  address: string | null;
  slug: string;
  whyWeLikeIt: string | null;
  bestFor: string | null;
  priceRange: string | null;
  priceMinKrw: number | null;
  priceMaxKrw: number | null;
  bookingChannel: string | null;
  languages: string[];
  notes: string | null;
};

export type WriterRelatedPost = { title: string; slug: string };

/**
 * Guide-draft prompt following the article template (content-strategy
 * service-DB spec §4) and the anti-AI-tells checklist. The hard rule: the
 * model NEVER fabricates first-hand experience — every visit detail, price
 * paid, reaction, or opinion slot becomes [[ NOTE: … ]] for the editor.
 */
export function buildGuideWritePrompt({
  area,
  places,
  relatedPosts,
}: {
  area: string;
  places: WriterPlace[];
  relatedPosts: WriterRelatedPost[];
}): string {
  const placeBlocks = places
    .map((p) =>
      [
        `- ${p.name}${p.nameKr ? ` (${p.nameKr})` : ""} — /places/${p.slug}`,
        `  category: ${p.category} · area: ${p.area ?? area}`,
        `  address: ${p.address ?? "unknown"}`,
        `  price: ${p.priceRange ?? "unknown"}${
          p.priceMinKrw ? ` (₩${p.priceMinKrw}–₩${p.priceMaxKrw ?? "?"})` : ""
        }`,
        `  booking: ${p.bookingChannel ?? "unknown"} · languages: ${
          p.languages.join(", ") || "unknown"
        }`,
        `  editorial notes: ${p.whyWeLikeIt ?? p.notes ?? "none"}`,
        `  best for: ${p.bestFor ?? "unknown"}`,
      ].join("\n")
    )
    .join("\n");
  const links = relatedPosts
    .map((p) => `- "${p.title}" → /articles/${p.slug}`)
    .join("\n");

  return [
    `You are drafting a neighborhood guide for A Drop of Seoul, an editorial`,
    `K-beauty publication (voice: Into The Gloss × Monocle — first-person`,
    `editorial "we", specific, warm-but-precise, opinionated).`,
    ``,
    `Write a guide for the ${area} area of Seoul covering ONLY these places:`,
    ``,
    placeBlocks,
    ``,
    `Published articles available for internal links (link at least 2):`,
    links || "- (none available — skip Read Next links)",
    ``,
    `Structure (follow exactly):`,
    `1. Opening: one concrete scene/claim (NO throat-clearing like "In`,
    `   today's fast-paced world"), then a [[ NOTE: editor 1-2 sentence`,
    `   first-person observation ]] slot.`,
    `2. **Quick answer** (2-3 sentences), **Who this guide is for** (bullet`,
    `   list), **Quick recommendations** (top picks with one-line reasons).`,
    `3. Comparison table: place / style / price / English OK / best for.`,
    `   Use ONLY the data above; unknown cells get "[[ NOTE: verify ]]".`,
    `4. One section per place: what it is, why it made the list (from the`,
    `   editorial notes), and a "[[ NOTE: visit date / booking method / amount`,
    `   paid / wait time / what we didn't love / verdict ]]" experience slot.`,
    `5. Booking practical tips (language barrier, deposits, tools).`,
    `6. Safety/care cautions (3-5, factual only).`,
    `7. FAQ (5-6 questions a first-time visitor actually asks).`,
    `8. Read Next: the internal links above.`,
    `9. Closing disclosure line: "Places in this guide were independently`,
    `   selected by our editorial team. Any partnership or sponsorship is`,
    `   disclosed where it exists."`,
    ``,
    `Hard rules:`,
    `- NEVER invent first-hand experience, visit details, prices paid, or`,
    `  opinions about service quality — those are [[ NOTE: … ]] slots.`,
    `- NEVER invent facts (hours, addresses, prices) not in the data above.`,
    `- At least one honest negative or "who should skip this" per guide.`,
    `- Mixed sentence lengths; no filler transitions; no uniform paragraphs.`,
    `- Link each place name to its /places/<slug> page in the body.`,
    `- metaDescription: 150-160 characters, plain and specific.`,
    `- slug: kebab-case, keyword-first (e.g. "${area.toLowerCase()}-seoul-beauty-guide").`,
  ].join("\n");
}

export function buildResearchExtractPrompt({
  area,
  gathered,
  limit = 10,
}: {
  area: string;
  gathered: string;
  limit?: number;
}): string {
  return [
    `You are a research assistant for A Drop of Seoul, an English-language`,
    `editorial site about Seoul beauty, wellness, and lifestyle places.`,
    ``,
    `From the source material below, extract up to ${limit} candidate places`,
    `in the "${area}" area of Seoul that are notable, currently operating,`,
    `and relevant to our readers (head spas, salons, cafes, clinics, shops,`,
    `wellness).`,
    ``,
    `Hard rules:`,
    `- NEVER invent a place. Every candidate must appear in the source`,
    `  material with at least one source URL.`,
    `- evidenceQuote must be a verbatim quote from the sources — do not`,
    `  paraphrase or fabricate quotes.`,
    `- Confidence rubric: 0.9+ multiple independent sources with specifics;`,
    `  0.6-0.8 one solid source with detail; 0.3-0.5 passing mention;`,
    `  below 0.3 do not include.`,
    `- Skip places that appear permanently closed in the sources.`,
    `- imageUrls: include a direct image URL ONLY if it appears verbatim in`,
    `  the source material AND clearly shows this place. Never invent or`,
    `  guess image URLs. Empty array is the correct answer when unsure.`,
    `- nameKr / addressHint: fill ONLY when the Korean name or an address`,
    `  appears in the source material. Never guess or transliterate; null is`,
    `  the correct answer when the material doesn't say.`,
    ``,
    `Source material:`,
    ``,
    gathered,
  ].join("\n");
}
