// Thin, provider-agnostic analytics adapter (Essenly Phase 1).
//
// Phase 1 defers the concrete provider (PostHog is the intended product-analytics
// provider; Vercel Web Analytics may run alongside for traffic/vitals). Feature
// code calls `track` / `identify` against this stable surface so we are never
// coupled to a vendor. Until a provider is registered, calls are safe no-ops.
//
// Privacy (docs/06, docs/13): never pass raw quiz answers or free text as event
// properties. Use controlled taxonomies (profile_code, reason_code, buckets).

export type EventProps = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface AnalyticsProvider {
  track(event: string, props?: EventProps): void;
  identify(userId: string, props?: EventProps): void;
  reset?(): void;
}

let provider: AnalyticsProvider | null = null;

/** Register the concrete provider (e.g. a PostHog adapter) at app startup. */
export function registerAnalyticsProvider(p: AnalyticsProvider | null): void {
  provider = p;
}

// A minimal guard so an accidental raw-answer property is caught in review/tests
// rather than shipped. Extend as the taxonomy in docs/06 is implemented.
const FORBIDDEN_PROP_KEYS = new Set([
  "answer",
  "answers",
  "response",
  "responses",
  "email",
  "free_text",
]);

function assertSafeProps(event: string, props?: EventProps): void {
  if (!props) return;
  for (const key of Object.keys(props)) {
    if (FORBIDDEN_PROP_KEYS.has(key)) {
      throw new Error(
        `analytics: event "${event}" carries forbidden property "${key}" (raw answers/PII must not be sent)`
      );
    }
  }
}

/** Emit an event through the registered provider (no-op until one is set). */
export function track(event: string, props?: EventProps): void {
  assertSafeProps(event, props);
  provider?.track(event, props);
}

/** Associate the anonymous session with an authenticated user id. */
export function identify(userId: string, props?: EventProps): void {
  provider?.identify(userId, props);
}

/** Clear identity (e.g. on sign-out). */
export function resetAnalytics(): void {
  provider?.reset?.();
}
