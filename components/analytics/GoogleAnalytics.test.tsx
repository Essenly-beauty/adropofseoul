import { describe, expect, it } from "vitest";
import { ensureGtag, isProductionAnalyticsHost } from "./GoogleAnalytics";

describe("GoogleAnalytics", () => {
  it("allows analytics only on the canonical production hostname", () => {
    expect(isProductionAnalyticsHost("adropofseoul.com")).toBe(true);
    expect(isProductionAnalyticsHost("adropofseoul.vercel.app")).toBe(false);
    expect(isProductionAnalyticsHost("feature-branch.vercel.app")).toBe(false);
    expect(isProductionAnalyticsHost("localhost")).toBe(false);
  });

  it("creates a gtag queue before the external script loads", () => {
    const target = {} as Window;
    const gtag = ensureGtag(target);
    gtag("config", "G-TEST", { send_page_view: false });

    expect(target.gtag).toBe(gtag);
    expect(target.dataLayer).toEqual([
      ["config", "G-TEST", { send_page_view: false }],
    ]);
    expect(ensureGtag(target)).toBe(gtag);
  });
});
