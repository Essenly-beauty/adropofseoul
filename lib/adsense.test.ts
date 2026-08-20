import { describe, expect, it } from "vitest";
import { adsTxtLine, normalizeAdsenseAccount } from "./adsense";

describe("AdSense configuration", () => {
  it("accepts a numeric ca-pub account", () => {
    expect(normalizeAdsenseAccount(" ca-pub-1234567890123456 ")).toBe(
      "ca-pub-1234567890123456"
    );
  });

  it("rejects missing and placeholder account values", () => {
    expect(normalizeAdsenseAccount(undefined)).toBeUndefined();
    expect(normalizeAdsenseAccount("ca-pub-your-publisher-id")).toBeUndefined();
    expect(normalizeAdsenseAccount("ca-pub-1234")).toBeUndefined();
  });

  it("builds the Google authorized-seller line without the ca- prefix", () => {
    expect(adsTxtLine("ca-pub-1234567890123456")).toBe(
      "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0"
    );
  });
});
