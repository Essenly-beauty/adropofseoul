import Link from "next/link";
import type { Post } from "@/services/types";
import { keywordHref, keywordsForPost } from "@/lib/editorial-taxonomy";

export function ArticleKeywords({ post }: { post: Post }) {
  const keywords = keywordsForPost(post);
  if (!keywords.length) return null;
  return (
    <nav
      aria-label="Related topics"
      className="mt-8 flex flex-wrap items-center gap-2 border-t border-soft-gray pt-5"
    >
      <span className="mr-2 text-xs text-text-muted">More on</span>
      {keywords.map((k) => (
        <Link
          key={k.key}
          href={keywordHref(k.key)}
          className="rounded-full border border-soft-gray px-3 py-1.5 text-xs text-text-muted hover:border-accent hover:text-accent"
        >
          {k.label}
        </Link>
      ))}
    </nav>
  );
}
