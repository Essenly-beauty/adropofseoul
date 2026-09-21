import { createClient } from "@/lib/supabase/public";

/** Public URL inventory: no session cookies, article bodies, or image payloads. */
export async function listSitemapContent() {
  const client = createClient();
  const [posts, places, ingredients] = await Promise.all([
    client
      .from("posts")
      .select("slug,published_at,updated_at")
      .eq("status", "published")
      .order("slug")
      .limit(1000),
    client
      .from("places")
      .select("slug")
      .eq("is_published", true)
      .order("slug")
      .limit(1000),
    client
      .from("ingredients")
      .select("slug")
      .eq("status", "published")
      .order("slug")
      .limit(1000),
  ]);
  for (const result of [posts, places, ingredients]) {
    if (result.error) throw result.error;
  }
  return {
    posts: (posts.data ?? []).map((p) => ({
      slug: p.slug as string,
      publishedAt: p.published_at as string | null,
      updatedAt: p.updated_at as string | null,
    })),
    places: (places.data ?? []) as { slug: string }[],
    ingredients: (ingredients.data ?? []) as { slug: string }[],
  };
}
