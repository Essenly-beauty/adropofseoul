// The publish gate. `verified: false` in data/adropofseoul_places.json is the
// only thing keeping fourteen rows off the live site: seed-places.mjs turns it
// into is_published: false, and the checked-in migration a human runs by hand
// is generated from the same pair of JSON files. Both ends are pinned here, so
// publishing a held row takes a deliberate edit to this list.
//
// The migration is not diffed line by line — its string literals contain
// embedded newlines and doubled apostrophes — so the tuples are parsed.
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

const SQL_PATH =
  "supabase/migrations/20260731100000_seed_seoul_attractions.sql";
const source = JSON.parse(
  readFileSync("data/adropofseoul_places.json", "utf8")
);
const curation = JSON.parse(
  readFileSync("data/places-curation.en.json", "utf8")
);
const sqlText = readFileSync(SQL_PATH, "utf8");

// Mirrors seed-places.mjs: excluded slugs never reach the DB, and slugs are
// ASCII-folded on the way in (mércdi → mercdi).
const seeded = source.filter((r) => !curation.excluded[r.slug]);
const asciiSlug = (slug) => slug.normalize("NFD").replace(/[̀-ͯ]/g, "");

const HELD_BY_VERIFICATION = [
  "dolce-far-niente",
  "2s-apgujeong",
  "stone-house-head-spa",
  "asuca",
  "bamboo-therapy",
  "hokutosichisei",
];
const HELD_ON_EDITORIAL_JUDGMENT = [
  "o2-body-foot",
  "eco-jardin",
  "hwangjok-massage",
];
// Unverified in the original Klook dataset, before this branch.
const HELD_PRE_EXISTING = [
  "mércdi-hair-salon",
  "boboris-total-beauty-salon",
  "pingpong-eyelash-salon",
  "shop-vivian-eyelash-extension",
  "as-blanc-lotte-hotel-seoul",
];
const ATTRACTION_HOLDS = [
  ...HELD_BY_VERIFICATION,
  ...HELD_ON_EDITORIAL_JUDGMENT,
];
const UNPUBLISHED = [...ATTRACTION_HOLDS, ...HELD_PRE_EXISTING];

// Places with no address anyone could confirm — seeded blank on purpose.
const NO_ADDRESS = ["jongno-3-ga-stalls-alley", "marzia-healing-spa-cheongdam"];

/**
 * Split the `values (...), (...)` block into tuples of raw field text.
 * Tracks single-quoted literals (with '' escapes) so commas, parentheses and
 * newlines inside copy do not split a row.
 */
function parseTuples(sql) {
  const start = sql.indexOf("\nvalues\n") + "\nvalues\n".length;
  const end = sql.indexOf("\non conflict ");
  const block = sql.slice(start, end);
  const tuples = [];
  let fields = null;
  let cur = "";
  let inStr = false;
  for (let i = 0; i < block.length; i++) {
    const c = block[i];
    if (fields === null) {
      if (c === "(") {
        fields = [];
        cur = "";
      }
      continue;
    }
    if (inStr) {
      cur += c;
      if (c === "'") {
        if (block[i + 1] === "'") {
          cur += "'";
          i++;
        } else inStr = false;
      }
      continue;
    }
    if (c === "'") {
      inStr = true;
      cur += c;
    } else if (c === ",") {
      fields.push(cur.trim());
      cur = "";
    } else if (c === ")") {
      fields.push(cur.trim());
      tuples.push(fields);
      fields = null;
      cur = "";
    } else cur += c;
  }
  return tuples;
}

/** `'a''b'::place_category` → `a'b`; `null` → null. */
function unquote(field) {
  const v = field.replace(/::[a-z_]+$/, "");
  if (v === "null") return null;
  return v.slice(1, -1).replace(/''/g, "'");
}

const tuples = parseTuples(sqlText);
const sqlRows = tuples.map((t) => ({
  slug: unquote(t[0]),
  address: unquote(t[6]),
  isPublished: t[18] === "true",
}));

describe("publish gate — data/adropofseoul_places.json", () => {
  it("holds back exactly the expected slugs", () => {
    const held = source.filter((r) => r.verified !== true).map((r) => r.slug);
    expect(held.sort()).toEqual([...UNPUBLISHED].sort());
  });

  it("seeds 205 rows, 191 published and 14 held", () => {
    expect(seeded).toHaveLength(205);
    expect(seeded.filter((r) => r.verified === true)).toHaveLength(191);
    expect(seeded.filter((r) => r.verified !== true)).toHaveLength(14);
  });

  it("has a curation entry for every seeded row", () => {
    const missing = seeded
      .filter((r) => !curation.places[r.slug])
      .map((r) => r.slug);
    expect(missing).toEqual([]);
  });

  it("excludes only slugs the source dataset actually has", () => {
    const slugs = new Set(source.map((r) => r.slug));
    const dead = Object.keys(curation.excluded).filter((s) => !slugs.has(s));
    expect(dead).toEqual([]);
  });

  it("records why each held attraction row is unpublished", () => {
    for (const slug of ATTRACTION_HOLDS) {
      const reason = curation.places[slug]?.unpublishedReason;
      expect(typeof reason, slug).toBe("string");
      expect(reason.length, slug).toBeGreaterThan(20);
    }
  });
});

describe(`generated migration — ${SQL_PATH}`, () => {
  it("parses into 205 complete rows, matching its own header", () => {
    expect(tuples).toHaveLength(205);
    for (const t of tuples) expect(t).toHaveLength(19);
    expect(sqlText).toContain("directory (205 rows)");
  });

  it("agrees with the JSON row for row on is_published", () => {
    const expected = Object.fromEntries(
      seeded.map((r) => [asciiSlug(r.slug), r.verified === true])
    );
    const actual = Object.fromEntries(
      sqlRows.map((r) => [r.slug, r.isPublished])
    );
    expect(actual).toEqual(expected);
  });

  it("writes is_published false for every held row", () => {
    const held = sqlRows.filter((r) => !r.isPublished).map((r) => r.slug);
    expect(held.sort()).toEqual(UNPUBLISHED.map(asciiSlug).sort());
    expect(sqlRows.filter((r) => r.isPublished)).toHaveLength(191);
  });

  it("ships a blank address only where none could be confirmed", () => {
    const blank = sqlRows.filter((r) => r.address === "").map((r) => r.slug);
    expect(blank.sort()).toEqual([...NO_ADDRESS].sort());
    for (const slug of NO_ADDRESS)
      expect(source.find((r) => r.slug === slug).address, slug).toBe("");
  });
});
