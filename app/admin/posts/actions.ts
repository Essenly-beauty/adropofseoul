"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";
import { parsePostForm } from "@/lib/admin/posts";
import { createPost, updatePost, deletePost } from "@/services/admin/posts";

export type FormState = {
  ok: boolean;
  errors?: Record<string, string>;
  formError?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAllowedAdmin(user?.email)) redirect("/admin/login");
}

function revalidatePosts() {
  revalidatePath("/admin/posts");
  revalidatePath("/", "layout");
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

export async function createPostAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePostForm(formData, { mode: "create" });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  try {
    await createPost(parsed.value);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { slug: "That slug already exists." } };
    }
    return { ok: false, formError: "Could not save. Please try again." };
  }
  revalidatePosts();
  redirect("/admin/posts?created=1");
}

export async function updatePostAction(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePostForm(formData, { mode: "edit" });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  try {
    await updatePost(id, parsed.value);
  } catch {
    return { ok: false, formError: "Could not save. Please try again." };
  }
  revalidatePosts();
  redirect("/admin/posts?updated=1");
}

export async function deletePostAction(id: string): Promise<void> {
  await requireAdmin();
  await deletePost(id);
  revalidatePosts();
  redirect("/admin/posts?deleted=1");
}
