// Server-only helpers for the Seongsu guides: image resolution + Post-shaped
// adapters so the code-defined guides appear in the Stories index, the Guides
// category page, and the sitemap alongside DB-backed posts.
import "server-only";
import publicAssets from "@/data/public-assets.json";
import type { Post } from "@/services/types";
import { GUIDES, type Guide } from "./guides";

const assetPaths = new Set(publicAssets);

/** Checked against the public files indexed at build time, without runtime fs. */
export function publicFileExists(relPath: string): boolean {
  if (!relPath) return false;
  const clean = relPath.replace(/^\/+/, "");
  return assetPaths.has(clean);
}

/** Hero image path if the file exists, otherwise null (renders a placeholder). */
export function resolveHeroImage(guide: Guide): string | null {
  return publicFileExists(guide.heroImage) ? guide.heroImage : null;
}

/** Approximate combined body used for reading-time on cards. */
function guideBody(guide: Guide): string {
  return [
    guide.intro,
    guide.walk,
    guide.linkUp ?? "",
    guide.knowBeforeYouGo,
  ].join("\n\n");
}

/** Adapt a guide to the Post shape the editorial ArticleCard expects. */
export function guideToPost(guide: Guide): Post {
  return {
    id: `guide-${guide.slug}`,
    title: guide.title,
    slug: guide.slug,
    subtitle: guide.subtitle,
    excerpt: guide.excerpt,
    body: guideBody(guide),
    category: guide.category,
    tags: ["seongsu", "seoul guide"],
    featuredImage: resolveHeroImage(guide),
    author: guide.author,
    seoTitle: guide.seoTitle,
    metaDescription: guide.metaDescription,
    publishedAt: guide.publishedAt,
  };
}

/** All guides as Post cards, newest first (matches listPublishedPosts ordering). */
export function listGuidePosts(opts: { category?: string } = {}): Post[] {
  return GUIDES.filter((g) => !opts.category || g.category === opts.category)
    .map(guideToPost)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}
