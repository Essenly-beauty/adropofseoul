// Upserts content/source-accounts/seoul-beauty-radar.json into source_accounts.
// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-source-accounts.mjs
// (reads .env.local automatically if the vars are not already set)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");
const sourcePath = join(
  root,
  "content/source-accounts/seoul-beauty-radar.json"
);
const source = JSON.parse(readFileSync(sourcePath, "utf8"));

const rows = source.sources.map((item) => ({
  id: item.id,
  platform: item.platform,
  handle: item.handle,
  display_name: item.displayName,
  url: item.url,
  language: item.language || [],
  market_scope: item.marketScope,
  source_type: item.sourceType,
  category: item.category || [],
  neighborhood_focus: item.neighborhoodFocus || [],
  priority: item.priority || 3,
  status: item.status || "candidate",
  signal_use: item.signalUse,
  verification_role: item.verificationRole,
  raw_metadata: {
    seed_status: source.status,
    seed_generated_at: source.generatedAt,
    seed_purpose: source.purpose,
  },
}));

const res = await fetch(`${URL}/rest/v1/source_accounts?on_conflict=id`, {
  method: "POST",
  headers: {
    apikey: SRK,
    Authorization: "Bearer " + SRK,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify(rows),
});

const out = await res.text();
console.log(res.status, out.slice(0, 500));
