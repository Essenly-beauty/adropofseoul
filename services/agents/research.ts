import { gateway, generateText, Output, stepCountIs } from "ai";
import { getModel } from "@/lib/agents/model";
import {
  CandidateListSchema,
  RunConfigSchema,
  type Candidate,
  type RunConfig,
} from "@/lib/agents/schemas";
import {
  buildResearchExtractPrompt,
  RESEARCH_PROMPT_VERSION,
} from "@/lib/agents/prompts";
import { filterNewCandidates } from "@/lib/agents/dedupe";
import { combinedConfidence } from "@/lib/agents/score";
import { fetchRedditDocs, formatGathered } from "@/lib/agents/sources";
import { createRun, finishRun } from "./runs";
import { insertCandidates, listCandidateKeysForArea } from "./candidates";
import { listPlaceKeysForArea } from "./places-keys";

export type ResearchDeps = {
  /** Collects raw, URL-labeled source material for the area. */
  gather: (config: RunConfig) => Promise<string>;
  /** Extracts structured candidates from gathered material. */
  extract: (prompt: string) => Promise<{ candidates: Candidate[] }>;
};

export type ResearchResult =
  | { ok: true; runId: string; kept: number; dropped: number }
  | { ok: false; runId?: string; error: string };

/**
 * The research pipeline (spec §5.2). Persistence goes through the Track 1
 * services; gather/extract are injected so tests never touch the network.
 * Any throw after run creation marks the run `error` — no partial silence.
 */
export async function runResearch(
  rawConfig: unknown,
  deps: ResearchDeps
): Promise<ResearchResult> {
  const parsed = RunConfigSchema.safeParse(rawConfig);
  if (!parsed.success) {
    return { ok: false, error: `Invalid run config: ${parsed.error.message}` };
  }
  const config = parsed.data;

  const run = await createRun({
    agent: "research",
    area: config.area,
    sourceConfig: { sources: config.sources, limit: config.limit },
    promptVersion: RESEARCH_PROMPT_VERSION,
  });
  if (!run.ok || !run.id) {
    return {
      ok: false,
      error: `Could not create run: ${!run.ok ? run.message : "no id"}`,
    };
  }
  const runId = run.id;

  try {
    const gathered = await deps.gather(config);
    const extracted = (
      await deps.extract(
        buildResearchExtractPrompt({
          area: config.area,
          gathered,
          limit: config.limit,
        })
      )
    ).candidates;

    // Re-score model confidence with corroboration signals (spec §5.2).
    const scored = extracted.map((c) => ({
      ...c,
      confidence: combinedConfidence({
        modelConfidence: c.confidence,
        sourceCount: c.sourceUrls.length,
        hasEvidence: c.evidenceQuote.trim().length > 0,
      }),
    }));

    // Idempotency: drop anything already filed as a candidate (any status)
    // or already a real place in the directory.
    const [candidateKeys, placeKeys] = await Promise.all([
      listCandidateKeysForArea(config.area),
      listPlaceKeysForArea(config.area),
    ]);
    const existing = new Set(
      Array.from(candidateKeys).concat(Array.from(placeKeys))
    );
    const fresh = filterNewCandidates(scored, existing);
    const dropped = scored.length - fresh.length;

    if (fresh.length > 0) {
      const inserted = await insertCandidates(runId, fresh);
      if (!inserted.ok) throw new Error(inserted.message);
    }

    await finishRun(runId, {
      status: "done",
      counts: {
        extracted: extracted.length,
        kept: fresh.length,
        dropped,
      },
    });
    return { ok: true, runId, kept: fresh.length, dropped };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await finishRun(runId, { status: "error", error: message });
    return { ok: false, runId, error: message };
  }
}

// ---------------------------------------------------------------------------
// Production dependencies. Gather = Reddit JSON + model web search (cited);
// extract = generateObject against the candidate schema.

const WEB_SEARCH_GATHER_PROMPT = (area: string) =>
  [
    `Search the web for currently notable beauty/wellness/lifestyle places`,
    `in the ${area} area of Seoul (head spas, salons, skincare clinics,`,
    `concept cafes, wellness spots). Summarize what you find as short notes,`,
    `and after EVERY claim include the source URL in parentheses. Only report`,
    `places you found in actual sources — no prior knowledge.`,
  ].join("\n");

export function productionDeps(): ResearchDeps {
  return {
    async gather(config) {
      const parts: string[] = [];
      if (config.sources.includes("reddit")) {
        const docs = await fetchRedditDocs(config.area);
        if (docs.length > 0) parts.push(formatGathered(docs));
      }
      if (config.sources.includes("web")) {
        // Gateway-executed web search (no extra API key; works with any model).
        const { text } = await generateText({
          model: getModel(),
          prompt: WEB_SEARCH_GATHER_PROMPT(config.area),
          tools: { web_search: gateway.tools.perplexitySearch() },
          stopWhen: stepCountIs(4),
        });
        if (text.trim()) parts.push(`[web research]\n${text}`);
      }
      if (parts.length === 0) {
        throw new Error(`No source material gathered for ${config.area}.`);
      }
      return parts.join("\n\n===\n\n");
    },
    async extract(prompt) {
      const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema: CandidateListSchema }),
        prompt,
      });
      return output;
    },
  };
}
