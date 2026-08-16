import { describe, expect, it } from "vitest";
import { isProductionAnalyticsHost } from "./GoogleAnalytics";

describe("GoogleAnalytics", () => {
  it("allows analytics only on the canonical production hostname", () => {
    expect(isProductionAnalyticsHost("adropofseoul.com")).toBe(true);
    expect(isProductionAnalyticsHost("adropofseoul.vercel.app")).toBe(false);
    expect(isProductionAnalyticsHost("feature-branch.vercel.app")).toBe(false);
    expect(isProductionAnalyticsHost("localhost")).toBe(false);
  });
});
