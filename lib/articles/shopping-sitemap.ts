/**
 * Lightweight shopping article metadata for serverless sitemap generation.
 *
 * Keep this separate from `shopping.ts`: that module reads Markdown bodies
 * from disk at import time, but those source files are not part of the
 * sitemap route's Vercel function bundle.
 */
export const SHOPPING_SITEMAP_ARTICLES = [
  { slug: "daiso-korea-guide", publishedAt: "2026-08-31" },
  { slug: "daiso-korea-must-buys", publishedAt: "2026-09-02" },
  { slug: "daiso-korea-beauty", publishedAt: "2026-09-03" },
  { slug: "daiso-vs-olive-young-korea", publishedAt: "2026-09-06" },
] as const;
