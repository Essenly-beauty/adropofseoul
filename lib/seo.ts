import { SITE_URL, SITE_NAME } from "@/lib/site";
import type { Post, Place, Ingredient } from "@/services/types";

export function canonical(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function articleJsonLd(post: Post): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    image: post.featuredImage ? canonical(post.featuredImage) : undefined,
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: canonical(`/articles/${post.slug}`),
  };
}

export function localBusinessJsonLd(place: Place): object {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    description: place.shortDescription ?? undefined,
    address: place.area ?? undefined,
    url: canonical(`/places/${place.slug}`),
  };
}

export function breadcrumbJsonLd(
  crumbs: { name: string; path: string }[]
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: canonical(c.path),
    })),
  };
}

export function definedTermJsonLd(ingredient: Ingredient): object {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: ingredient.name,
    description: ingredient.summary ?? undefined,
    termCode: ingredient.inciName ?? undefined,
    inDefinedTermSet: canonical("/ingredients"),
    url: canonical(`/ingredients/${ingredient.slug}`),
  };
}

export function definedTermSetJsonLd(ingredients: Ingredient[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: `${SITE_NAME} — K-Beauty Ingredient Dictionary`,
    url: canonical("/ingredients"),
    hasDefinedTerm: ingredients.map((i) => ({
      "@type": "DefinedTerm",
      name: i.name,
      url: canonical(`/ingredients/${i.slug}`),
    })),
  };
}
