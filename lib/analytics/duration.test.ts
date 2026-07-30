import { describe, it, expect } from "vitest";
import { durationBucketFromMs } from "./duration";

describe("durationBucketFromMs", () => {
  it("buckets elapsed time into the profile funnel's buckets", () => {
    expect(durationBucketFromMs(0)).toBe("under_1m");
    expect(durationBucketFromMs(59_000)).toBe("under_1m");
    expect(durationBucketFromMs(60_000)).toBe("1_3m");
    expect(durationBucketFromMs(179_000)).toBe("1_3m");
    expect(durationBucketFromMs(180_000)).toBe("3_10m");
    expect(durationBucketFromMs(599_000)).toBe("3_10m");
    expect(durationBucketFromMs(600_000)).toBe("over_10m");
  });

  it("treats nonsense as the smallest bucket rather than throwing", () => {
    expect(durationBucketFromMs(-1)).toBe("under_1m");
    expect(durationBucketFromMs(Number.NaN)).toBe("under_1m");
  });
});
