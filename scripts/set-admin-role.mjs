// Stamps app_metadata.role = 'admin' on the given users so the admin-claim
// RLS policies (migration 20260721150000_admin_claim_rls) accept them.
// Usage: node scripts/set-admin-role.mjs [email …]
// With no args, uses the ADMIN_EMAILS env var (comma-separated).
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (reads
// .env.local automatically). Admins must sign out and back in afterward —
// the claim only lands in freshly issued JWTs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function env(key) {
  if (process.env[key]) return process.env[key];
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split(
    "\n"
  )) {
    if (line.startsWith(key + "="))
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^"|"$/g, "");
  }
  throw new Error("missing " + key);
}

const argvEmails = process.argv.slice(2);
const emails = argvEmails.length
  ? argvEmails
  : env("ADMIN_EMAILS")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

if (!emails.length) {
  console.error("no emails given and ADMIN_EMAILS is empty");
  process.exit(2);
}

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY")
);

// listUsers is paginated server-side; keep fetching pages until one comes
// back short of perPage, so admin lookups don't silently miss users past
// page 1 once the project has more than perPage accounts.
const perPage = 1000;
const users = [];
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage,
  });
  if (error) throw error;
  users.push(...data.users);
  if (data.users.length < perPage) break;
}

let failed = false;
for (const email of emails) {
  const user = users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    console.error(`NOT FOUND: ${email}`);
    failed = true;
    continue;
  }
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { app_metadata: { ...user.app_metadata, role: "admin" } }
  );
  if (updateError) {
    console.error(`FAILED: ${email} — ${updateError.message}`);
    failed = true;
    continue;
  }
  console.log(`OK: ${email} (${user.id}) app_metadata.role=admin`);
}
console.log(
  failed
    ? "done with failures"
    : "done — stamped admins must sign out/in to refresh their JWT"
);
process.exit(failed ? 1 : 0);
