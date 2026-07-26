import { createHash, randomBytes } from "node:crypto";

// Pure, testable helpers for the anonymous identity token. No Next.js or
// server-only imports live here so this can be unit-tested directly; the
// cookie-bound helpers live in ./anon-identity (server-only).

export const ANON_COOKIE = "ados_anon";

// 30 days: long enough to resume a quiz and link after signup, short enough to
// bound abandoned-attempt retention.
export const ANON_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** A high-entropy opaque token for the cookie value. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hex of a token — the only representation stored in the database. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cookie options for the anonymous identity token. */
export function anonCookieOptions(now: number = Date.now()) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(now + ANON_TTL_MS),
  };
}
