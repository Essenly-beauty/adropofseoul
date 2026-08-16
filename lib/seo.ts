import { SITE_URL, SITE_NAME } from "@/lib/site";
import type { Post, Place, Ingredient } from "@/services/types";

export function canonical(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function articleJsonLd(post: Post): object {
  const articleUrl = canonical(`/articles/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    image: post.featuredImage
      ? post.featuredImage.startsWith("http")
        ? post.featuredImage
        : canonical(post.featuredImage)
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: canonical("/"),
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };
}

export function websiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: canonical("/"),
    description:
      "A Seoul-based editorial and discovery platform covering Korean beauty, haircare, skincare, wellness, places, and experiences for an international audience.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: canonical("/"),
    },
  };
}

export function localBusinessJsonLd(place: Place): object {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    alternateName: place.nameKr ?? undefined,
    description: place.shortDescription ?? undefined,
    // Rows with no confirmable street address are seeded with an empty string
    // (not null), so fall back on falsy — an empty schema.org address is worse
    // than none, and the area is at least true.
    address: place.address || place.area || undefined,
    url: canonical(`/seoul/places/${place.slug}`),
    sameAs:
      [place.websiteUrl, place.instagramUrl].filter(Boolean).length > 0
        ? [place.websiteUrl, place.instagramUrl].filter(Boolean)
        : undefined,
    aggregateRating:
      place.rating != null && place.reviewCount != null
        ? {
            "@type": "AggregateRating",
            ratingValue: place.rating,
            reviewCount: place.reviewCount,
          }
        : undefined,
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
