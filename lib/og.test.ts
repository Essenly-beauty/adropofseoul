import { describe, it, expect } from "vitest";
import { placeShareImage, placeOgSubtitle } from "./og";
import { SITE_URL } from "./site";
import type { Place } from "@/services/types";

const cat = (v: string) => v as Place["category"];

describe("placeShareImage", () => {
  it("returns the first image when it is an absolute URL", () => {
    expect(
      placeShareImage({ slug: "soo", images: ["https://img.example/a.jpg"] })
    ).toBe("https://img.example/a.jpg");
  });

  it("falls back to the generated og route when images are empty", () => {
    expect(placeShareImage({ slug: "soo", images: [] })).toBe(
      `${SITE_URL}/places/soo/og`
    );
  });

  it("falls back when the first image is a relative path", () => {
    expect(placeShareImage({ slug: "soo", images: ["/uploads/a.jpg"] })).toBe(
      `${SITE_URL}/places/soo/og`
    );
  });
});

describe("placeOgSubtitle", () => {
  it("joins category label and area", () => {
    expect(
      placeOgSubtitle({ category: cat("head_spa"), area: "Seongsu" })
    ).toBe("Head Spa · Seongsu");
  });

  it("omits area when missing", () => {
    expect(placeOgSubtitle({ category: cat("head_spa"), area: null })).toBe(
      "Head Spa"
    );
  });

  it("humanizes an unknown category", () => {
    expect(placeOgSubtitle({ category: cat("mystery_kind"), area: null })).toBe(
      "mystery kind"
    );
  });
});
