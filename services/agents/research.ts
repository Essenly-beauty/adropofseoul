import { gateway, generateText, Output, stepCountIs } from "ai";
import { getModel } from "@/lib/agents/model";
import {
  CandidateListSchema,
  RunConfigSchema,
  type Candidate,
  type ImageSeed,
  type RunConfig,
} from "@/lib/agents/schemas";
import {
  buildResearchExtractPrompt,
  RESEARCH_PROMPT_VERSION,
} from "@/lib/agents/prompts";
import { filterNewCandidates } from "@/lib/agents/dedupe";
import { combinedConfidence } from "@/lib/agents/score";
import {
  checkUrlLiveness,
  type UrlLiveness,
} from "@/lib/agents/verify-sources";
import { fetchRedditDocs, formatGathered } from "@/lib/agents/sources";
import { fetchStockImages } from "@/lib/agents/stock-images";
import { createRun, finishRun } from "./runs";
import { insertCandidates, listCandidateKeysForArea } from "./candidates";
import { insertImageCandidates, type ImageInsert } from "./images";
import { listPlaceKeysForArea } from "./places-keys";

export type Gathered = {
  /** URL-labeled source material for the extract prompt. */
  text: string;
  /** Reality images found in the sources — rights unverified. */
  images: ImageSeed[];
};

export type ResearchDeps = {
  /** Collects raw source material (and any images found in it). */
  gather: (config: RunConfig) => Promise<Gathered>;
  /** Extracts structured candidates from gathered material. */
  extract: (prompt: string) => Promise<{ candidates: Candidate[] }>;
  /** Commercial-safe stock pool (Unsplash/Pexels). Optional — env-gated. */
  gatherStock?: (config: RunConfig) => Promise<ImageSeed[]>;
  /** Source-URL liveness check (injected for offline tests). */
  checkUrl?: (url: string) => Promise<UrlLiveness>;
};

/** Max source URLs verified per run (bounds latency/cost). */
const MAX_SOURCE_CHECKS = 40;

export type ResearchResult =
  | { ok: true; runId: string; kept: number; dropped: number; images: number }
  | { ok: false; runId?: string; error: string };

/** Hard ceiling on image rows per run — keeps the manual server-action path
 * inside its function budget (inserts are one roundtrip per row). */
const MAX_IMAGES_PER_RUN = 60;

/** Reality image found in source material → insert row. Everything from the
 * open web is rights-UNVERIFIED until the editor clears it (attribution is
 * recorded for crediting, but attribution alone is not a license). */
function realityImage(
  url: string,
  sourceUrl: string,
  area: string,
  description: string | null,
  placeCandidateId?: string | null
): ImageInsert {
  let sourceType: ImageSeed["sourceType"] = "web";
  try {
    const host = new URL(url).hostname;
    if (host.endsWith("redd.it") || host.endsWith("reddit.com")) {
      sourceType = "reddit";
    }
  } catch {
    // keep "web"
  }
  return {
    url,
    sourceUrl,
    sourceType,
    description,
    suggestedUse: "inline",
    license: "unverified",
    attribution: null,
    area,
    placeCandidateId: placeCandidateId ?? null,
  };
}

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
          gathered: gathered.text,
          limit: config.limit,
        })
      )
    ).candidates;

    // Source verification (spec §3 "sources over sizzle"). Two gates:
    //  1. every source URL must appear verbatim in the gathered material —
    //     kills URLs the model invented or mangled (the 404 problem);
    //  2. definitively-dead URLs (404/410) are dropped by a liveness check.
    // A candidate left with no usable source is not verifiable → dropped.
    const checkUrl = deps.checkUrl ?? checkUrlLiveness;
    const present = Array.from(
      new Set(
        extracted.flatMap((c) =>
          c.sourceUrls.filter((u) => gathered.text.includes(u))
        )
      )
    );
    const checked = await Promise.all(
      present
        .slice(0, MAX_SOURCE_CHECKS)
        .map(async (u) => [u, await checkUrl(u)] as const)
    );
    const deadUrls = new Set(
      checked.filter(([, l]) => l === "dead").map(([u]) => u)
    );

    const verified: Candidate[] = [];
    let droppedNoSource = 0;
    for (const c of extracted) {
      const usable = c.sourceUrls.filter(
        (u) => gathered.text.includes(u) && !deadUrls.has(u)
      );
      if (usable.length === 0) {
        droppedNoSource++;
        continue;
      }
      verified.push({ ...c, sourceUrls: usable });
    }

    // Re-score model confidence with corroboration signals (spec §5.2).
    const scored = verified.map((c) => ({
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

    let candidateIds: (string | null)[] = [];
    if (fresh.length > 0) {
      const inserted = await insertCandidates(runId, fresh);
      if (!inserted.ok) throw new Error(inserted.message);
      candidateIds = inserted.ids;
    }

    // Image candidates (option): place-linked reality shots from extraction,
    // the remaining area pool from gathered sources, and the stock pool.
    // This channel is decoration — its failures degrade, never break the run
    // (candidates are already persisted at this point).
    let imagesInserted = 0;
    let imagesDropped = 0;
    let imagesError: string | undefined;
    if (config.images) {
      const imageInputs: ImageInsert[] = [];
      const seenUrls = new Set<string>();

      fresh.forEach((c, i) => {
        // Prompt tells the model to only echo URLs from the material; enforce
        // it here — a URL not present verbatim in the gathered text is
        // hallucinated or injected, and never persisted.
        for (const url of c.imageUrls) {
          if (!gathered.text.includes(url)) continue;
          if (seenUrls.has(url)) continue;
          seenUrls.add(url);
          imageInputs.push(
            realityImage(
              url,
              c.sourceUrls[0],
              config.area,
              `${c.name} — found in sources`,
              candidateIds[i]
            )
          );
        }
      });

      for (const img of gathered.images) {
        if (seenUrls.has(img.url)) continue;
        seenUrls.add(img.url);
        imageInputs.push({ ...img, area: config.area });
      }

      if (deps.gatherStock) {
        try {
          for (const img of await deps.gatherStock(config)) {
            if (seenUrls.has(img.url)) continue;
            seenUrls.add(img.url);
            imageInputs.push({ ...img, area: config.area });
          }
        } catch (stockError) {
          imagesError = `stock: ${
            stockError instanceof Error ? stockError.message : stockError
          }`;
        }
      }

      const capped = imageInputs.slice(0, MAX_IMAGES_PER_RUN);
      imagesDropped = imageInputs.length - capped.length;

      if (capped.length > 0) {
        const result = await insertImageCandidates(runId, capped);
        if (result.ok) {
          imagesInserted = result.inserted;
        } else {
          imagesError = [imagesError, `insert: ${result.message}`]
            .filter(Boolean)
            .join("; ");
        }
      }
    }

    await finishRun(runId, {
      status: "done",
      counts: {
        extracted: extracted.length,
        droppedNoSource,
        kept: fresh.length,
        dropped,
        images: imagesInserted,
        imagesDropped,
      },
      // Degraded image channel is recorded on the run without failing it.
      error: imagesError,
    });
    return {
      ok: true,
      runId,
      kept: fresh.length,
      dropped,
      images: imagesInserted,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await finishRun(runId, { status: "error", error: message });
    return { ok: false, runId, error: message };
  }
}

// ---------------------------------------------------------------------------
// Production dependencies. Gather = Reddit JSON + gateway web search (cited);
// extract = structured output against the candidate schema.

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
      const images: ImageSeed[] = [];
      const failures: string[] = [];

      // Each source is best-effort: one channel failing (e.g. Reddit 403s
      // unauthenticated JSON) must not sink the run while the other works.
      if (config.sources.includes("reddit")) {
        try {
          const docs = await fetchRedditDocs(config.area);
          if (docs.length > 0) parts.push(formatGathered(docs));
          for (const doc of docs) {
            for (const url of doc.images) {
              images.push({
                url,
                sourceUrl: doc.url,
                sourceType: "reddit",
                description: doc.title,
                suggestedUse: "inline",
                license: "unverified",
                attribution: null,
              });
            }
          }
        } catch (e) {
          failures.push(`reddit: ${e instanceof Error ? e.message : e}`);
        }
      }
      if (config.sources.includes("web")) {
        try {
          // Gateway-executed web search (no extra API key; any model).
          const { text, sources } = await generateText({
            model: getModel(),
            prompt: WEB_SEARCH_GATHER_PROMPT(config.area),
            tools: { web_search: gateway.tools.perplexitySearch() },
            stopWhen: stepCountIs(4),
          });
          if (text.trim()) parts.push(`[web research]\n${text}`);
          // The search tool's REAL result URLs — the extractor is constrained
          // to URLs present in this material, so citing these avoids the model
          // inventing/mangling an article URL into a 404.
          const urls = sources
            .filter((s) => s.sourceType === "url")
            .map((s) => s.url);
          if (urls.length > 0) parts.push(`[web sources]\n${urls.join("\n")}`);
        } catch (e) {
          failures.push(`web: ${e instanceof Error ? e.message : e}`);
        }
      }
      if (parts.length === 0) {
        throw new Error(
          `No source material gathered for ${config.area}` +
            (failures.length ? ` (${failures.join("; ")})` : "") +
            "."
        );
      }
      return { text: parts.join("\n\n===\n\n"), images };
    },
    async gatherStock(config) {
      return fetchStockImages(config.area);
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
