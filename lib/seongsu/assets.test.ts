import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDES } from "./guides";
import { PILLARS } from "@/lib/articles/pillars";
import { publicFileExists, resolveHeroImage } from "./assets";

describe("build-time public asset index", () => {
  it.each([...GUIDES, ...PILLARS])("retains the hero for $slug", (article) => {
    expect(existsSync(join(process.cwd(), "public", article.heroImage))).toBe(
      true
    );
    expect(publicFileExists(article.heroImage)).toBe(true);
    expect(publicFileExists(article.heroImage.replace(/^\//, ""))).toBe(true);
  });

  it("keeps the placeholder for missing images", () => {
    expect(publicFileExists("")).toBe(false);
    expect(publicFileExists("/images/nonexistent-asset.jpg")).toBe(false);
    expect(
      resolveHeroImage({ ...GUIDES[0], heroImage: "/missing.jpg" })
    ).toBeNull();
  });
});
