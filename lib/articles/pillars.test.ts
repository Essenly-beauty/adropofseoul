import { describe, it, expect } from "vitest";
import { PILLARS, PILLAR_SLUGS, getPillar, isPillarSlug } from "./pillars";
import { GUIDE_SLUGS } from "@/lib/seongsu/guides";
import { slugify } from "@/lib/slug";

const REAL_ARTICLE_SLUGS = new Set<string>([...GUIDE_SLUGS, ...PILLAR_SLUGS]);

describe("pillar registry", () => {
  it("registers the Seoul neighborhoods hub as a pinned common guide", () => {
    const p = getPillar("seoul-neighborhoods-guide");
    expect(p).toBeDefined();
    expect(p!.region).toBe("common");
    expect(p!.pinned).toBe(true);
    expect(isPillarSlug("seoul-neighborhoods-guide")).toBe(true);
    expect(isPillarSlug("nope")).toBe(false);
  });
});

describe("no dead links", () => {
  for (const pillar of PILLARS) {
    it(`${pillar.slug}: no unresolved (#) placeholders`, () => {
      expect(pillar.body).not.toContain("](#)");
    });

    it(`${pillar.slug}: every /articles/ link points at a real article`, () => {
      const inBody = Array.from(
        pillar.body.matchAll(/\]\(\/articles\/([a-z0-9-]+)\)/g),
        (m) => m[1]
      );
      const inSeries = pillar.seriesLinks.map((l) =>
        l.href.replace("/articles/", "")
      );
      for (const slug of [...inBody, ...inSeries]) {
        expect(REAL_ARTICLE_SLUGS.has(slug)).toBe(true);
      }
    });

    it(`${pillar.slug}: every #anchor matches a heading in the body`, () => {
      const headingIds = new Set(
        Array.from(pillar.body.matchAll(/^##\s+(.+)$/gm), (m) => slugify(m[1]))
      );
      const anchors = Array.from(
        pillar.body.matchAll(/\]\(#([a-z0-9-]+)\)/g),
        (m) => m[1]
      );
      expect(anchors.length).toBeGreaterThan(0);
      for (const a of anchors) expect(headingIds.has(a)).toBe(true);
    });
  }
});
