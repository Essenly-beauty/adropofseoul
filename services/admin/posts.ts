import { createClient } from "@/lib/supabase/server";
import type { AdminPost, PostInput, WriteResult, Counts } from "./types";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string;
  tags: string[] | null;
  featured_image: string | null;
  author: string | null;
  seo_title: string | null;
  meta_description: string | null;
  status: string;
  published_at: string | null;
  updated_at: string;
};

const COLUMNS =
  "id,title,slug,subtitle,excerpt,body,category,tags,featured_image,author,seo_title,meta_description,status,published_at,updated_at";

export function mapAdminPostRow(row: PostRow): AdminPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category,
    tags: row.tags ?? [],
    featuredImage: row.featured_image,
    author: row.author,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: PostInput) {
  const publishedAt =
    input.status === "published" && !input.publishedAt
      ? new Date().toISOString()
      : input.publishedAt;
  return {
    title: input.title,
    slug: input.slug,
    subtitle: input.subtitle,
    excerpt: input.excerpt,
    body: input.body,
    category: input.category,
    tags: input.tags,
    featured_image: input.featuredImage,
    author: input.author,
    seo_title: input.seoTitle,
    meta_description: input.metaDescription,
    status: input.status,
    published_at: publishedAt,
  };
}

export async function listAllPosts(): Promise<AdminPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as PostRow[] | null)?.map(mapAdminPostRow) ?? [];
}

export async function getPostById(id: string): Promise<AdminPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdminPostRow(data as PostRow) : null;
}

export async function createPost(input: PostInput): Promise<WriteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

export async function updatePost(
  id: string,
  input: PostInput
): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update(toRow(input))
    .eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function removePost(id: string): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function postCounts(): Promise<Counts> {
  const supabase = await createClient();
  const total = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });
  const live = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  const t = total.count ?? 0;
  const l = live.count ?? 0;
  return { total: t, live: l, hidden: t - l };
}
