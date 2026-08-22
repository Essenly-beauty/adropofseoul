import { cache } from "@/lib/react-cache";
import { createClient } from "@/lib/supabase/public";
import { isPostPublic } from "@/lib/publishing";
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
  "seoul-rainy-day": "/images/articles/seoul-rainy-day.jpg",
  "free-things-to-do-seoul": "/images/articles/free-things-to-do-seoul.jpg",
  "quiet-side-of-seoul": "/images/articles/quiet-side-of-seoul.jpg",
  "best-time-to-visit-seoul": "/images/articles/best-time-to-visit-seoul.jpg",
  "seoul-etiquette-visitors-need":
    "/images/articles/seoul-etiquette-visitors-need.jpg",
  "where-to-stay-seoul-neighborhoods":
    "/images/articles/where-to-stay-seoul-neighborhoods.jpg",
  "seoul-for-design-lovers": "/images/articles/seoul-for-design-lovers.jpg",
  "how-to-use-seoul-public-transport":
    "/images/articles/how-to-use-seoul-public-transport.jpg",
  "coex-bongeunsa-apgujeong-day":
    "/images/articles/coex-bongeunsa-apgujeong-day.jpg",
  "myeongdong-to-namsan-sunset":
    "/images/articles/myeongdong-to-namsan-sunset.jpg",
  "han-river-picnic-like-a-local":
    "/images/articles/han-river-picnic-like-a-local.jpg",
  "seoul-forest-seongsu-walking-guide":
    "/images/articles/seoul-forest-seongsu-walking-guide.jpg",
  "five-days-in-seoul-without-rushing":
    "/images/articles/five-days-in-seoul-without-rushing.jpg",
  "korean-convenience-store-first-timers":
    "/images/articles/korean-convenience-store-first-timers.jpg",
  "seoul-coffee-and-architecture":
    "/images/articles/seoul-coffee-and-architecture.jpg",
  "yeonnam-by-day-hongdae-by-night":
    "/images/articles/yeonnam-by-day-hongdae-by-night.jpg",
  "korean-wellness-habits-worth-keeping":
    "/images/articles/korean-wellness-habits-worth-keeping.jpg",
  "how-to-use-naver-map": "/images/articles/how-to-use-naver-map.jpg",
  "glass-skin-without-10-steps":
    "/images/articles/glass-skin-without-10-steps.png",
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
  "korean-hair-scalp-care-routine":
    "/images/articles/korean-hair-scalp-care-routine.png",
  "korean-head-spa-first-timer-guide":
    "/images/articles/korean-head-spa-first-timer-guide.png",
  "korean-hair-masks-worth-buying":
    "/images/articles/korean-hair-masks-worth-buying.png",
  "korean-haircare-fine-frizzy-hair":
    "/images/articles/korean-haircare-fine-frizzy-hair.png",
  "korean-haircare-where-to-start":
    "/images/articles/korean-haircare-where-to-start.png",
  "korean-phrases-for-beauty-shopping":
    "/images/articles/korean-phrases-for-beauty-shopping.png",
  "korean-3-step-skincare-routine":
    "/images/articles/korean-3-step-skincare-routine.png",
  "korean-5-step-morning-skincare-routine":
    "/images/articles/korean-5-step-morning-skincare-routine.png",
  "korean-barrier-repair-routine":
    "/images/articles/korean-barrier-repair-routine.png",
  "korean-clinic-to-home-skincare":
    "/images/articles/korean-clinic-to-home-skincare.png",
  "korean-post-treatment-recovery-skincare-routine":
    "/images/articles/korean-post-treatment-recovery-skincare-routine.png",
  "korean-skip-care-explained":
    "/images/articles/korean-skip-care-explained.png",
  "korean-skin-texture-meaning":
    "/images/articles/korean-skin-texture-meaning.png",
  "korean-skincare-brands-on-our-radar":
    "/images/articles/korean-skincare-brands-on-our-radar.png",
  "korean-skincare-labels-explained":
    "/images/articles/korean-skincare-labels-explained.png",
  "korean-skincare-30s-slow-aging-routine":
    "/images/articles/korean-skincare-30s-slow-aging-routine.png",
  "korean-summer-cooling-skincare-routine":
    "/images/articles/korean-summer-cooling-skincare-routine.jpg",
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
  "toner-pads-as-mini-masks": "/images/articles/toner-pads-as-mini-masks.jpg",
  "what-makes-a-brand-feel-seoul":
    "/images/articles/what-makes-a-brand-feel-seoul.png",
  "what-to-buy-at-olive-young":
    "/images/articles/what-to-buy-at-olive-young.png",
  "what-to-buy-korean-skincare-skin-type":
    "/images/articles/what-to-buy-korean-skincare-skin-type.jpg",
  "where-to-shop-k-beauty-beyond-olive-young":
    "/images/articles/where-to-shop-k-beauty-beyond-olive-young.png",
  "sunscreen-as-skincare-korean-routine":
    "/images/articles/sunscreen-as-skincare-korean-routine.png",
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
  return (
    (data as PostRow[] | null)
      ?.map(mapPostRow)
      .filter((post) => isPostPublic(post.slug)) ?? []
  );
}

export const getPostBySlug = cache(
  async (slug: string): Promise<Post | null> => {
    if (!isPostPublic(slug)) return null;

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
