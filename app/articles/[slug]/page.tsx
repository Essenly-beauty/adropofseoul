import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import {
  DiscoveryPlaceCard,
  GuideCard,
} from "@/components/editorial/DiscoveryCards";
import { NewsletterForm } from "@/components/editorial/NewsletterForm";
import { Prose } from "@/components/editorial/Prose";
import { JsonLd } from "@/components/editorial/JsonLd";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { TonalFrame } from "@/components/editorial/TonalFrame";
import { getArticleImageMeta } from "@/lib/article-images";
import { GUIDES, PLACES } from "@/lib/discovery";
import { readingTime } from "@/lib/reading-time";
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
      images: post.featuredImage ? [canonical(post.featuredImage)] : undefined,
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
  const imageMeta = getArticleImageMeta(post.slug);
  const minutes = readingTime(post.body);
  const headings = extractHeadings(post.body);
  const keyTakeaways = buildKeyTakeaways(post);
  let relatedPosts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    relatedPosts = (
      await listPublishedPosts({ limit: 6, category: post.category })
    ).filter((candidate) => candidate.slug !== post.slug);
  } catch (err) {
    console.error("article: related posts fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Stories", path: "/articles" },
          { name: post.title, path: `/articles/${post.slug}` },
        ])}
      />
      <article className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">
          {post.category.replace(/_/g, " ")}
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">{post.title}</h1>
        {post.subtitle && (
          <p className="mt-3 text-xl text-text-muted">{post.subtitle}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
          {post.author && <span>By {post.author}</span>}
          {post.publishedAt && (
            <span>Published {formatDate(post.publishedAt)}</span>
          )}
          {post.publishedAt && (
            <span>Updated {formatDate(post.publishedAt)}</span>
          )}
          {minutes && <span>{minutes} min read</span>}
        </div>
        {post.featuredImage && (
          <figure className="mt-8">
            <TonalFrame
              src={post.featuredImage}
              alt={imageMeta?.alt ?? post.title}
              ratio="aspect-[16/10]"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              branded
            />
            {imageMeta && (
              <figcaption className="mt-3 text-xs leading-relaxed text-text-muted">
                {imageMeta.caption} Photo by{" "}
                <a
                  href={imageMeta.creditUrl}
                  className="text-accent"
                  rel="noreferrer"
                  target="_blank"
                >
                  {imageMeta.creditName}
                </a>{" "}
                via{" "}
                <a
                  href={imageMeta.licenseUrl}
                  className="text-accent"
                  rel="noreferrer"
                  target="_blank"
                >
                  {imageMeta.licenseName}
                </a>
                .
              </figcaption>
            )}
          </figure>
        )}

        {headings.length >= 4 && (
          <nav
            aria-label="Table of contents"
            className="mt-8 border-y border-soft-gray py-5"
          >
            <p className="text-[11px] uppercase tracking-label text-accent">
              In this story
            </p>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              {headings.map((heading) => (
                <li key={heading}>- {heading}</li>
              ))}
            </ul>
          </nav>
        )}

        {keyTakeaways.length > 0 && (
          <section className="mt-8 border-y border-soft-gray py-5">
            <h2 className="font-serif text-2xl">Key takeaways</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-text-muted">
              {keyTakeaways.map((takeaway) => (
                <li key={takeaway}>- {takeaway}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
          {post.body ? (
            <Prose markdown={post.body} />
          ) : (
            <p className="text-text-muted">{post.excerpt}</p>
          )}
        </div>
      </article>

      <section className="mx-auto mt-16 max-w-3xl border-y border-soft-gray py-10 text-center">
        <h2 className="font-serif text-3xl">Beauty notes worth keeping</h2>
        <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-6 text-text-muted">
          A few considered emails on Korean beauty, places, and products worth
          knowing. No noise.
        </p>
        <NewsletterForm />
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-3">
        <div>
          <SectionHeading title="Related places" eyebrow="Directory" />
          <div className="space-y-8">
            {PLACES.slice(0, 2).map((place) => (
              <DiscoveryPlaceCard key={place.slug} place={place} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeading title="Related guides" eyebrow="Plan" />
          <div className="space-y-8">
            {GUIDES.slice(0, 2).map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </div>
        {relatedPosts.length > 0 && (
          <div>
            <SectionHeading title="Related stories" eyebrow="Read next" />
            <div className="space-y-8">
              {relatedPosts.slice(0, 2).map((relatedPost) => (
                <ArticleCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function extractHeadings(markdown: string | null): string[] {
  if (!markdown) return [];
  return markdown
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^##\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function buildKeyTakeaways(post: Awaited<ReturnType<typeof getPostBySlug>>) {
  if (!post) return [];
  return [
    post.excerpt ?? post.subtitle ?? undefined,
    post.tags.length > 0
      ? `Best context: ${post.tags.slice(0, 3).join(", ")}.`
      : undefined,
    "Use this as a starting point, then verify products, places, and treatment details before booking or buying.",
  ].filter((item): item is string => Boolean(item));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
