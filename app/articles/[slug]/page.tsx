import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, listPublishedPosts } from "@/services/posts";
import type { Post } from "@/services/types";
import { sectionForCategory } from "@/lib/taxonomy";
import { Prose } from "@/components/editorial/Prose";
import { JsonLd } from "@/components/editorial/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { getGuide } from "@/lib/seongsu/guides";
import { resolveHeroImage } from "@/lib/seongsu/assets";
import { SeongsuGuide } from "@/components/seongsu/SeongsuGuide";
import { getPillar } from "@/lib/articles/pillars";
import { resolvePillarHero } from "@/lib/articles/assets";
import { PillarArticle } from "@/components/editorial/PillarArticle";
import { ShareButtons } from "@/components/editorial/ShareButtons";
import { TonalFrame } from "@/components/editorial/TonalFrame";
import { getArticleImageMeta } from "@/lib/article-images";
import { Breadcrumbs } from "@/components/editorial/Breadcrumbs";
import { ArticleViewTracker } from "@/components/analytics/ArticleViewTracker";
import { RelatedArticles } from "@/components/editorial/RelatedArticles";
import { rankRelatedPosts } from "@/lib/related-posts";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // Code-defined Seongsu guides take priority over DB posts.
  const guide = getGuide(params.slug);
  if (guide) {
    const hero = resolveHeroImage(guide);
    return buildPageMetadata({
      title: guide.seoTitle.replace(/\s*\|\s*A Drop of Seoul$/, ""),
      description: guide.metaDescription,
      path: `/articles/${guide.slug}`,
      image: hero,
      type: "article",
      publishedTime: guide.publishedAt,
      authors: [guide.author],
    });
  }

  // Code-defined pillar (hub) articles.
  const pillar = getPillar(params.slug);
  if (pillar) {
    const hero = resolvePillarHero(pillar);
    return buildPageMetadata({
      title: pillar.seoTitle,
      description: pillar.metaDescription,
      path: `/articles/${pillar.slug}`,
      image: hero,
      type: "article",
      publishedTime: pillar.publishedAt,
      authors: [pillar.author],
    });
  }

  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Not found" };
  const description =
    post.metaDescription ?? post.excerpt ?? post.subtitle ?? post.title;
  return buildPageMetadata({
    title: post.seoTitle ?? post.title,
    description,
    path: `/articles/${post.slug}`,
    image: post.featuredImage,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt ?? post.publishedAt,
    authors: post.author ? [post.author] : undefined,
    tags: post.tags,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const guide = getGuide(params.slug);
  if (guide) return <SeongsuGuide guide={guide} />;

  const pillar = getPillar(params.slug);
  if (pillar) return <PillarArticle pillar={pillar} />;

  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const section = sectionForCategory(post.category);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: section.label, path: section.href },
    { name: post.title, path: `/articles/${post.slug}` },
  ];
  let related: Post[] = [];
  try {
    related = rankRelatedPosts(
      post,
      await listPublishedPosts({ limit: 48 }),
      3
    );
  } catch (err) {
    console.error("article: related posts fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ArticleViewTracker slug={post.slug} category={post.category} />
      <article>
        <Breadcrumbs items={crumbs} />
        <Link
          href={section.href}
          className="text-xs uppercase tracking-widest text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
        >
          {section.label}
        </Link>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">{post.title}</h1>
        {post.subtitle && (
          <p className="mt-3 text-xl text-text-muted">{post.subtitle}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-4">
          {post.author || post.publishedAt ? (
            <p className="text-sm text-text-muted">
              {post.author && <>By {post.author}</>}
              {post.author && post.publishedAt && " · "}
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>
                  {new Intl.DateTimeFormat("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(post.publishedAt))}
                </time>
              )}
            </p>
          ) : (
            <span aria-hidden />
          )}
          <ShareButtons
            path={`/articles/${post.slug}`}
            title={`${post.title} — A Drop of Seoul`}
            article={{ slug: post.slug, category: post.category }}
            imageUrl={
              post.featuredImage && /^https?:\/\//.test(post.featuredImage)
                ? post.featuredImage
                : undefined
            }
            align="right"
          />
        </div>
        {post.featuredImage &&
          (() => {
            const imageMeta = getArticleImageMeta(post.slug);
            return (
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
                  <figcaption className="mt-2 text-center text-xs text-text-muted">
                    {imageMeta.caption}{" "}
                    <span className="whitespace-nowrap">
                      Photo:{" "}
                      <a
                        href={imageMeta.creditUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-soft-gray underline-offset-2 hover:text-accent"
                      >
                        {imageMeta.creditName}
                      </a>{" "}
                      (
                      <a
                        href={imageMeta.licenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-soft-gray underline-offset-2 hover:text-accent"
                      >
                        {imageMeta.licenseName}
                      </a>
                      )
                    </span>
                  </figcaption>
                )}
              </figure>
            );
          })()}
        <div className="mt-8">
          {post.body ? (
            <Prose markdown={post.body} />
          ) : (
            <p className="text-text-muted">{post.excerpt}</p>
          )}
        </div>
      </article>
      <RelatedArticles source={post} posts={related} />
    </main>
  );
}
