// The wrapped-array case is the regression that matters: `tags:` written across
// several lines used to parse as [], so a post reached the DB with none of its
// tags and nothing failed. Tags drive the Picks surface (lib/taxonomy isPick)
// and the guide→neighborhood routing (regionForGuide), so losing them silently
// changes where an article appears.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { splitFrontmatter, scalar, listValue } from "./frontmatter.mjs";

describe("splitFrontmatter", () => {
  it("splits the block from the body", () => {
    const out = splitFrontmatter('---\ntitle: "A"\n---\nbody text\n');
    expect(out).toEqual({ frontmatter: 'title: "A"', body: "body text" });
  });

  it("returns null when there is no frontmatter", () => {
    expect(splitFrontmatter("# just markdown\n")).toBeNull();
  });
});

describe("scalar", () => {
  const fm = [
    'title: "What We\'d Buy"',
    "status: draft",
    'featured_image: ""',
    "subtitle: null",
  ].join("\n");

  it("reads quoted and bare values", () => {
    expect(scalar(fm, "title")).toBe("What We'd Buy");
    expect(scalar(fm, "status")).toBe("draft");
  });

  it("treats empty, null, and missing as null", () => {
    expect(scalar(fm, "featured_image")).toBe("");
    expect(scalar(fm, "subtitle")).toBeNull();
    expect(scalar(fm, "nope")).toBeNull();
  });
});

describe("listValue", () => {
  it("reads an inline array", () => {
    expect(listValue('tags: ["a", "b"]', "tags")).toEqual(["a", "b"]);
  });

  it("reads an array wrapped across lines", () => {
    const fm =
      'tags:\n  [\n    "olive young",\n    "picks",\n  ]\ncategory: "beauty"';
    expect(listValue(fm, "tags")).toEqual(["olive young", "picks"]);
  });

  it("stops at the first closing bracket", () => {
    const fm = 'tags: ["a"]\nother: ["b"]';
    expect(listValue(fm, "tags")).toEqual(["a"]);
  });

  it("returns [] when the key is absent", () => {
    expect(listValue('category: "beauty"', "tags")).toEqual([]);
  });
});

// Drives the real content so an authoring slip fails here rather than in the DB.
describe("content/articles frontmatter", () => {
  const dir = join(process.cwd(), "content/articles");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));

  it("has articles to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`parses ${file} with publish-ready editorial metadata`, () => {
      const parsed = splitFrontmatter(readFileSync(join(dir, file), "utf8"));
      expect(parsed, "frontmatter block").not.toBeNull();
      const { frontmatter: fm } = parsed;
      expect(scalar(fm, "slug")).toBe(file.replace(/\.md$/, ""));
      expect(scalar(fm, "category")).toBeTruthy();
      expect(listValue(fm, "tags").length, "tags").toBeGreaterThan(0);
      expect(scalar(fm, "title"), "title").toBeTruthy();
      expect(scalar(fm, "excerpt"), "excerpt").toBeTruthy();
      expect(scalar(fm, "seo_title"), "seo_title").toBeTruthy();
      expect(scalar(fm, "meta_description"), "meta_description").toBeTruthy();
      expect(scalar(fm, "author"), "author").toBeTruthy();
      expect(scalar(fm, "status"), "status").toBe("published");
      expect(scalar(fm, "published_at"), "published_at").toBeTruthy();
    });
  }
});
