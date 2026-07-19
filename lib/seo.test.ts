import { describe, it, expect } from "vitest";
import {
  canonical,
  articleJsonLd,
  localBusinessJsonLd,
  breadcrumbJsonLd,
  definedTermJsonLd,
  definedTermSetJsonLd,
} from "./seo";
import type { Post, Place, Ingredient } from "@/services/types";

const post = {
  title: "Hello",
  slug: "hello",
  excerpt: "x",
  body: "## hi",
  author: "Team",
  publishedAt: "2026-01-01T00:00:00Z",
} as Post;

const place = {
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
  shortDescription: "x",
  address: null,
} as unknown as Place;

describe("canonical", () => {
  it("joins a clean path onto the site base", () => {
    expect(canonical("/articles/hello")).toMatch(/\/articles\/hello$/);
  });
});

describe("articleJsonLd", () => {
  it("builds an Article schema with headline + datePublished", () => {
    const ld = articleJsonLd(post) as Record<string, unknown>;
    expect(ld["@type"]).toBe("Article");
    expect(ld.headline).toBe("Hello");
    expect(ld.datePublished).toBe("2026-01-01T00:00:00Z");
  });
});

describe("localBusinessJsonLd", () => {
  it("builds a LocalBusiness schema with the place name", () => {
    const ld = localBusinessJsonLd(place) as Record<string, unknown>;
    expect(ld["@type"]).toBe("LocalBusiness");
    expect(ld.name).toBe("Sool Loft");
    expect(ld.aggregateRating).toBeUndefined();
  });

  it("adds aggregateRating only when rating and review count exist", () => {
    const ld = localBusinessJsonLd({
      ...place,
      rating: 4.9,
      reviewCount: 487,
    }) as Record<string, unknown>;
    expect(ld.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.9,
      reviewCount: 487,
    });
  });
});

const ingredient = {
  slug: "niacinamide",
  name: "Niacinamide",
  inciName: "Niacinamide",
  summary: "A versatile vitamin B3 derivative.",
} as Ingredient;

describe("definedTermJsonLd", () => {
  it("builds a DefinedTerm with INCI termCode and dictionary set", () => {
    const ld = definedTermJsonLd(ingredient) as Record<string, unknown>;
    expect(ld["@type"]).toBe("DefinedTerm");
    expect(ld.name).toBe("Niacinamide");
    expect(ld.termCode).toBe("Niacinamide");
    expect(String(ld.inDefinedTermSet)).toMatch(/\/ingredients$/);
    expect(String(ld.url)).toMatch(/\/ingredients\/niacinamide$/);
  });
});

describe("definedTermSetJsonLd", () => {
  it("builds a DefinedTermSet listing each ingredient", () => {
    const ld = definedTermSetJsonLd([ingredient]) as Record<string, unknown>;
    expect(ld["@type"]).toBe("DefinedTermSet");
    expect((ld.hasDefinedTerm as unknown[]).length).toBe(1);
  });
});

describe("breadcrumbJsonLd", () => {
  it("builds an ordered BreadcrumbList", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Articles", path: "/articles" },
    ]) as Record<string, unknown>;
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect((ld.itemListElement as unknown[]).length).toBe(2);
  });
});
