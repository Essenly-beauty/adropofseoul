import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import type { Post } from "@/services/types";
import {
  topicForPost,
  sectionForPost,
  keywordsForPost,
  filterEditorialPosts,
  EDITORIAL_TOPICS,
} from "./editorial-taxonomy";
import assignments from "@/data/editorial-classification.json";
import { listShoppingPosts } from "./articles/shopping";
import { listGuidePosts } from "./seongsu/assets";
import { listPillarPosts } from "./articles/assets";

const post = (slug: string, category = "guides", tags: string[] = []): Post =>
  ({ slug, category, tags, title: slug }) as Post;

describe("reader-intent classification", () => {
  it.each([
    ["the-2000-won-coffee-that-powers-seoul", "food-drink", "explained"],
    ["olive-young-shopping-guide", "shopping", "explained"],
    ["daiso-korea-guide", "shopping", "explained"],
    ["daiso-korea-beauty", "edit", "beauty"],
    ["daiso-vs-olive-young-korea", "shopping", "explained"],
    ["what-to-buy-at-olive-young", "picks", "beauty"],
    ["korean-hair-masks-worth-buying", "picks", "beauty"],
    ["korean-bathhouse-jjimjilbang-guide", "everyday-life", "explained"],
    ["korean-head-spa-first-timer-guide", "hair-scalp", "beauty"],
    ["seoul-holistic-beauty-shift", "edit", "beauty"],
    ["han-river-picnic-like-a-local", "place-guides", "places"],
  ])(
    "places %s by purpose, irrespective of legacy category",
    (slug, topic, section) => {
      expect(topicForPost(post(slug)).key).toBe(topic);
      expect(sectionForPost(post(slug)).slug).toBe(section);
    }
  );

  it("lets an explicit CMS home override the original audit without brand-based routing", () => {
    expect(
      topicForPost(
        post("daiso-korea-guide", "guides", ["topic:picks", "keyword:daiso"])
      ).key
    ).toBe("picks");
    expect(
      topicForPost(
        post("new-product-review", "beauty", ["picks", "olive young"])
      ).key
    ).toBe("picks");
    expect(topicForPost(post("new-store", "places", ["olive young"])).key).toBe(
      "place-guides"
    );
  });

  it("includes all beauty article types in The Edit, while Picks stays focused", () => {
    const posts = [
      post("daiso-korea-beauty"),
      post("what-to-buy-at-olive-young"),
      post("korean-hair-scalp-care-routine"),
      post("olive-young-shopping-guide"),
    ];
    expect(filterEditorialPosts(posts, { section: "beauty" })).toHaveLength(3);
    expect(
      filterEditorialPosts(posts, { topic: "picks" }).map((p) => p.slug)
    ).toEqual(["what-to-buy-at-olive-young"]);
  });

  it("covers every local article, draft, and code article with an explicit valid home", () => {
    const slugs = [
      ...listShoppingPosts(),
      ...listGuidePosts(),
      ...listPillarPosts(),
    ].map((p) => p.slug);
    for (const dir of ["content/articles", "content/drafts"]) {
      for (const name of readdirSync(dir).filter((n) => n.endsWith(".md"))) {
        const slug = readFileSync(`${dir}/${name}`, "utf8").match(
          /^slug:\s*["']?([^"'\n]+)/m
        )?.[1];
        if (slug) slugs.push(slug);
      }
    }
    for (const slug of slugs) expect(assignments, slug).toHaveProperty(slug);
    for (const entry of Object.values(assignments))
      expect(EDITORIAL_TOPICS.some((t) => t.key === entry.topic)).toBe(true);
  });
});

describe("shared keyword browsing", () => {
  it("normalizes aliases, deduplicates, and links a brand across sections", () => {
    const source = post("new", "beauty", [
      "Daiso Korea",
      "daiso seoul",
      "Korean Daiso",
      "Culture Edit",
      "region:common",
    ]);
    expect(keywordsForPost(source).map((k) => k.key)).toEqual(["daiso"]);
    const daiso = filterEditorialPosts(listShoppingPosts(), {
      keyword: "daiso",
    });
    expect(daiso).toHaveLength(4);
    expect(new Set(daiso.map((p) => sectionForPost(p).slug)).size).toBe(2);
  });
  it("respects manual keyword removals and combines keyword, section, and search", () => {
    expect(
      keywordsForPost(post("daiso-korea-guide", "guides", ["keywords:manual"]))
    ).toEqual([]);
    const posts = listShoppingPosts();
    expect(
      filterEditorialPosts(posts, { section: "beauty", keyword: "daiso" }).map(
        (p) => p.slug
      )
    ).toEqual(["daiso-korea-beauty"]);
    expect(
      filterEditorialPosts(posts, { keyword: "daiso", q: "20 Things" }).map(
        (p) => p.slug
      )
    ).toEqual(["daiso-korea-must-buys"]);
    expect(filterEditorialPosts(posts, { keyword: "not-a-keyword" })).toEqual(
      []
    );
  });
});
