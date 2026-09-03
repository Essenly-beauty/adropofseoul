import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Post } from "@/services/types";

export type ShoppingArticle = {
  slug: string;
  category: "shopping";
  title: string;
  dek: string;
  seoTitle: string;
  metaDescription: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  heroImage: string | null;
  heroAlt: string;
  series: {
    name: string;
    displayName: string;
    number: string;
    descriptor: string;
  };
  body: string;
};

function articleBody(filename: string): string {
  const source = readFileSync(
    join(process.cwd(), "content", "articles", filename),
    "utf8"
  );
  const match = source.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter in ${filename}`);
  return match[1].trim();
}

export const SHOPPING_ARTICLES: ShoppingArticle[] = [
  {
    slug: "daiso-korea-guide",
    category: "shopping",
    title: "Daiso Korea: A Local’s Guide to Shopping Like a Korean",
    dek: "From ₩1,000 K-beauty finds and tiny Korean souvenirs to the everyday things you suddenly need while traveling, here’s how to shop Daiso Korea like a local.",
    seoTitle: "Daiso Korea Guide: What to Buy & How Locals Shop",
    metaDescription:
      "A local guide to Daiso Korea: what Koreans actually buy, the rise of Daiso beauty, souvenirs worth packing, and how to shop Daiso in Seoul.",
    author: "A Drop of Seoul Editorial",
    publishedAt: "2026-08-31",
    excerpt:
      "From ₩1,000 K-beauty to everyday travel fixes, here’s what Daiso means in Korea — and how to shop it like a local.",
    heroImage: "/images/articles/daiso-korea-guide/hero-v2.png",
    heroAlt:
      "Editorial illustration representing a Daiso Korea shopping basket and familiar low price points",
    series: {
      name: "The Daiso Edit",
      displayName: "THE DAISO EDIT",
      number: "01",
      descriptor:
        "A local look at what’s actually worth buying at Daiso Korea.",
    },
    body: articleBody("daiso-korea-guide.md"),
  },
  {
    slug: "daiso-korea-must-buys",
    category: "shopping",
    title: "20 Things Actually Worth Buying at Daiso Korea",
    dek: "Beauty, travel fixes, small gifts and genuinely useful finds — chosen not because they’re cheap, but because they’re actually worth making room for.",
    seoTitle: "20 Best Daiso Korea Must-Buys (2026)",
    metaDescription:
      "What should you actually buy at Daiso Korea? A local edit of 20 beauty, travel, souvenir and everyday finds that are genuinely worth the suitcase space.",
    author: "A Drop of Seoul Editorial",
    publishedAt: "2026-09-02",
    excerpt:
      "Beauty, travel fixes, small gifts and genuinely useful finds — chosen for what’s actually worth the suitcase space.",
    heroImage: "/images/articles/daiso-korea-guide/hero-v2.png",
    heroAlt:
      "Editorial illustration of useful beauty, travel and souvenir finds from Daiso Korea",
    series: {
      name: "The Daiso Edit",
      displayName: "THE DAISO EDIT",
      number: "02",
      descriptor:
        "A local look at what’s actually worth buying at Daiso Korea.",
    },
    body: articleBody("daiso-korea-must-buys.md"),
  },
];

export const SHOPPING_ARTICLE_SLUGS = SHOPPING_ARTICLES.map(
  (article) => article.slug
);

export function getShoppingArticle(slug: string): ShoppingArticle | undefined {
  return SHOPPING_ARTICLES.find((article) => article.slug === slug);
}

export function shoppingArticleToPost(article: ShoppingArticle): Post {
  return {
    id: `shopping-${article.slug}`,
    title: article.title,
    slug: article.slug,
    subtitle: article.dek,
    excerpt: article.excerpt,
    body: article.body,
    category: article.category,
    tags: ["shopping", "daiso korea", "daiso seoul", "k-beauty", "souvenirs"],
    featuredImage: article.heroImage,
    author: article.author,
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
    publishedAt: article.publishedAt,
    seriesLabel: article.series.displayName,
    seriesNumber: article.series.number,
  };
}

export function listShoppingPosts(): Post[] {
  return SHOPPING_ARTICLES.map(shoppingArticleToPost);
}
