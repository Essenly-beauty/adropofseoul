import { describe, it, expect, afterEach, vi } from "vitest";
import {
  track,
  identify,
  resetAnalytics,
  registerAnalyticsProvider,
} from "./index";

afterEach(() => registerAnalyticsProvider(null));

describe("analytics adapter", () => {
  it("is a safe no-op when no provider is registered", () => {
    expect(() =>
      track("profile_quiz_started", { profile_domain: "skin" })
    ).not.toThrow();
    expect(() => identify("user-1")).not.toThrow();
    expect(() => resetAnalytics()).not.toThrow();
  });

  it("forwards events and identify to the registered provider", () => {
    const provider = { track: vi.fn(), identify: vi.fn(), reset: vi.fn() };
    registerAnalyticsProvider(provider);
    track("profile_quiz_completed", {
      profile_domain: "hair",
      quiz_version: 1,
    });
    identify("user-1", { locale: "en" });
    resetAnalytics();
    expect(provider.track).toHaveBeenCalledWith("profile_quiz_completed", {
      profile_domain: "hair",
      quiz_version: 1,
    });
    expect(provider.identify).toHaveBeenCalledWith("user-1", { locale: "en" });
    expect(provider.reset).toHaveBeenCalled();
  });

  it("throws if an event carries raw answers or PII", () => {
    registerAnalyticsProvider({ track: vi.fn(), identify: vi.fn() });
    expect(() => track("bad", { answers: "..." as unknown as string })).toThrow(
      /forbidden property/
    );
    expect(() => track("bad", { email: "a@b.com" })).toThrow(
      /forbidden property/
    );
  });
});
