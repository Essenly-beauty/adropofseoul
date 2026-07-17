"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPost, updatePost, removePost } from "@/services/admin/posts";
import { validatePost } from "@/lib/admin/validate";
import type { PostInput } from "@/services/admin/types";
import { type FormState, orNull } from "./state";

function readPost(formData: FormData): PostInput {
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    subtitle: orNull(formData.get("subtitle")),
    excerpt: orNull(formData.get("excerpt")),
    body: orNull(formData.get("body")),
    category: String(formData.get("category") ?? "").trim(),
    tags,
    featuredImage: orNull(formData.get("featuredImage")),
    author: orNull(formData.get("author")),
    seoTitle: orNull(formData.get("seoTitle")),
    metaDescription: orNull(formData.get("metaDescription")),
    status: String(formData.get("status") ?? "draft").trim(),
    publishedAt: orNull(formData.get("publishedAt")),
  };
}

export async function savePost(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = orNull(formData.get("id"));
  const input = readPost(formData);

  const errors = validatePost(input);
  if (Object.keys(errors).length > 0) return { errors };

  const result = id ? await updatePost(id, input) : await createPost(input);

  if (!result.ok) {
    if (result.code === "23505") {
      return { errors: { slug: "That slug is already taken." } };
    }
    return { errors: {}, formError: "Could not save. Please try again." };
  }

  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function deletePost(id: string): Promise<void> {
  await removePost(id);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}
