import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";

/**
 * Server actions are standalone POST endpoints — the /admin layout gate does
 * NOT protect them, and the middleware only requires an authenticated session
 * (not an allowlisted one). Every admin mutation must call this first.
 */
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAllowedAdmin(user?.email)) {
    throw new Error("Unauthorized: admin allowlist required.");
  }
}
