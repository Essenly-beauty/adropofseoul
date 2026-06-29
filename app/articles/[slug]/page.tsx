import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/services/posts";
import { Prose } from "@/components/editorial/Prose";
import { JsonLd } from "@/components/editorial/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, canonical } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: canonical(`/articles/${post.slug}`) },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Stories", path: "/articles" },
          { name: post.title, path: `/articles/${post.slug}` },
        ])}
      />
      <article>
        <p className="text-xs uppercase tracking-widest text-accent">
          {post.category.replace(/_/g, " ")}
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">{post.title}</h1>
        {post.subtitle && (
          <p className="mt-3 text-xl text-text-muted">{post.subtitle}</p>
        )}
        {post.author && (
          <p className="mt-4 text-sm text-text-muted">By {post.author}</p>
        )}
        <div className="mt-8">
          {post.body ? (
            <Prose markdown={post.body} />
          ) : (
            <p className="text-text-muted">{post.excerpt}</p>
          )}
        </div>
      </article>
    </main>
  );
}
