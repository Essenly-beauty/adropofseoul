// Feature flags for the Beauty Profile build (Essenly Phase 1).
//
// Every flag defaults to OFF so an incomplete milestone never exposes broken
// navigation in production. A flag is enabled by setting its env var to "1" or
// "true" (e.g. NEXT_PUBLIC_FLAG_BEAUTY_PROFILE=1). NEXT_PUBLIC_ flags are
// readable in client components; server-only checks can use the same names.

export const PROFILE_FLAGS = [
  "beauty_profile", // the /beauty-profile hub + entry points
  "skin_profile", // Skin quiz + result
  "hair_profile", // Hair quiz + result
  "beauty_passport", // authenticated passport
  "profile_recommendations", // editorial recommendation surface
  "my_seoul_drop_gateway", // save-ready gateway interfaces
  "newsletter_profile_cta", // profile-context newsletter CTA
  "profile_history", // passport history view
] as const;

export type ProfileFlag = (typeof PROFILE_FLAGS)[number];

function envKey(flag: ProfileFlag): string {
  return `NEXT_PUBLIC_FLAG_${flag.toUpperCase()}`;
}

function truthy(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

/**
 * Whether a Phase 1 profile flag is enabled. Reads from process.env by default;
 * an explicit env map can be passed (used in tests). Safe default is OFF.
 */
export function isFlagEnabled(
  flag: ProfileFlag,
  env: Record<string, string | undefined> = process.env
): boolean {
  return truthy(env[envKey(flag)]);
}

/** All flags with their current state — handy for a debug surface. */
export function flagStates(
  env: Record<string, string | undefined> = process.env
): Record<ProfileFlag, boolean> {
  return Object.fromEntries(
    PROFILE_FLAGS.map((f) => [f, isFlagEnabled(f, env)])
  ) as Record<ProfileFlag, boolean>;
}
