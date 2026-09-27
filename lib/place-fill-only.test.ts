import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mergeFillOnlyPhotos } from "./place-fill-only";

describe("shared place fill-only contract", () => {
  it("pins the cross-project policy", () => {
    const policy = JSON.parse(readFileSync("data/place-data-fill-policy.json", "utf8"));
    expect(policy.contractId).toBe("seoul-place-fill-only-v1");
    expect(policy.fields.preserveNonEmptyExistingValues).toBe(true);
    expect(policy.photos.preserveExistingOrder).toBe(true);
    expect(policy.photos.targetMinimum).toBe(3);
    expect(policy.photos.targetMaximum).toBe(5);
  });

  it("preserves existing photos and appends unique candidates only", () => {
    expect(mergeFillOnlyPhotos(["old-1", "old-2"], ["old-2", "new-3", "new-4", "new-5", "new-6"]))
      .toEqual(["old-1", "old-2", "new-3", "new-4", "new-5"]);
  });
});
