import { describe, it, expect } from "vitest";
import {
  canonical,
  articleJsonLd,
  localBusinessJsonLd,
  breadcrumbJsonLd,
} from "./seo";
import type { Post, Place } from "@/services/types";

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
