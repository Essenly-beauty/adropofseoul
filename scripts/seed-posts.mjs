// Upserts content/articles/*.md into the posts table.
// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-posts.mjs
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

function scalar(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*"([\\s\\S]*?)"\\s*$`, "m"));
  if (match) return match[1];
  const bare = fm.match(new RegExp(`^${key}:\\s*([^\\n]+)\\s*$`, "m"));
  if (!bare) return null;
  const value = bare[1].trim();
  if (value === "null" || value === "") return null;
  return value.replace(/^"|"$/g, "");
}

function listValue(fm, key) {
  const inline = fm.match(new RegExp(`^${key}:\\s*\\[(.*?)\\]`, "m"));
  if (!inline) return [];
  return inline[1]
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");
const dir = join(root, "content/articles");

const rows = readdirSync(dir)
  .filter((file) => file.endsWith(".md"))
  .map((file) => {
    const text = readFileSync(join(dir, file), "utf8");
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error(`missing frontmatter: ${file}`);
    const fm = match[1];
    const body = match[2].trim();
    return {
      title: scalar(fm, "title"),
      slug: scalar(fm, "slug"),
      subtitle: scalar(fm, "subtitle"),
      excerpt: scalar(fm, "excerpt"),
      body,
      category: scalar(fm, "category") || "beauty",
      tags: listValue(fm, "tags"),
      featured_image: scalar(fm, "featured_image"),
      author: scalar(fm, "author") || "A Drop of Seoul Editorial",
      seo_title: scalar(fm, "seo_title"),
      meta_description: scalar(fm, "meta_description"),
      status: scalar(fm, "status") || "draft",
      published_at: scalar(fm, "published_at"),
    };
  });

const res = await fetch(`${URL}/rest/v1/posts?on_conflict=slug`, {
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
