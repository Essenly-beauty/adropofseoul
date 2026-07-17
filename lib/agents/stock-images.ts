import type { ImageSeed } from "./schemas";

// Commercial-safe stock pool (content-strategy licensing hygiene: Unsplash/
// Pexels only). Pure mappers are unit-tested; fetchers are thin, env-gated
// wrappers — no key set means that provider is silently skipped.

const MAX_STOCK = 6;

type UnsplashPhoto = {
  urls?: { regular?: string };
  links?: { html?: string };
  alt_description?: string | null;
  user?: { name?: string };
};

/** Unsplash URLs embed a per-request `ixid` tracking param — left in place it
 * defeats the unique-url idempotency and re-inserts the same photo every run. */
function stripVolatileParams(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("ixid");
    u.searchParams.delete("ixlib");
    return u.toString();
  } catch {
    return url;
  }
}

export function mapUnsplashResults(payload: unknown): ImageSeed[] {
  const results =
    (payload as { results?: UnsplashPhoto[] } | null)?.results ?? [];
  const seeds: ImageSeed[] = [];
  for (const photo of results) {
    if (!photo?.urls?.regular || !photo.links?.html) continue;
    seeds.push({
      url: stripVolatileParams(photo.urls.regular),
      sourceUrl: photo.links.html,
      sourceType: "unsplash",
      description: photo.alt_description ?? null,
      suggestedUse: "thumbnail",
      license: "commercial-ok", // Unsplash License
      attribution: photo.user?.name ?? null,
    });
  }
  return seeds.slice(0, MAX_STOCK);
}

type PexelsPhoto = {
  src?: { large?: string };
  url?: string;
  alt?: string | null;
  photographer?: string;
};

export function mapPexelsResults(payload: unknown): ImageSeed[] {
  const photos = (payload as { photos?: PexelsPhoto[] } | null)?.photos ?? [];
  const seeds: ImageSeed[] = [];
  for (const photo of photos) {
    if (!photo?.src?.large || !photo.url) continue;
    seeds.push({
      url: photo.src.large,
      sourceUrl: photo.url,
      sourceType: "pexels",
      description: photo.alt ?? null,
      suggestedUse: "thumbnail",
      license: "commercial-ok", // Pexels License
      attribution: photo.photographer ?? null,
    });
  }
  return seeds.slice(0, MAX_STOCK);
}

/** Warm, editorial search phrasing — the brand wants calm reality, not
 * postcard stock. The brand tint is applied at render time (2차 가공). */
export function stockQueryFor(area: string): string {
  return `${area} seoul street cafe warm minimal`;
}

/** The stock pool is a decoration channel — a provider outage must degrade to
 * "no stock images", never break the research run. Each provider is fetched
 * with a timeout and its failures are swallowed per-provider. */
export async function fetchStockImages(
  area: string,
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv = process.env
): Promise<ImageSeed[]> {
  const seeds: ImageSeed[] = [];
  const query = encodeURIComponent(stockQueryFor(area));

  if (env.UNSPLASH_ACCESS_KEY) {
    try {
      const res = await fetchImpl(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=${MAX_STOCK}&orientation=landscape`,
        {
          headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` },
          signal: AbortSignal.timeout(8_000),
        }
      );
      if (res.ok) seeds.push(...mapUnsplashResults(await res.json()));
    } catch {
      // provider down/slow — skip, reality images are unaffected
    }
  }

  if (env.PEXELS_API_KEY) {
    try {
      const res = await fetchImpl(
        `https://api.pexels.com/v1/search?query=${query}&per_page=${MAX_STOCK}&orientation=landscape`,
        {
          headers: { Authorization: env.PEXELS_API_KEY },
          signal: AbortSignal.timeout(8_000),
        }
      );
      if (res.ok) seeds.push(...mapPexelsResults(await res.json()));
    } catch {
      // provider down/slow — skip
    }
  }

  return seeds;
}
