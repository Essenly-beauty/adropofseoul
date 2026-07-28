import "server-only";
import { cookies } from "next/headers";
import {
  ANON_COOKIE,
  anonCookieOptions,
  generateToken,
  hashToken,
} from "./anon-token";

// Anonymous identity for pre-signup quiz ownership (Essenly Phase 1, WS-04).
//
// The browser holds an opaque random token in an HTTP-only, same-site, secure
// cookie. The database stores only the SHA-256 hash of that token, so a DB read
// never reveals the cookie value. Ownership of an anonymous attempt is proven
// server-side by hashing the cookie and matching the row — never by a
// client-provided identifier. Local storage is not used for ownership.
//
// This module never touches the database directly: the caller looks up / upserts
// the `anonymous_identities` row by `tokenHash` using the service-role client.

export { ANON_COOKIE, ANON_TTL_MS, hashToken } from "./anon-token";

/** Read the raw anonymous token from the request cookies, if present. */
export async function readAnonToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ANON_COOKIE)?.value ?? null;
}

/**
 * Ensure the response carries an anonymous token cookie, returning the token
 * and its hash. Reuses an existing token; issues a new one otherwise.
 *
 * Writes a cookie, so it must be called only from a Server Action or Route
 * Handler — never during a plain Server Component render (Next throws
 * "Cookies can only be modified in a Server Action or Route Handler").
 */
export async function ensureAnonToken(): Promise<{
  token: string;
  tokenHash: string;
  issued: boolean;
}> {
  const store = await cookies();
  const existing = store.get(ANON_COOKIE)?.value;
  if (existing) {
    return { token: existing, tokenHash: hashToken(existing), issued: false };
  }
  const token = generateToken();
  store.set(ANON_COOKIE, token, anonCookieOptions());
  return { token, tokenHash: hashToken(token), issued: true };
}
