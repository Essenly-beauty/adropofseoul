import { describe, expect, it } from "vitest";
import { isPostPublic, PLACES_DIRECTORY_PUBLIC } from "./publishing";

describe("publishing gates", () => {
  it("keeps the thin serum placeholder out of public feeds", () => {
    expect(isPostPublic("five-k-beauty-serums")).toBe(false);
    expect(isPostPublic("olive-young-shopping-guide")).toBe(true);
  });

  it("keeps the places directory private during content review", () => {
    expect(PLACES_DIRECTORY_PUBLIC).toBe(false);
  });
});
