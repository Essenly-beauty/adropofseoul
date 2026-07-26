import { describe, it, expect } from "vitest";
import {
  ANON_COOKIE,
  ANON_TTL_MS,
  generateToken,
  hashToken,
  anonCookieOptions,
} from "./anon-token";

describe("anon token", () => {
  it("generates high-entropy, unique, url-safe tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/); // base64url, no padding
    expect(a.length).toBeGreaterThanOrEqual(43); // 32 bytes -> 43 chars
  });

  it("hashes deterministically to sha-256 hex and never returns the token", () => {
    const token = "example-token";
    const h = hashToken(token);
    expect(h).toBe(hashToken(token));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain(token);
    // known vector for "example-token"
    expect(hashToken("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("builds hardened cookie options with a bounded expiry", () => {
    const now = 1_700_000_000_000;
    const opts = anonCookieOptions(now);
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.expires.getTime()).toBe(now + ANON_TTL_MS);
  });

  it("exposes a stable cookie name", () => {
    expect(ANON_COOKIE).toBe("ados_anon");
  });
});
