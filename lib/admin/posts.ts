import { EDITORIAL_TOPICS, KEYWORDS } from "@/lib/editorial-taxonomy";
import { slugify } from "@/lib/slug";
import { POST_CATEGORIES, POST_STATUSES } from "@/lib/taxonomy";

export type PostWriteInput = {
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string;
  tags: string[];
  featuredImage: string | null;
  author: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  status: string;
  publishedAt: string | null;
};

export type ParseResult =
  | { ok: true; value: PostWriteInput }
  | { ok: false; errors: Record<string, string> };

const URL_FIELDS = ["featuredImage"] as const;

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function nullable(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

function lines(fd: FormData, key: string): string[] {
  return String(fd.get(key) ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function parsePostForm(
  fd: FormData,
  opts: { mode: "create" | "edit" }
): ParseResult {
  const errors: Record<string, string> = {};

  const title = str(fd, "title");
  if (!title) errors.title = "Title is required.";

  const category = str(fd, "category");
  if (!POST_CATEGORIES.some((c) => c.value === category)) {
    errors.category = "Pick a category.";
  }

  const editorialTopic = str(fd, "editorialTopic");
  if (editorialTopic && !EDITORIAL_TOPICS.some((t) => t.key === editorialTopic))
    errors.editorialTopic = "Pick an editorial home.";
  const keywordSelection = fd.getAll("editorialKeywords").map(String);
  if (keywordSelection.some((k) => !KEYWORDS.some((known) => known.key === k)))
    errors.editorialKeywords = "Pick known keywords.";
  let tags = lines(fd, "tags");
  if (editorialTopic)
    tags = [
      ...tags.filter((t) => !t.startsWith("topic:")),
      `topic:${editorialTopic}`,
    ];
  if (str(fd, "keywordsProvided") === "true")
    tags = [
      ...tags.filter((t) => !/^(keyword:|keywords:)/.test(t)),
      "keywords:manual",
      ...keywordSelection.map((k) => `keyword:${k}`),
    ];
  tags = Array.from(new Set(tags));

  const statusRaw = str(fd, "status");
  const status = statusRaw || "draft";
  if (!POST_STATUSES.some((s) => s.value === status)) {
    errors.status = "Pick a status.";
  }

  // slug: create derives from provided slug or title; edit keeps existing (the
  // update service never writes slug), so a placeholder is fine here.
  const slugSource = str(fd, "slug") || title;
  const slug = slugify(slugSource);
  if (opts.mode === "create" && !slug) {
    errors.slug = "Could not derive a slug from the title.";
  }

  const urls: Record<string, string | null> = {};
  for (const key of URL_FIELDS) {
    const v = nullable(fd, key);
    if (v && !/^https?:\/\//i.test(v)) {
      errors[key] = "Must start with http:// or https://";
    }
    urls[key] = v;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      title,
      slug,
      subtitle: nullable(fd, "subtitle"),
      excerpt: nullable(fd, "excerpt"),
      body: nullable(fd, "body"),
      category,
      tags,
      featuredImage: urls.featuredImage,
      author: nullable(fd, "author"),
      seoTitle: nullable(fd, "seoTitle"),
      metaDescription: nullable(fd, "metaDescription"),
      status,
      publishedAt: nullable(fd, "publishedAt"),
    },
  };
}
