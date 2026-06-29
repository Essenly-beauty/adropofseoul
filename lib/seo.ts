import { SITE_URL, SITE_NAME } from "@/lib/site";
import type { Post, Place } from "@/services/types";

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
    image: post.featuredImage ?? undefined,
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
