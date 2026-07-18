// Source-URL liveness. The research extractor can emit a plausible-looking
// URL that 404s (a web-search model mangles an article slug, or a real page
// was removed). "Sources over sizzle" (spec §3) means a candidate whose only
// sources are dead is not verifiable — it must not reach the review queue.

export type UrlLiveness = "alive" | "dead" | "unknown";

/**
 * Map an HTTP status to liveness. 404/410 are a definitive "gone" — drop.
 * 2xx/3xx are alive. Everything else (403/429/5xx) is ambiguous: many real
 * pages block bot fetches or rate-limit, so we keep those as `unknown` rather
 * than dropping a live page our request simply couldn't read.
 */
export function livenessFromStatus(status: number): UrlLiveness {
  if (status === 404 || status === 410) return "dead";
  if (status >= 200 && status < 400) return "alive";
  return "unknown";
}

const BROWSER_UA =
  "Mozilla/5.0 (compatible; adropofseoul-verify/1.0; +https://adropofseoul.vercel.app)";

export async function checkUrlLiveness(
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<UrlLiveness> {
  try {
    const res = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(8_000),
    });
    return livenessFromStatus(res.status);
  } catch {
    // Network error / timeout — ambiguous, not a definitive "gone".
    return "unknown";
  }
}
