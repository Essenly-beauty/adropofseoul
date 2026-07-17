import { generateText, Output } from "ai";
import { getModel } from "@/lib/agents/model";
import { GuideDraftSchema, type GuideDraft } from "@/lib/agents/schemas";
import {
  buildGuideWritePrompt,
  WRITER_PROMPT_VERSION,
} from "@/lib/agents/prompts";
import { isLive } from "@/lib/admin/workflow";
import { listAllPlaces } from "@/services/admin/places";
import { listAllPosts, createPost } from "@/services/admin/posts";
import { createRun, finishRun } from "./runs";

export type WriterDeps = {
  /** Produces a schema-valid guide draft from the prompt. */
  write: (prompt: string) => Promise<GuideDraft>;
};

export type WriterResult =
  | { ok: true; runId: string; postId: string }
  | { ok: false; runId?: string; error: string };

const MAX_LINK_CANDIDATES = 8;

/**
 * The writing agent (spec §5.4): approved places in an area → a `guides`
 * post DRAFT in the house template, with [[ NOTE ]] slots for everything
 * first-hand. Never publishes — Human Gate 2 is the editor finishing the
 * NOTEs in the CMS before flipping status.
 */
export async function runWriter(
  { area }: { area: string },
  deps: WriterDeps
): Promise<WriterResult> {
  const allPlaces = await listAllPlaces();
  const places = allPlaces.filter(
    (p) => (p.area ?? "").toLowerCase() === area.toLowerCase()
  );
  if (places.length === 0) {
    return {
      ok: false,
      error: `No places found for "${area}" — approve candidates or add places first.`,
    };
  }

  const run = await createRun({
    agent: "writer",
    area,
    sourceConfig: { placeIds: places.map((p) => p.id) },
    promptVersion: WRITER_PROMPT_VERSION,
  });
  if (!run.ok || !run.id) {
    return {
      ok: false,
      error: `Could not create run: ${!run.ok ? run.message : "no id"}`,
    };
  }
  const runId = run.id;

  try {
    const relatedPosts = (await listAllPosts())
      .filter((p) => isLive(p.status))
      .slice(0, MAX_LINK_CANDIDATES)
      .map((p) => ({ title: p.title, slug: p.slug }));

    const prompt = buildGuideWritePrompt({ area, places, relatedPosts });
    const draft = GuideDraftSchema.parse(await deps.write(prompt));

    const postId = await persistDraft(draft);

    await finishRun(runId, {
      status: "done",
      counts: { places: places.length, links: relatedPosts.length },
    });
    return { ok: true, runId, postId };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await finishRun(runId, { status: "error", error: message });
    return { ok: false, runId, error: message };
  }
}

/** Creates the draft post; on a slug collision retries once with a suffix. */
async function persistDraft(draft: GuideDraft): Promise<string> {
  const input = (slug: string) => ({
    title: draft.title,
    slug,
    subtitle: draft.subtitle,
    excerpt: draft.excerpt,
    body: draft.bodyMarkdown,
    category: "guides",
    tags: draft.tags,
    featuredImage: null, // editor picks from the image pool
    author: "A Drop of Seoul Editorial Team",
    seoTitle: draft.seoTitle,
    metaDescription: draft.metaDescription,
    status: "draft", // Human Gate 2 — never published by the agent
    publishedAt: null,
  });

  let result = await createPost(input(draft.slug));
  if (!result.ok && result.code === "23505") {
    result = await createPost(input(`${draft.slug}-${Date.now() % 10000}`));
  }
  if (!result.ok) throw new Error(result.message);
  if (!result.id) throw new Error("Post created without an id.");
  return result.id;
}

export function productionWriterDeps(): WriterDeps {
  return {
    async write(prompt) {
      const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema: GuideDraftSchema }),
        prompt,
      });
      return output;
    },
  };
}
