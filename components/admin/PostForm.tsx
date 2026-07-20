"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { POST_CATEGORIES, POST_STATUSES } from "@/lib/taxonomy";
import type { AdminPost } from "@/services/admin/posts";
import {
  createPostAction,
  updatePostAction,
  deletePostAction,
  type FormState,
} from "@/app/admin/posts/actions";
import {
  TextField,
  UrlField,
  TextArea,
  ListField,
  SelectField,
} from "./fields";

export function PostForm({
  mode,
  post,
}: {
  mode: "create" | "edit";
  post?: AdminPost;
}) {
  const action =
    mode === "edit" && post
      ? updatePostAction.bind(null, post.id)
      : createPostAction;
  const [state, formAction] = useFormState(action, { ok: true } as FormState);
  const e = state.errors ?? {};

  return (
    <div className="max-w-2xl">
      {state.formError && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.formError}
        </p>
      )}
      <form action={formAction} className="grid gap-5">
        <TextField
          label="Title"
          name="title"
          defaultValue={post?.title}
          error={e.title}
        />
        <TextField
          label="Slug"
          name="slug"
          defaultValue={post?.slug}
          readOnly={mode === "edit"}
          error={e.slug}
        />
        <TextField
          label="Subtitle"
          name="subtitle"
          defaultValue={post?.subtitle ?? ""}
        />
        <TextArea
          label="Excerpt"
          name="excerpt"
          defaultValue={post?.excerpt ?? ""}
        />
        <SelectField
          label="Category"
          name="category"
          defaultValue={post?.category ?? "beauty"}
          options={POST_CATEGORIES}
          error={e.category}
        />
        <ListField label="Tags" name="tags" defaultValue={post?.tags} />
        <UrlField
          label="Featured image"
          name="featuredImage"
          defaultValue={post?.featuredImage ?? ""}
          error={e.featuredImage}
        />
        <TextField
          label="Author"
          name="author"
          defaultValue={post?.author ?? ""}
        />
        <TextArea
          label="Body"
          name="body"
          rows={12}
          defaultValue={post?.body ?? ""}
        />
        <TextField
          label="SEO title"
          name="seoTitle"
          defaultValue={post?.seoTitle ?? ""}
        />
        <TextArea
          label="Meta description"
          name="metaDescription"
          defaultValue={post?.metaDescription ?? ""}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={post?.status ?? "draft"}
          options={POST_STATUSES}
          error={e.status}
        />
        <input
          type="hidden"
          name="publishedAt"
          defaultValue={post?.publishedAt ?? ""}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded bg-text px-4 py-2 text-sm text-bg hover:opacity-90"
          >
            {mode === "create" ? "Create post" : "Save changes"}
          </button>
          <Link
            href="/admin/posts"
            className="text-sm text-text-muted hover:text-text"
          >
            Cancel
          </Link>
        </div>
      </form>

      {mode === "edit" && post && (
        <form
          action={deletePostAction.bind(null, post.id)}
          className="mt-8 border-t border-soft-gray pt-6"
          onSubmit={(ev) => {
            if (!confirm("Delete this post? This cannot be undone.")) {
              ev.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete post
          </button>
        </form>
      )}
    </div>
  );
}
