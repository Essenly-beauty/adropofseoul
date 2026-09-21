import { describe, expect, it, vi } from "vitest";
import { ensureGtag, isProductionAnalyticsHost } from "./GoogleAnalytics";

describe("GoogleAnalytics", () => {
  it("allows analytics only on the canonical production hostname", () => {
    expect(isProductionAnalyticsHost("adropofseoul.com")).toBe(true);
    expect(isProductionAnalyticsHost("adropofseoul.vercel.app")).toBe(false);
    expect(isProductionAnalyticsHost("feature-branch.vercel.app")).toBe(false);
    expect(isProductionAnalyticsHost("localhost")).toBe(false);
  });

  it("queues Google tag commands as Arguments objects before the script loads", () => {
    const target = {} as Window;
    const gtag = ensureGtag(target);
    gtag("config", "G-TEST", { send_page_view: false });
    gtag("event", "page_view", { page_path: "/" });

    expect(target.gtag).toBe(gtag);
    expect(target.dataLayer).toHaveLength(2);
    for (const command of target.dataLayer) {
      // gtag.js dispatches Arguments objects as commands; plain arrays take a
      // different path and do not initialize GA or send page_view events.
      expect(Object.prototype.toString.call(command)).toBe(
        "[object Arguments]"
      );
      expect(Array.isArray(command)).toBe(false);
    }
    expect(
      target.dataLayer.map((command) => Array.from(command as IArguments))
    ).toEqual([
      ["config", "G-TEST", { send_page_view: false }],
      ["event", "page_view", { page_path: "/" }],
    ]);
    expect(ensureGtag(target)).toBe(gtag);
  });

  it("preserves an existing Google tag function and queued events", () => {
    const gtag = vi.fn();
    const dataLayer = [{ event: "existing_event" }];
    const target = { gtag, dataLayer } as unknown as Window;

    expect(ensureGtag(target)).toBe(gtag);
    expect(target.dataLayer).toBe(dataLayer);
    expect(target.dataLayer).toEqual([{ event: "existing_event" }]);
  });
});
