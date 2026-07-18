import Link from "next/link";
import type { Post } from "@/services/types";
import { getArticleImageMeta } from "@/lib/article-images";
import { categoryLabel } from "@/lib/categories";
import { readingTime } from "@/lib/reading-time";
import { TonalFrame } from "./TonalFrame";

export function ArticleCard({ post }: { post: Post }) {
  const minutes = readingTime(post.body);
  const imageMeta = getArticleImageMeta(post.slug);
  return (
    <Link href={`/articles/${post.slug}`} className="group block">
      <TonalFrame
        src={post.featuredImage}
        alt={imageMeta?.alt ?? post.title}
        label={categoryLabel(post.category)}
        ratio="aspect-[3/2]"
        sizes="(max-width: 768px) 100vw, 33vw"
        branded
      />
      <div className="mt-4 flex items-center gap-2.5 text-[11px] uppercase tracking-label text-text-muted">
        <span>{categoryLabel(post.category)}</span>
        {minutes && (
          <>
            <span className="h-[3px] w-[3px] rounded-full bg-text/40" />
            <span>{minutes} min</span>
          </>
        )}
      </div>
      <h3 className="mt-2 font-serif text-2xl leading-snug transition-colors duration-medium ease-editorial group-hover:text-accent">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-2 text-sm text-text-muted line-clamp-2">
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}
