import { describe, it, expect, vi } from "vitest";
import {
  mapUnsplashResults,
  mapPexelsResults,
  fetchStockImages,
  stockQueryFor,
} from "./stock-images";

describe("mapUnsplashResults", () => {
  it("maps photos with attribution and commercial-ok license", () => {
    const seeds = mapUnsplashResults({
      results: [
        {
          urls: { regular: "https://images.unsplash.com/photo-1" },
          links: { html: "https://unsplash.com/photos/abc" },
          alt_description: "warm cafe interior",
          user: { name: "Jane Kim" },
        },
        { urls: {}, links: {} }, // malformed — skipped
      ],
    });
    expect(seeds).toHaveLength(1);
    expect(seeds[0]).toMatchObject({
      sourceType: "unsplash",
      license: "commercial-ok",
      attribution: "Jane Kim",
      sourceUrl: "https://unsplash.com/photos/abc",
    });
  });
  it("tolerates malformed payloads", () => {
    expect(mapUnsplashResults(null)).toEqual([]);
    expect(mapUnsplashResults({})).toEqual([]);
  });
  it("strips the per-request ixid/ixlib params so re-runs stay idempotent", () => {
    const seeds = mapUnsplashResults({
      results: [
        {
          urls: {
            regular:
              "https://images.unsplash.com/photo-1?ixid=abc123&ixlib=rb-4&w=1080",
          },
          links: { html: "https://unsplash.com/photos/abc" },
          user: { name: "Jane" },
        },
      ],
    });
    expect(seeds[0].url).not.toContain("ixid");
    expect(seeds[0].url).not.toContain("ixlib");
    expect(seeds[0].url).toContain("w=1080");
  });
});

describe("mapPexelsResults", () => {
  it("maps photos with photographer attribution", () => {
    const seeds = mapPexelsResults({
      photos: [
        {
          src: { large: "https://images.pexels.com/p1.jpg" },
          url: "https://www.pexels.com/photo/1",
          alt: "seoul street",
          photographer: "Min Lee",
        },
      ],
    });
    expect(seeds[0]).toMatchObject({
      sourceType: "pexels",
      license: "commercial-ok",
      attribution: "Min Lee",
    });
  });
});

describe("fetchStockImages", () => {
  it("skips providers whose keys are absent (no fetch calls)", async () => {
    const fetchImpl = vi.fn();
    const seeds = await fetchStockImages("Seongsu", fetchImpl, {} as never);
    expect(seeds).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("queries only configured providers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    await fetchStockImages(
      "Seongsu",
      fetchImpl as never,
      {
        UNSPLASH_ACCESS_KEY: "k",
      } as never
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0][0])).toContain("unsplash");
  });
  it("a failing provider degrades to no seeds instead of throwing", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("dns"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          photos: [
            {
              src: { large: "https://images.pexels.com/p1.jpg" },
              url: "https://www.pexels.com/photo/1",
              photographer: "Min",
            },
          ],
        }),
      });
    const seeds = await fetchStockImages(
      "Seongsu",
      fetchImpl as never,
      {
        UNSPLASH_ACCESS_KEY: "k",
        PEXELS_API_KEY: "p",
      } as never
    );
    // Unsplash died; Pexels still delivered.
    expect(seeds).toHaveLength(1);
    expect(seeds[0].sourceType).toBe("pexels");
  });
});

describe("stockQueryFor", () => {
  it("includes the area", () => {
    expect(stockQueryFor("Seongsu")).toContain("Seongsu");
  });
});
