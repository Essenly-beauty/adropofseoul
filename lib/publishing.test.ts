import { describe, expect, it } from "vitest";
import { isPostPublic, PLACES_DIRECTORY_PUBLIC } from "./publishing";

describe("publishing gates", () => {
  it("publishes the completed serum guide", () => {
    expect(isPostPublic("five-k-beauty-serums")).toBe(true);
    expect(isPostPublic("olive-young-shopping-guide")).toBe(true);
  });

  it("keeps the places directory private during content review", () => {
    expect(PLACES_DIRECTORY_PUBLIC).toBe(false);
  });
});
