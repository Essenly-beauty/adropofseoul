// Upserts the Klook places dataset into the places table.
//
// Sources (both required, joined by slug):
//   data/adropofseoul_places.json     — source dataset (94 entries, Korean fields)
//   data/places-curation.en.json      — English editorial layer + exclusions
//
// Rules:
//   - slugs listed under curation.excluded are never seeded
//   - verified: false rows are seeded with is_published: false
//   - slugs are normalized to ASCII (é → e) for URLs
//
// Usage: node scripts/seed-places.mjs [--dry-run]
// Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// (reads .env.local automatically if the vars are not already set)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

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

const source = JSON.parse(
  readFileSync(join(root, "data/adropofseoul_places.json"), "utf8")
);
const curation = JSON.parse(
  readFileSync(join(root, "data/places-curation.en.json"), "utf8")
);

const asciiSlug = (slug) => slug.normalize("NFD").replace(/[̀-ͯ]/g, "");

// "@handle (3.6만) / 대표 @other" → https://www.instagram.com/handle
function instagramUrl(raw) {
  const m = raw?.match(/@([A-Za-z0-9._]+)/);
  return m ? `https://www.instagram.com/${m[1]}` : null;
}

const rows = [];
for (const item of source) {
  if (curation.excluded[item.slug]) continue;
  const en = curation.places[item.slug];
  if (!en) throw new Error(`no curation entry for ${item.slug}`);
  rows.push({
    slug: asciiSlug(item.slug),
    name: en.name,
    name_kr: item.nameKr,
    category: en.category,
    entry_type: en.kind,
    area: en.area,
    address: item.address,
    short_description: en.summary,
    rating: item.rating,
    review_count: item.reviews,
    website_url: item.website,
    instagram_url: instagramUrl(item.instagram),
    google_map_url: item.googleMaps,
    naver_map_url: item.naverMap,
    is_published: item.verified === true,
  });
}

const published = rows.filter((r) => r.is_published).length;
console.log(
  `${rows.length} rows to upsert (${published} published, ${rows.length - published} unpublished/unverified; ${Object.keys(curation.excluded).length} excluded)`
);

if (dryRun) {
  console.log(JSON.stringify(rows.slice(0, 2), null, 2));
  const counts = {};
  for (const r of rows) counts[r.category] = (counts[r.category] ?? 0) + 1;
  console.log("categories:", counts);
  console.log(
    "areas:",
    [...new Set(rows.map((r) => r.area ?? "(none)"))].join(", ")
  );
  process.exit(0);
}

const base = env("NEXT_PUBLIC_SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");

const res = await fetch(`${base}/rest/v1/places?on_conflict=slug`, {
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
console.log(
  res.status,
  res.ok ? `upserted ${JSON.parse(out).length} rows` : out.slice(0, 500)
);
if (!res.ok) process.exit(1);
