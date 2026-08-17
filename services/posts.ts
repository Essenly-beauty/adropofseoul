import { cache } from "@/lib/react-cache";
import { createClient } from "@/lib/supabase/public";
import type { Post } from "./types";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string;
  tags: string[];
  featured_image: string | null;
  author: string | null;
  seo_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  updated_at: string | null;
};

const COLUMNS =
  "id,title,slug,subtitle,excerpt,body,category,tags,featured_image,author,seo_title,meta_description,published_at,updated_at";

const LOCAL_FEATURED_IMAGES: Record<string, string> = {
  "five-k-beauty-serums": "/images/articles/five-k-beauty-serums.png",
  "gangnam-beauty-day": "/images/articles/gangnam-beauty-day.png",
  "hannam-afternoon-local-guide":
    "/images/articles/hannam-afternoon-local-guide.png",
  "k-beauty-is-changing": "/images/articles/k-beauty-is-changing.png",
  "korean-beauty-brands-to-start-with":
    "/images/articles/korean-beauty-brands-to-start-with.png",
  "korean-fragrance-seoul": "/images/articles/korean-fragrance-seoul.png",
  "korean-hair-brands-worth-knowing":
    "/images/articles/korean-hair-brands-worth-knowing.png",
  "korean-hair-masks-worth-buying":
    "/images/articles/korean-hair-masks-worth-buying.png",
  "korean-haircare-fine-frizzy-hair":
    "/images/articles/korean-haircare-fine-frizzy-hair.png",
  "korean-haircare-where-to-start":
    "/images/articles/korean-haircare-where-to-start.png",
  "korean-phrases-for-beauty-shopping":
    "/images/articles/korean-phrases-for-beauty-shopping.png",
  "korean-post-treatment-recovery-skincare-routine":
    "/images/articles/korean-post-treatment-recovery-skincare-routine.png",
  "korean-skin-texture-meaning":
    "/images/articles/korean-skin-texture-meaning.png",
  "korean-skincare-brands-on-our-radar":
    "/images/articles/korean-skincare-brands-on-our-radar.png",
  "korean-skincare-labels-explained":
    "/images/articles/korean-skincare-labels-explained.png",
  "myeongdong-vs-seongsu-beauty-shopping":
    "/images/articles/myeongdong-vs-seongsu-beauty-shopping.png",
  "olive-young-shopping-guide":
    "/images/articles/olive-young-shopping-guide.jpg",
  "new-generation-korean-beauty-brands":
    "/images/articles/new-generation-korean-beauty-brands.png",
  "people-shaping-seoul-beauty":
    "/images/articles/people-shaping-seoul-beauty.png",
  "seongsu-beauty-spots": "/images/articles/seongsu-beauty-spots.png",
  "seoul-holistic-beauty-shift":
    "/images/articles/seoul-holistic-beauty-shift.png",
  "seoul-scalp-care-culture": "/images/articles/seoul-scalp-care-culture.png",
  "the-drop-list-august-2026": "/images/articles/the-drop-list-august-2026.png",
  "what-makes-a-brand-feel-seoul":
    "/images/articles/what-makes-a-brand-feel-seoul.png",
  "what-to-buy-at-olive-young":
    "/images/articles/what-to-buy-at-olive-young.png",
  "what-to-buy-korean-skincare-skin-type":
    "/images/articles/what-to-buy-korean-skincare-skin-type.jpg",
  "where-to-shop-k-beauty-beyond-olive-young":
    "/images/articles/where-to-shop-k-beauty-beyond-olive-young.png",
};

export function mapPostRow(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category,
    tags: row.tags ?? [],
    // `||`, not `??`: the markdown seeder writes featured_image as "" rather
    // than null, and an empty string has to fall through to the local map.
    // Curated local heroes are source-of-truth for their registered slugs.
    // This also replaces stale non-empty CMS paths left from earlier previews.
    featuredImage:
      LOCAL_FEATURED_IMAGES[row.slug] || row.featured_image || null,
    author: row.author,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedPosts(
  opts: { limit?: number; category?: string; categories?: string[] } = {}
): Promise<Post[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? 24);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.categories && opts.categories.length > 0)
    query = query.in("category", opts.categories);
  const { data, error } = await query;
  if (error) throw error;
  return (data as PostRow[] | null)?.map(mapPostRow) ?? [];
}

export const getPostBySlug = cache(
  async (slug: string): Promise<Post | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(COLUMNS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return data ? mapPostRow(data as PostRow) : null;
  }
);
