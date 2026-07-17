// Versioned prompt builders. The version string is persisted on every
// research_runs row so any candidate/draft is traceable to the prompt that
// produced it (spec §5.1). Bump the version whenever the prompt changes.

export const RESEARCH_PROMPT_VERSION = "research-v1";

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
    ``,
    `Source material:`,
    ``,
    gathered,
  ].join("\n");
}
