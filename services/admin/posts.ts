import { createClient } from "@/lib/supabase/server";
import { mapPostRow } from "@/services/posts";
import type { Post } from "@/services/types";
import type { PostWriteInput } from "@/lib/admin/posts";

export type AdminPost = Post & { status: string; updatedAt: string };

const COLUMNS =
  "id,title,slug,subtitle,excerpt,body,category,tags,featured_image,author,seo_title,meta_description,status,published_at,updated_at";

type RowWithStatus = Parameters<typeof mapPostRow>[0] & {
  status: string;
  updated_at: string;
};

function mapAdmin(row: RowWithStatus): AdminPost {
  return { ...mapPostRow(row), status: row.status, updatedAt: row.updated_at };
}

export function toRow(input: PostWriteInput, opts: { includeSlug: boolean }) {
  const row: Record<string, unknown> = {
    title: input.title,
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
    published_at:
      input.status === "published" && !input.publishedAt
        ? new Date().toISOString()
        : input.publishedAt,
  };
  if (opts.includeSlug) row.slug = input.slug;
  return row;
}

export async function listAllPosts(): Promise<AdminPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as RowWithStatus[] | null)?.map(mapAdmin) ?? [];
}

export async function getAdminPostById(id: string): Promise<AdminPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdmin(data as RowWithStatus) : null;
}

export async function createPost(
  input: PostWriteInput
): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert(toRow(input, { includeSlug: true }))
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

export async function updatePost(
  id: string,
  input: PostWriteInput
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update(toRow(input, { includeSlug: false }))
    .eq("id", id);
  if (error) throw error;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}
