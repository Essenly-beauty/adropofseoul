// Source gathering primitives for the research agent. Pure parsing/formatting
// lives here (unit-tested); the thin fetch wrapper does I/O only.

export type SourceDoc = {
  url: string;
  title: string;
  text: string;
  /** Direct image URLs found on the post — reality shots, rights UNVERIFIED. */
  images: string[];
};

type RedditPost = {
  data?: {
    title?: string;
    selftext?: string;
    permalink?: string;
    removed_by_category?: string | null;
    url?: string;
    preview?: { images?: { source?: { url?: string } }[] };
  };
};

const IMAGE_URL_RE = /\.(jpe?g|png|webp)(\?|$)/i;
const IMAGE_HOSTS = ["i.redd.it", "i.imgur.com"];
const MAX_IMAGES_PER_POST = 2;

function postImages(post: NonNullable<RedditPost["data"]>): string[] {
  const found: string[] = [];
  // Direct-link posts (i.redd.it / imgur / *.jpg).
  if (post.url) {
    try {
      const u = new URL(post.url);
      if (IMAGE_HOSTS.includes(u.hostname) || IMAGE_URL_RE.test(u.pathname)) {
        found.push(post.url);
      }
    } catch {
      // not a URL — ignore
    }
  }
  // Preview sources (HTML-escaped by reddit).
  for (const img of post.preview?.images ?? []) {
    const src = img?.source?.url?.replace(/&amp;/g, "&");
    if (src && !found.includes(src)) found.push(src);
  }
  return found.slice(0, MAX_IMAGES_PER_POST);
}

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
      images: postImages(post),
    });
  }
  return docs;
}

/** Numbered, URL-labeled blocks — the extract prompt requires the model to
 * cite these URLs verbatim in sourceUrls (and image URLs in imageUrls). */
export function formatGathered(docs: SourceDoc[]): string {
  return docs
    .map((d, i) => {
      const images =
        d.images.length > 0 ? `\nimages: ${d.images.join(" ")}` : "";
      return `[${i + 1}] ${d.url}\n${d.title}\n${d.text}${images}`;
    })
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
