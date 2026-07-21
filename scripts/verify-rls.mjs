// Proves the admin-claim RLS lockdown: creates a throwaway NON-admin user
// with the service role, signs in as them with the anon key, and checks
// that they can read published content but cannot write content tables or
// read subscriber emails. Deletes the throwaway user afterward.
// Usage: node scripts/verify-rls.mjs
// Run AFTER the 20260721150000_admin_claim_rls migration is applied.
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

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const admin = createClient(url, env("SUPABASE_SERVICE_ROLE_KEY"));

const suffix = Math.random().toString(36).slice(2, 10);
const email = `rls-probe-${suffix}@example.com`;
const password = `Probe-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const { data: created, error: createError } = await admin.auth.admin.createUser(
  {
    email,
    password,
    email_confirm: true,
  }
);
if (createError) throw createError;

const results = [];
function check(name, ok, detail) {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

try {
  const probe = createClient(url, env("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const { error: signInError } = await probe.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  // Published content must stay readable to everyone.
  const { data: places, error: readError } = await probe
    .from("places")
    .select("id, slug")
    .limit(1);
  check("published places readable", !readError, readError?.message);

  // UPDATE against a using-clause that denies the row updates 0 rows.
  const target = places?.[0];
  if (target) {
    const { data: updated, error: updateError } = await probe
      .from("places")
      .update({ name: "rls-probe-was-here" })
      .eq("id", target.id)
      .select();
    check(
      "places update blocked",
      !updateError && (updated ?? []).length === 0,
      updateError?.message ?? `updated ${updated?.length ?? 0} rows`
    );
  } else {
    check("places update blocked", false, "no published place to probe");
  }

  // INSERT trips the with-check clause and must error.
  const { error: insertError } = await probe.from("places").insert({
    name: "rls probe",
    slug: `rls-probe-${suffix}`,
    category: "cafe",
  });
  check("places insert blocked", Boolean(insertError), insertError?.message);

  // Subscriber PII must not be readable by a non-admin session.
  const { data: subs, error: subsError } = await probe
    .from("newsletter_subscribers")
    .select("email")
    .limit(1);
  check(
    "subscriber emails hidden",
    !subsError && (subs ?? []).length === 0,
    subsError?.message ?? `read ${subs?.length ?? 0} rows`
  );
} finally {
  await admin.auth.admin.deleteUser(created.user.id);
}

const allPass = results.every(Boolean);
console.log(allPass ? "RLS VERIFY: ALL PASS" : "RLS VERIFY: FAILURES");
process.exit(allPass ? 0 : 1);
