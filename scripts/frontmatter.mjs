// Frontmatter parsing for content/articles/*.md, shared by seed-posts.mjs and
// its test. Extracted from the seeder because a silent parsing failure here
// looks exactly like an authoring mistake: `listValue` used to accept only
// single-line arrays, so a Prettier-style wrapped `tags:` block parsed as []
// and the post reached the DB with no tags at all.

/** Splits a markdown file into its frontmatter block and body. */
export function splitFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2].trim() };
}

/** A quoted or bare scalar. Returns null for missing, empty, or `null`. */
export function scalar(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*"([\\s\\S]*?)"\\s*$`, "m"));
  if (match) return match[1];
  const bare = fm.match(new RegExp(`^${key}:\\s*([^\\n]+)\\s*$`, "m"));
  if (!bare) return null;
  const value = bare[1].trim();
  if (value === "null" || value === "") return null;
  return value.replace(/^"|"$/g, "");
}

/**
 * A flow-style array, inline or wrapped across lines. `[\s\S]*?` rather than
 * `.*?` is the whole point: `.` does not cross newlines, so the wrapped form
 * silently yielded [].
 */
export function listValue(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*\\[([\\s\\S]*?)\\]`, "m"));
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}
