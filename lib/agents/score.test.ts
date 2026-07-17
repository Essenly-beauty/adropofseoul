import { describe, it, expect } from "vitest";
import { combinedConfidence, APPROVAL_THRESHOLD } from "./score";

describe("combinedConfidence", () => {
  it("more independent sources means higher confidence", () => {
    const one = combinedConfidence({
      modelConfidence: 0.7,
      sourceCount: 1,
      hasEvidence: true,
    });
    const three = combinedConfidence({
      modelConfidence: 0.7,
      sourceCount: 3,
      hasEvidence: true,
    });
    expect(three).toBeGreaterThan(one);
  });
  it("caps evidence-less candidates below the approval threshold", () => {
    const c = combinedConfidence({
      modelConfidence: 0.95,
      sourceCount: 5,
      hasEvidence: false,
    });
    expect(c).toBeLessThan(APPROVAL_THRESHOLD);
  });
  it("clamps output to [0, 1]", () => {
    expect(
      combinedConfidence({
        modelConfidence: 1,
        sourceCount: 50,
        hasEvidence: true,
      })
    ).toBeLessThanOrEqual(1);
    expect(
      combinedConfidence({
        modelConfidence: -1,
        sourceCount: 0,
        hasEvidence: false,
      })
    ).toBeGreaterThanOrEqual(0);
  });
});
