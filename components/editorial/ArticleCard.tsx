import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/services/types";

export function ArticleCard({ post }: { post: Post }) {
  return (
    <Link href={`/articles/${post.slug}`} className="group block">
      {post.featuredImage && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-soft-gray">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-medium group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <h3 className="mt-4 font-serif text-xl group-hover:text-accent">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-1 text-sm text-text-muted line-clamp-2">
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}
