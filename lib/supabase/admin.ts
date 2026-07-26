import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client for trusted server actions only.
//
// This bypasses row-level security, so it must NEVER be imported into client
// components or used to act on client-provided ownership claims. Its sole
// legitimate use in Phase 1 is anonymous-identity data access, where ownership
// is proven server-side from an HTTP-only cookie (see lib/profile/anon-identity).
//
// The `server-only` import makes a client-side import a build error.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "createAdminClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Whether a real service-role key is configured (false for the local placeholder). */
export function hasServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!key && !key.startsWith("your-");
}
