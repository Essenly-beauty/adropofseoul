/**
 * Per-action idempotency key, generated client-side. A genuine double-click
 * resolves to one attempt because both calls carry the same nonce only if they
 * come from the same click — a second click deliberately gets a new one.
 */
export function makeNonce(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
