// Server-only helpers for pillar articles: hero resolution + Post-shaped
// adapters so they appear in the Stories index, the Around Seoul Common tab,
// and the sitemap. Imported only from server components.
import type { Post } from "@/services/types";
import { publicFileExists } from "@/lib/seongsu/assets";
import { PILLARS, type Pillar } from "./pillars";

/** Hero image path if the file exists, otherwise null (renders a placeholder). */
export function resolvePillarHero(pillar: Pillar): string | null {
  return publicFileExists(pillar.heroImage) ? pillar.heroImage : null;
}

/** Adapt a pillar to the Post shape editorial cards expect. */
export function pillarToPost(pillar: Pillar): Post {
  return {
    id: `pillar-${pillar.slug}`,
    title: pillar.title,
    slug: pillar.slug,
    subtitle: pillar.dek,
    excerpt: pillar.excerpt,
    body: pillar.body,
    category: pillar.category,
    tags: ["seoul", `region:${pillar.region}`],
    featuredImage: resolvePillarHero(pillar),
    author: pillar.author,
    seoTitle: pillar.seoTitle,
    metaDescription: pillar.metaDescription,
    publishedAt: pillar.publishedAt,
  };
}

/** Pillar articles as Post cards, filtered by region, pinned first. */
export function listPillarPosts(opts: { region?: string } = {}): Post[] {
  return PILLARS.filter((p) => !opts.region || p.region === opts.region)
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
    })
    .map(pillarToPost);
}
