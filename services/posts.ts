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
  "myeongdong-vs-seongsu-beauty-shopping":
    "/images/articles/myeongdong-vs-seongsu-beauty-shopping.png",
  "olive-young-shopping-guide":
    "/images/articles/olive-young-shopping-guide.jpg",
  "what-to-buy-korean-skincare-skin-type":
    "/images/articles/what-to-buy-korean-skincare-skin-type.jpg",
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
    featuredImage:
      row.featured_image || LOCAL_FEATURED_IMAGES[row.slug] || null,
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
