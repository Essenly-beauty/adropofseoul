// Source gathering primitives for the research agent. Pure parsing/formatting
// lives here (unit-tested); the thin fetch wrapper does I/O only.

export type SourceDoc = {
  url: string;
  title: string;
  text: string;
};

type RedditPost = {
  data?: {
    title?: string;
    selftext?: string;
    permalink?: string;
    removed_by_category?: string | null;
  };
};

/** Parses a reddit search.json payload into SourceDocs. Removed posts are
 * dropped; title-only posts are kept (titles often name places). */
export function parseRedditSearch(payload: unknown): SourceDoc[] {
  const children =
    (payload as { data?: { children?: RedditPost[] } } | null)?.data
      ?.children ?? [];
  const docs: SourceDoc[] = [];
  for (const child of children) {
    const post = child?.data;
    if (!post?.title || !post.permalink) continue;
    if (post.removed_by_category) continue;
    docs.push({
      url: `https://www.reddit.com${post.permalink}`,
      title: post.title,
      text: [post.title, post.selftext ?? ""].filter(Boolean).join("\n"),
    });
  }
  return docs;
}

/** Numbered, URL-labeled blocks — the extract prompt requires the model to
 * cite these URLs verbatim in sourceUrls. */
export function formatGathered(docs: SourceDoc[]): string {
  return docs
    .map((d, i) => `[${i + 1}] ${d.url}\n${d.title}\n${d.text}`)
    .join("\n\n---\n\n");
}

export function redditQueryFor(area: string): string {
  return `${area} Seoul (head spa OR salon OR beauty OR skincare OR cafe OR wellness)`;
}

const REDDIT_UA =
  "adropofseoul-research/1.0 (editorial research; contact via site)";
const MAX_POSTS = 20;

/** Thin I/O wrapper (not unit-tested beyond wiring). Injectable fetchImpl. */
export async function fetchRedditDocs(
  area: string,
  fetchImpl: typeof fetch = fetch
): Promise<SourceDoc[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
    redditQueryFor(area)
  )}&sort=relevance&t=year&limit=${MAX_POSTS}`;
  const res = await fetchImpl(url, { headers: { "User-Agent": REDDIT_UA } });
  if (!res.ok) throw new Error(`Reddit search failed: HTTP ${res.status}`);
  return parseRedditSearch(await res.json());
}
