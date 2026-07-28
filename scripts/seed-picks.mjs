// Promotes data/beauty-pipeline/csv/picks_export.json into products/product_offers,
// uploading data/beauty-pipeline/images/out/<slug>.webp to storage when present.
// Usage: node scripts/seed-picks.mjs   (reads .env.local for URL + service key)
// Existing products: only tags/award_badge/offers/image are updated — name/brand/
// description edited in admin are preserved.
import { readFileSync, existsSync } from "node:fs";
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
const H = {
  apikey: SRK,
  Authorization: "Bearer " + SRK,
  "Content-Type": "application/json",
};
const BUCKET = "media";

async function rest(path, init = {}) {
  const res = await fetch(`${URL}${path}`, {
    ...init,
    headers: { ...H, ...init.headers },
  });
  const text = await res.text();
  if (!res.ok)
    throw new Error(
      `${init.method ?? "GET"} ${path} → ${res.status} ${text.slice(0, 200)}`
    );
  return text ? JSON.parse(text) : null;
}

async function ensureBucket() {
  const res = await fetch(`${URL}/storage/v1/bucket`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!res.ok && res.status !== 409) {
    const t = await res.text();
    if (!t.includes("already exists"))
      throw new Error(`bucket: ${res.status} ${t}`);
  }
}

async function uploadImage(slug) {
  const file = join(root, "data/beauty-pipeline/images/out", `${slug}.webp`);
  if (!existsSync(file)) return null;
  const res = await fetch(
    `${URL}/storage/v1/object/${BUCKET}/products/${slug}.webp`,
    {
      method: "POST",
      headers: { ...H, "Content-Type": "image/webp", "x-upsert": "true" },
      body: readFileSync(file),
    }
  );
  if (!res.ok)
    throw new Error(`upload ${slug}: ${res.status} ${await res.text()}`);
  return `${URL}/storage/v1/object/public/${BUCKET}/products/${slug}.webp`;
}

const picks = JSON.parse(
  readFileSync(join(root, "data/beauty-pipeline/csv/picks_export.json"), "utf8")
);
await ensureBucket();

for (const p of picks) {
  const [existing] = await rest(
    `/rest/v1/products?slug=eq.${p.slug}&select=id`
  );
  let id;
  if (existing) {
    id = existing.id;
    await rest(`/rest/v1/products?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ tags: p.tags, award_badge: p.award_badge }),
      headers: { Prefer: "return=minimal" },
    });
  } else {
    const [row] = await rest(`/rest/v1/products`, {
      method: "POST",
      body: JSON.stringify({
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        tags: p.tags,
        award_badge: p.award_badge,
        disclosure_required: p.disclosure_required,
        is_published: true,
      }),
      headers: { Prefer: "return=representation" },
    });
    id = row.id;
  }

  const image = await uploadImage(p.slug);
  if (image) {
    await rest(`/rest/v1/products?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ image }),
      headers: { Prefer: "return=minimal" },
    });
  }

  for (const [i, o] of p.offers.entries()) {
    await rest(`/rest/v1/product_offers?on_conflict=product_id,retailer`, {
      method: "POST",
      body: JSON.stringify({
        product_id: id,
        retailer: o.retailer,
        url: o.url,
        is_active: true,
        sort: i,
      }),
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    });
  }
  console.log(
    `${p.slug}${existing ? " (updated)" : " (created)"}${image ? " +image" : ""}`
  );
}
console.log(`done: ${picks.length} picks`);
