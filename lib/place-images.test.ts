import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import manifest from "@/data/place-photos.json";
import { resolvePlaceImages, placeImageAlt } from "./place-images";

describe("collected place photos", () => {
  it("connects an exact slug to real local files with alt text", () => {
    for (const slug of Object.keys(manifest)) {
      const images = resolvePlaceImages(slug, []);
      expect(images.length).toBeGreaterThan(0);
      expect(new Set(images).size).toBe(images.length);
      for (const src of images) {
        expect(existsSync(path.join(process.cwd(), "public", src))).toBe(true);
        expect(placeImageAlt(slug, src, "fallback")).not.toContain("fallback");
      }
    }
  });

  it("keeps admin-managed images first and only appends reviewed gap photos", () => {
    const images = ["https://example.com/new-cover.jpg", "/uploads/new.jpg"];
    const resolved = resolvePlaceImages("juno-hair-garosugil", images);
    expect(resolved.slice(0, images.length)).toEqual(images);
    expect(resolved).toHaveLength(4);
    expect(new Set(resolved).size).toBe(resolved.length);
  });

  it("never truncates an existing gallery or appends past the normal maximum", () => {
    const existing = ["1", "2", "3", "4", "5", "6"];
    expect(resolvePlaceImages("juno-hair-garosugil", existing)).toEqual(existing);
  });

  it("does not infer a branch match or borrow another place's photos", () => {
    expect(resolvePlaceImages("juno-hair-unknown-branch", [])).toEqual([]);
  });
});
