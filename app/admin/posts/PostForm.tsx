"use client";

import { useFormState } from "react-dom";
import { savePost } from "@/app/admin/actions/posts";
import { INITIAL_STATE } from "@/app/admin/actions/state";
import type { AdminPost } from "@/services/admin/types";
import { POST_CATEGORIES } from "@/lib/admin/enums";
import { TextField } from "@/components/admin/TextField";
import { TextAreaField } from "@/components/admin/TextAreaField";
import { SelectField } from "@/components/admin/SelectField";
import { UrlField } from "@/components/admin/UrlField";
import { SlugField } from "@/components/admin/SlugField";
import { TagsField } from "@/components/admin/TagsField";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { StatusField } from "@/components/admin/StatusField";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormError } from "@/components/admin/FormError";

export function PostForm({ post }: { post?: AdminPost }) {
  const [state, action] = useFormState(savePost, INITIAL_STATE);
  const e = state?.errors ?? {};

  return (
    <form action={action} className="max-w-3xl">
      {post && <input type="hidden" name="id" value={post.id} />}
      {/* Round-trip the original publish timestamp so editing a published
          post never resets published_at (the service only stamps it when
          publishedAt is empty). */}
      {post && (
        <input
          type="hidden"
          name="publishedAt"
          value={post.publishedAt ?? ""}
        />
      )}
      <TextField
        name="title"
        label="Title"
        defaultValue={post?.title}
        error={e.title}
        required
      />
      <SlugField sourceId="title" defaultValue={post?.slug} error={e.slug} />
      <TextField
        name="subtitle"
        label="Subtitle"
        defaultValue={post?.subtitle}
      />
      <TextAreaField
        name="excerpt"
        label="Excerpt"
        defaultValue={post?.excerpt}
      />
      <SelectField
        name="category"
        label="Category"
        options={POST_CATEGORIES}
        defaultValue={post?.category}
        error={e.category}
      />
      <TagsField name="tags" label="Tags" defaultValue={post?.tags} />
      <UrlField
        name="featuredImage"
        label="Featured image URL"
        defaultValue={post?.featuredImage}
        error={e.featuredImage}
      />
      <TextField name="author" label="Author" defaultValue={post?.author} />
      <MarkdownField
        name="body"
        label="Body (Markdown)"
        defaultValue={post?.body}
      />
      <TextField
        name="seoTitle"
        label="SEO title"
        defaultValue={post?.seoTitle}
      />
      <TextAreaField
        name="metaDescription"
        label="Meta description"
        defaultValue={post?.metaDescription}
      />
      <StatusField defaultValue={post?.status} error={e.status} />

      {state?.formError && <FormError message={state.formError} />}
      <div className="mt-4">
        <SubmitButton>{post ? "Save changes" : "Create post"}</SubmitButton>
      </div>
    </form>
  );
}
