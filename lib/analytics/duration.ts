// Duration buckets for the profile funnel (docs/06). Buckets, never timestamps —
// a bucket can't re-identify anyone.
//
// The single source of the bucket taxonomy: the client quiz measures elapsed ms
// directly, and `durationBucket()` in app/actions/profile.ts converts its ISO
// start time and delegates here.

export function durationBucketFromMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "under_1m";
  const minutes = ms / 60_000;
  if (minutes < 1) return "under_1m";
  if (minutes < 3) return "1_3m";
  if (minutes < 10) return "3_10m";
  return "over_10m";
}
