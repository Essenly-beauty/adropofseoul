import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/services/posts";
import { Prose } from "@/components/editorial/Prose";
import { JsonLd } from "@/components/editorial/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, canonical } from "@/lib/seo";
import { getGuide } from "@/lib/seongsu/guides";
import { resolveHeroImage } from "@/lib/seongsu/assets";
import { SeongsuGuide } from "@/components/seongsu/SeongsuGuide";
import { getPillar } from "@/lib/articles/pillars";
import { resolvePillarHero } from "@/lib/articles/assets";
import { PillarArticle } from "@/components/editorial/PillarArticle";
import { ShareButtons } from "@/components/editorial/ShareButtons";
import { TonalFrame } from "@/components/editorial/TonalFrame";
import { getArticleImageMeta } from "@/lib/article-images";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // Code-defined Seongsu guides take priority over DB posts.
  const guide = getGuide(params.slug);
  if (guide) {
    const hero = resolveHeroImage(guide);
    const ogImages = hero ? [canonical(hero)] : undefined;
    return {
      title: guide.seoTitle,
      description: guide.metaDescription,
      alternates: { canonical: canonical(`/articles/${guide.slug}`) },
      openGraph: {
        title: guide.title,
        description: guide.metaDescription,
        type: "article",
        url: canonical(`/articles/${guide.slug}`),
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title: guide.title,
        description: guide.metaDescription,
        images: ogImages,
      },
    };
  }

  // Code-defined pillar (hub) articles.
  const pillar = getPillar(params.slug);
  if (pillar) {
    const hero = resolvePillarHero(pillar);
    const ogImages = hero ? [canonical(hero)] : undefined;
    return {
      title: pillar.seoTitle,
      description: pillar.metaDescription,
      alternates: { canonical: canonical(`/articles/${pillar.slug}`) },
      openGraph: {
        title: pillar.ogTitle,
        description: pillar.ogDescription,
        type: "article",
        url: canonical(`/articles/${pillar.slug}`),
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title: pillar.ogTitle,
        description: pillar.ogDescription,
        images: ogImages,
      },
    };
  }

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
  const guide = getGuide(params.slug);
  if (guide) return <SeongsuGuide guide={guide} />;

  const pillar = getPillar(params.slug);
  if (pillar) return <PillarArticle pillar={pillar} />;

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
        <div className="mt-4 flex items-center justify-between gap-4">
          {post.author ? (
            <p className="text-sm text-text-muted">By {post.author}</p>
          ) : (
            <span aria-hidden />
          )}
          <ShareButtons
            path={`/articles/${post.slug}`}
            title={`${post.title} — A Drop of Seoul`}
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
    </main>
  );
}
