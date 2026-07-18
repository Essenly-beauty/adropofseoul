// Upserts content/ingredients/*.md into the ingredients table.
// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-ingredients.mjs
// (reads .env.local automatically if the vars are not already set)
import { readFileSync, readdirSync } from "node:fs";
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

function listValue(raw, key) {
  const inline = raw.match(new RegExp(`^${key}:\\s*\\[(.*?)\\]`, "m"));
  if (inline)
    return inline[1]
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
  return [];
}

const dir = join(root, "content/ingredients");
const rows = readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const txt = readFileSync(join(dir, f), "utf8");
    const m = txt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) throw new Error(`${f}: missing --- frontmatter block`);
    const fm = m[1];
    const body = m[2].trim();
    const scalar = (k) => {
      const mm = fm.match(new RegExp(`^${k}:\\s*"([\\s\\S]*?)"\\s*$`, "m"));
      return mm ? mm[1] : null;
    };
    return {
      slug: scalar("slug"),
      name: scalar("name"),
      inci_name: scalar("inci_name"),
      also_known_as: listValue(fm, "also_known_as"),
      functions: listValue(fm, "functions"),
      summary: scalar("summary"),
      description: body,
      benefits: scalar("benefits"),
      good_for_skin_types: listValue(fm, "good_for_skin_types"),
      targets_concerns: listValue(fm, "targets_concerns"),
      caution: scalar("caution"),
      seo_title: scalar("seo_title"),
      meta_description: scalar("meta_description"),
      status: scalar("status") || "draft",
    };
  });

const res = await fetch(`${URL}/rest/v1/ingredients?on_conflict=slug`, {
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
console.log(res.status, out.slice(0, 300));
