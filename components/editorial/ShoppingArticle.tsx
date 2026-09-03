import Link from "next/link";
import { Prose } from "@/components/editorial/Prose";
import { JsonLd } from "@/components/editorial/JsonLd";
import { ShareButtons } from "@/components/editorial/ShareButtons";
import { Breadcrumbs } from "@/components/editorial/Breadcrumbs";
import { ArticleViewTracker } from "@/components/analytics/ArticleViewTracker";
import { ShoppingCta } from "@/components/editorial/ShoppingCta";
import { TonalFrame } from "@/components/editorial/TonalFrame";
import { DaisoSeriesLink } from "@/components/editorial/DaisoSeriesLink";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import {
  shoppingArticleToPost,
  type ShoppingArticle as ShoppingArticleData,
} from "@/lib/articles/shopping";

export function ShoppingArticle({ article }: { article: ShoppingArticleData }) {
  const post = shoppingArticleToPost(article);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Stories", path: "/stories" },
    { name: "Shopping", path: "/stories/shopping" },
    { name: article.title, path: `/articles/${article.slug}` },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ArticleViewTracker slug={article.slug} category={article.category} />

      <article>
        <Breadcrumbs items={crumbs} />
        <Link
          href="/stories/shopping"
          className="text-xs uppercase tracking-widest text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
        >
          {article.series.displayName} · {article.series.number}
        </Link>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">
          {article.title}
        </h1>
        <p className="mt-3 text-xl text-text-muted">{article.dek}</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            By {article.author} ·{" "}
            <time dateTime={article.publishedAt}>
              {new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "UTC",
              }).format(new Date(article.publishedAt))}
            </time>
          </p>
          <ShareButtons
            path={`/articles/${article.slug}`}
            title={`${article.title} — A Drop of Seoul`}
            article={{ slug: article.slug, category: article.category }}
            align="right"
          />
        </div>

        <figure className="mt-8">
          <TonalFrame
            src={article.heroImage}
            alt={article.heroAlt}
            ratio="aspect-[16/10]"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            branded
          />
          <figcaption className="mt-2 text-center text-xs text-text-muted">
            The local logic of Daiso: solve something small, then discover
            something fun. Original editorial image by A Drop of Seoul.
          </figcaption>
        </figure>

        <div className="mt-8">
          <Prose
            markdown={article.body}
            anchors
            shoppingEdit={article.series.number === "02"}
          />
        </div>

        <ShoppingCta
          articleNumber={article.series.number}
          articleSlug={article.slug}
          series={article.series.name}
          category={article.category}
        />

        <footer className="mt-14 border-t border-soft-gray pt-8">
          <p className="text-[11px] uppercase tracking-label text-accent">
            {article.series.displayName}
          </p>
          <p className="mt-2 font-serif text-2xl">
            {article.series.descriptor}
          </p>
          {article.series.number === "02" && (
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-label text-text-muted">
                Start with the bigger picture
              </p>
              <DaisoSeriesLink
                articleNumber={article.series.number}
                articleSlug={article.slug}
              />
            </div>
          )}
          <p className="mt-4 text-sm italic text-text-muted">
            A Drop of Seoul looks beyond what’s trending to find what’s actually
            worth discovering.
          </p>
        </footer>
      </article>
    </main>
  );
}
