import { ArticleKeywords } from "@/components/editorial/ArticleKeywords";
import {
  articleBreadcrumbs,
  topicForPost,
  sectionForPost,
} from "@/lib/editorial-taxonomy";
import Link from "next/link";
import { Prose } from "@/components/editorial/Prose";
import { JsonLd } from "@/components/editorial/JsonLd";
import { ShareButtons } from "@/components/editorial/ShareButtons";
import { Breadcrumbs } from "@/components/editorial/Breadcrumbs";
import { ArticleViewTracker } from "@/components/analytics/ArticleViewTracker";
import { ShoppingCta } from "@/components/editorial/ShoppingCta";
import { TonalFrame } from "@/components/editorial/TonalFrame";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import {
  shoppingArticleToPost,
  type ShoppingArticle as ShoppingArticleData,
} from "@/lib/articles/shopping";

export function ShoppingArticle({ article }: { article: ShoppingArticleData }) {
  const post = shoppingArticleToPost(article);
  const crumbs = articleBreadcrumbs(post);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ArticleViewTracker slug={article.slug} category={article.category} />

      <article>
        <Breadcrumbs items={crumbs} />
        <Link
          href={topicForPost(post).href}
          className="text-xs uppercase tracking-widest text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
        >
          {sectionForPost(post).label} · {topicForPost(post).label}
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
            shoppingEdit={article.slug === "daiso-korea-must-buys"}
          />
        </div>

        <ShoppingCta
          articleNumber={article.trackingNumber}
          articleSlug={article.slug}
          series="Daiso"
          category={article.category}
        />

        <ArticleKeywords post={post} />
      </article>
    </main>
  );
}
