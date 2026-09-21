import Link from "next/link";
import type { Post } from "@/services/types";
import { SECTIONS } from "@/lib/taxonomy";
import {
  KEYWORDS,
  filterEditorialPosts,
  keywordsForPost,
} from "@/lib/editorial-taxonomy";
import { ArticleCard } from "./ArticleCard";
import { SectionHeading } from "./SectionHeading";
import { SectionTabs, type SectionTab } from "./SectionTabs";

export type ArchiveParams = {
  filter?: string;
  keyword?: string;
  q?: string;
  page?: string;
};

export function EditorialArchive({
  title,
  description,
  posts,
  basePath,
  section,
  topic,
  tabs,
  activeTab,
  searchParams = {},
}: {
  title: string;
  description: string;
  posts: Post[];
  basePath: string;
  section?: string;
  topic?: string;
  tabs?: readonly SectionTab[];
  activeTab?: string;
  searchParams?: ArchiveParams;
}) {
  const { keyword, q } = searchParams;
  const activeSection =
    section ??
    (SECTIONS.some((s) => s.slug === searchParams.filter)
      ? searchParams.filter
      : undefined);
  const scoped = filterEditorialPosts(posts, { section: activeSection, topic });
  const filtered = filterEditorialPosts(scoped, { keyword, q });
  const totalPages = Math.max(1, Math.ceil(filtered.length / 24));
  const page = Math.min(
    totalPages,
    Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1)
  );
  const visible = filtered.slice((page - 1) * 24, page * 24);
  const counts = new Map<string, number>();
  scoped.forEach((p) =>
    keywordsForPost(p).forEach((k) =>
      counts.set(k.key, (counts.get(k.key) ?? 0) + 1)
    )
  );
  const keywords = KEYWORDS.filter(
    (k) => (counts.get(k.key) ?? 0) >= 2 || k.key === keyword
  );
  const href = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({
      filter: section ? undefined : searchParams.filter,
      keyword,
      q,
      ...changes,
    }))
      if (value) params.set(key, value);
    return basePath + (params.size ? `?${params}` : "");
  };
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading
        title={title}
        eyebrow={
          section
            ? SECTIONS.find((s) => s.slug === section)?.label
            : "The Journal"
        }
        as="h1"
      />
      <p className="-mt-2 mb-8 max-w-2xl text-text-muted">{description}</p>
      {tabs && (
        <SectionTabs
          label={`${title} topics`}
          tabs={tabs}
          active={activeTab ?? "all"}
        />
      )}
      {!section && (
        <SectionTabs
          label="Story sections"
          active={activeSection ?? "all"}
          tabs={[
            { key: "all", label: "All", href: href({ filter: undefined }) },
            ...SECTIONS.map((s) => ({
              key: s.slug,
              label: s.label,
              href: href({ filter: s.slug }),
            })),
          ]}
        />
      )}
      <form action={basePath} className="mb-6 flex max-w-xl gap-2">
        {!section && activeSection && (
          <input type="hidden" name="filter" value={activeSection} />
        )}
        {keyword && <input type="hidden" name="keyword" value={keyword} />}
        <label htmlFor="story-search" className="sr-only">
          Search stories
        </label>
        <input
          id="story-search"
          name="q"
          defaultValue={q}
          placeholder="Search stories"
          className="min-w-0 flex-1 rounded border border-soft-gray bg-bg px-4 py-2 text-sm"
        />
        <button className="rounded border border-text px-4 py-2 text-sm hover:bg-text hover:text-bg">
          Search
        </button>
      </form>
      {keywords.length > 0 && (
        <details className="mb-8" open={Boolean(keyword)}>
          <summary className="cursor-pointer text-sm text-text-muted">
            Browse by keyword
            {keyword
              ? ` · ${KEYWORDS.find((k) => k.key === keyword)?.label ?? keyword}`
              : ""}
          </summary>
          <nav
            aria-label="Story keywords"
            className="mt-4 flex flex-wrap gap-2"
          >
            <Link
              href={href({ keyword: undefined })}
              className="rounded-full border border-soft-gray px-3 py-1.5 text-xs"
            >
              All keywords
            </Link>
            {keywords.map((k) => (
              <Link
                key={k.key}
                href={href({ keyword: k.key })}
                aria-current={keyword === k.key ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 text-xs ${keyword === k.key ? "border-text bg-text text-bg" : "border-soft-gray text-text-muted hover:border-accent"}`}
              >
                {k.label} · {counts.get(k.key) ?? 0}
              </Link>
            ))}
          </nav>
        </details>
      )}
      <p className="mb-6 text-xs text-text-muted">
        {filtered.length} {filtered.length === 1 ? "story" : "stories"} · Newest
        first
      </p>
      {visible.length ? (
        <div className="grid gap-8 md:grid-cols-3">
          {visible.map((p) => (
            <ArticleCard key={p.slug} post={p} />
          ))}
        </div>
      ) : (
        <p className="text-text-muted">
          No stories match this selection.{" "}
          <Link href={basePath} className="text-accent underline">
            Clear filters
          </Link>
        </p>
      )}
      {totalPages > 1 && (
        <nav
          aria-label="Story pages"
          className="mt-12 flex items-center justify-between text-sm"
        >
          {page > 1 ? (
            <Link href={href({ page: String(page - 1) })}>← Previous</Link>
          ) : (
            <span />
          )}
          <span>
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={href({ page: String(page + 1) })}>Next →</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
