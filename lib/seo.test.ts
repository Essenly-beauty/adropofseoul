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
  featuredImage: "/images/articles/hello.jpg",
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
    expect(String(ld.image)).toContain("/images/articles/hello.jpg");
    expect(String(ld.image)).toMatch(/^https?:\/\//);
  });
});

describe("localBusinessJsonLd", () => {
  it("builds a LocalBusiness schema with the place name", () => {
    const ld = localBusinessJsonLd(place) as Record<string, unknown>;
    expect(ld["@type"]).toBe("LocalBusiness");
    expect(ld.name).toBe("Sool Loft");
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

const ing = {
  id: "1",
  slug: "niacinamide",
  name: "Niacinamide",
  inciName: "Niacinamide",
  alsoKnownAs: ["Vitamin B3"],
  functions: ["brightening"],
  summary: "A vitamin B3 derivative.",
  description: null,
  benefits: null,
  goodForSkinTypes: ["oily"],
  targetsConcerns: ["pores"],
  caution: null,
  seoTitle: null,
  metaDescription: null,
} as Ingredient;

describe("definedTermJsonLd", () => {
  it("builds a DefinedTerm with name, description, and url", () => {
    const j = definedTermJsonLd(ing) as Record<string, unknown>;
    expect(j["@type"]).toBe("DefinedTerm");
    expect(j.name).toBe("Niacinamide");
    expect(String(j.url)).toContain("/ingredients/niacinamide");
  });
});

describe("definedTermSetJsonLd", () => {
  it("wraps terms in a DefinedTermSet", () => {
    const j = definedTermSetJsonLd([ing]) as Record<string, unknown>;
    expect(j["@type"]).toBe("DefinedTermSet");
    expect(Array.isArray(j.hasDefinedTerm)).toBe(true);
    expect((j.hasDefinedTerm as unknown[]).length).toBe(1);
  });
});
