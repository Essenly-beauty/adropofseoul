import Link from "next/link";
import type { Post } from "@/services/types";
import { categoryLabel } from "@/lib/categories";
import { readingTime } from "@/lib/reading-time";
import { TonalFrame } from "./TonalFrame";

export function FeaturedStory({ post }: { post: Post }) {
  const minutes = readingTime(post.body);
  return (
    <article className="group grid items-center gap-8 md:grid-cols-[1.15fr_1fr] md:gap-16">
      <Link
        href={`/articles/${post.slug}`}
        className="block"
        aria-hidden
        tabIndex={-1}
      >
        <TonalFrame
          src={post.featuredImage}
          alt={post.title}
          label={categoryLabel(post.category)}
          ratio="aspect-[5/6]"
          sizes="(max-width: 768px) 100vw, 55vw"
          priority
          branded
        />
      </Link>
      <div>
        <div className="mb-4 flex items-center gap-3.5">
          <span className="rounded-full border border-soft-gray px-3 py-1.5 text-[11px] uppercase tracking-label">
            {categoryLabel(post.category)}
          </span>
          {minutes && (
            <span className="text-[11px] uppercase tracking-label text-text-muted">
              {minutes} min read
            </span>
          )}
        </div>
        <h3 className="font-serif text-4xl leading-[1.06] tracking-tight md:text-5xl">
          <Link
            href={`/articles/${post.slug}`}
            className="transition-colors duration-medium ease-editorial group-hover:text-accent"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="mt-4 max-w-[42ch] text-base text-text-muted">
            {post.excerpt}
          </p>
        )}
        <Link
          href={`/articles/${post.slug}`}
          className="mt-6 inline-block border-b border-transparent pb-1 text-[12.5px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
        >
          Read the story →
        </Link>
      </div>
    </article>
  );
}
