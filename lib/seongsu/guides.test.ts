import { describe, it, expect } from "vitest";
import { GUIDES, GUIDE_SLUGS, getGuide, isGuideSlug } from "./guides";
import { getCourse, COURSE_1_ALTERNATES, DEEP_LOCAL_DETOURS } from "./courses";

function guideText(slug: string): string {
  const g = getGuide(slug)!;
  return [
    g.title,
    g.subtitle,
    g.excerpt,
    g.intro,
    g.walk,
    g.linkUp ?? "",
    g.knowBeforeYouGo,
    g.cta.heading,
    g.cta.body,
    g.seriesNav.label,
    g.footnote,
  ].join("\n");
}

describe("guide registry", () => {
  it("registers exactly the two brief slugs", () => {
    expect(GUIDE_SLUGS).toEqual([
      "seongsu-beauty-and-bites",
      "seongsu-warehouse-cafes",
    ]);
  });

  it("matches the brief's title tags and meta descriptions", () => {
    expect(getGuide("seongsu-beauty-and-bites")!.seoTitle).toBe(
      "Seongsu Food & Beauty Walk: Where Locals Eat | A Drop of Seoul"
    );
    expect(getGuide("seongsu-warehouse-cafes")!.seoTitle).toBe(
      "Seongsu Cafés: A Warehouse & Dessert Crawl | A Drop of Seoul"
    );
    expect(getGuide("seongsu-beauty-and-bites")!.metaDescription).toContain(
      "the local spots the industry actually eats at"
    );
  });

  it("resolves isGuideSlug", () => {
    expect(isGuideSlug("seongsu-beauty-and-bites")).toBe(true);
    expect(isGuideSlug("some-db-post")).toBe(false);
  });
});

describe("no forbidden framing or dead links", () => {
  for (const slug of GUIDE_SLUGS) {
    it(`${slug}: no Musinsa / fashion-employer framing`, () => {
      const text = guideText(slug).toLowerCase();
      expect(text).not.toContain("musinsa");
      expect(text).not.toContain("무신사");
      expect(text).not.toContain("employee");
    });

    it(`${slug}: no unresolved (#) placeholder links`, () => {
      expect(guideText(slug)).not.toContain("](#)");
    });
  }
});

describe("in-body links resolve", () => {
  for (const guide of GUIDES) {
    it(`${guide.slug}: every #stop-* anchor exists on the page`, () => {
      const rendered = new Set(
        getCourse(guide.courseId).stops.map((s) => s.id)
      );
      if (guide.showAlternates)
        COURSE_1_ALTERNATES.forEach((s) => rendered.add(s.id));
      if (guide.showDetours)
        DEEP_LOCAL_DETOURS.forEach((s) => rendered.add(s.id));

      const anchors = Array.from(
        guide.walk.matchAll(/#stop-([a-z0-9-]+)/g),
        (m) => m[1]
      );
      expect(anchors.length).toBeGreaterThan(0);
      for (const a of anchors) expect(rendered.has(a)).toBe(true);
    });

    it(`${guide.slug}: cross-links point at a real guide`, () => {
      const crossLinks = [
        ...Array.from(guide.intro.matchAll(/\/articles\/([a-z0-9-]+)/g)),
        ...Array.from(
          (guide.linkUp ?? "").matchAll(/\/articles\/([a-z0-9-]+)/g)
        ),
      ].map((m) => m[1]);
      for (const slug of crossLinks) expect(GUIDE_SLUGS).toContain(slug);
      // series nav always points at the sibling guide
      expect(guide.seriesNav.href).toMatch(/^\/articles\/seongsu-/);
    });
  }
});
