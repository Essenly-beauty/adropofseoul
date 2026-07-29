// Duration buckets for the profile funnel (docs/06). Buckets, never timestamps —
// a bucket can't re-identify anyone.
//
// `durationBucket()` in app/actions/profile.ts computes the same buckets from an
// ISO start time on the server; keep the two lists in step.

export function durationBucketFromMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "under_1m";
  const minutes = ms / 60_000;
  if (minutes < 1) return "under_1m";
  if (minutes < 3) return "1_3m";
  if (minutes < 10) return "3_10m";
  return "over_10m";
}
