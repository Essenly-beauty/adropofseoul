# Seongsu Purpose-Based Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed a curated shops/cafés/services layer for Seongsu and restructure the Seongsu hub (`/around-seoul/seongsu`) into purpose-based sections, per the approved spec `docs/superpowers/specs/2026-07-21-seongsu-purpose-guide-design.md`.

**Architecture:** No DB schema change. New curated rows flow through the existing two-JSON structure (`data/adropofseoul_places.json` + `data/places-curation.en.json`) into `scripts/seed-places.mjs`. The hub page gains a config-driven directory: a `sections` field on `Neighborhood` in `lib/taxonomy.ts`, a pure grouping helper, and one new server component. Other neighborhoods are unaffected (no `sections` → renders as today).

**Tech Stack:** Next.js App Router (server components), Supabase (PostgREST), Vitest, plain Node seed script.

## Global Constraints

- First-party sources only for venue data: official site, official Instagram, brand press pages. Never copy text, ratings, or reviews from Naver/Google/Kakao/Klook. Map deep links are out of scope for new entries in this plan (`googleMaps`/`naverMap`: `null`; can be added later by hand).
- All new entries: `"rating": null, "reviews": null, "verified": false` (→ seeded `is_published: false`). Publication happens only in Task 6 after per-venue confirmation and user sign-off.
- All new Seongsu entries: curation `"area": "Seongsu"` exactly (the hub filter is an exact match on that string).
- Pop-up/temporary spaces are excluded. If a venue turns out to be a pop-up or closed during lookup, drop it — do not seed it.
- Slugs: lowercase-ASCII-hyphenated, must be unique in `data/adropofseoul_places.json`. Every source entry MUST have a same-slug entry in `curation.places` (the seed script throws otherwise).
- Do NOT touch `data/beauty-pipeline/**` — it has unrelated in-flight changes. Commit only files this plan names.
- Verification commands: `npm run typecheck`, `npm run test`, `npm run build` (run from repo root).

---

### Task 1: Taxonomy — neighborhood sections + grouping helper

**Files:**

- Modify: `lib/taxonomy.ts` (Neighborhood type ~L82-93, Seongsu entry ~L95-105; add helper near the place-types block ~L121)
- Test: `lib/taxonomy.test.ts` (append)

**Interfaces:**

- Consumes: existing `Neighborhood`, `PlaceEntryKind` types in `lib/taxonomy.ts`.
- Produces (used by Task 4):
  - `export type NeighborhoodSection = { title: string; blurb?: string; categories: string[]; entryType?: PlaceEntryKind }`
  - `Neighborhood` gains optional `sections?: NeighborhoodSection[]`
  - `export function groupPlacesBySection<T extends { category: string; entryType: PlaceEntryKind }>(places: T[], sections: NeighborhoodSection[]): { section: NeighborhoodSection; places: T[] }[]` — section order preserved, each place lands in the FIRST matching section only, empty sections omitted.

- [ ] **Step 1: Write the failing tests** — append to `lib/taxonomy.test.ts` (add `groupPlacesBySection` and `type NeighborhoodSection` to the existing import from `./taxonomy`):

```ts
describe("groupPlacesBySection", () => {
  const sections: NeighborhoodSection[] = [
    { title: "Shops", categories: ["shop"] },
    {
      title: "Classes",
      categories: ["perfume", "facial"],
      entryType: "experience",
    },
    { title: "Services", categories: ["salon", "facial"], entryType: "place" },
  ];
  const p = (
    category: string,
    entryType: "place" | "experience" = "place"
  ) => ({ category, entryType });

  it("groups by category in section order and drops empty sections", () => {
    const groups = groupPlacesBySection([p("salon"), p("shop")], sections);
    expect(groups.map((g) => g.section.title)).toEqual(["Shops", "Services"]);
  });

  it("routes the same category to different sections by entry type", () => {
    const groups = groupPlacesBySection(
      [p("facial", "experience"), p("facial", "place")],
      sections
    );
    expect(groups.map((g) => g.section.title)).toEqual(["Classes", "Services"]);
    expect(groups[0].places).toHaveLength(1);
  });

  it("assigns each place to the first matching section only", () => {
    const overlapping: NeighborhoodSection[] = [
      { title: "A", categories: ["shop"] },
      { title: "B", categories: ["shop"] },
    ];
    const groups = groupPlacesBySection([p("shop")], overlapping);
    expect(groups).toHaveLength(1);
    expect(groups[0].section.title).toBe("A");
  });

  it("returns nothing when no places match", () => {
    expect(groupPlacesBySection([p("cafe")], sections)).toEqual([]);
  });

  it("gives Seongsu a purpose-section config in editorial order", () => {
    expect(getNeighborhood("seongsu")?.sections?.map((s) => s.title)).toEqual([
      "Shop the flagships",
      "Warehouse cafés",
      "Make something",
      "Beauty services on the rise",
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- lib/taxonomy.test.ts`
Expected: FAIL — `groupPlacesBySection` / `NeighborhoodSection` not exported.

- [ ] **Step 3: Implement in `lib/taxonomy.ts`**

Add above the `Neighborhood` type (note: `PlaceEntryKind` is currently declared _below_ the neighborhood block at ~L160 — move the `PLACE_ENTRY_KINDS` const + `PlaceEntryKind` type declaration up above `NeighborhoodSection`, unchanged, so the reference resolves):

```ts
/** One purpose-based group on a neighborhood hub page. */
export type NeighborhoodSection = {
  /** Section heading, e.g. "Shop the flagships". */
  title: string;
  /** Optional one-line intro under the heading. */
  blurb?: string;
  /** place_category enum values that belong to this section. */
  categories: string[];
  /** Restrict to one entry kind; omit to accept both. */
  entryType?: PlaceEntryKind;
};
```

Extend `Neighborhood` with:

```ts
  /** Purpose-based directory sections, in editorial order. */
  sections?: NeighborhoodSection[];
```

Replace the Seongsu entry's `lede` and add `sections` (keep slug/label/blurb/heading/hasMap as they are):

```ts
    lede: "Seongsu is where Seoul's beauty industry actually works — flagship stores, warehouse cafés, and the workshops behind them. Shop the flagships people fly in for, take the classes locals book, and walk our cross-checked beauty-and-bites mile on the map below.",
    hasMap: true,
    sections: [
      {
        title: "Shop the flagships",
        blurb:
          "The K-beauty and fashion flagships people actually fly in for.",
        categories: ["shop"],
      },
      {
        title: "Warehouse cafés",
        blurb: "Factory-conversion coffee — Seongsu's original draw.",
        categories: ["cafe"],
      },
      {
        title: "Make something",
        blurb:
          "Perfume, makeup, and traditional-drink classes worth booking ahead.",
        categories: ["perfume", "makeup", "cooking_class", "facial"],
        entryType: "experience",
      },
      {
        title: "Beauty services on the rise",
        blurb:
          "Salons and studios locals book by DM — barely on the booking apps yet.",
        categories: [
          "personal_color",
          "nail_lash",
          "salon",
          "head_spa",
          "spa",
          "facial",
        ],
        entryType: "place",
      },
    ],
```

(Spec deviation, intentional: `facial` also appears in "Make something" restricted to `experience`, so the existing whipped-face-mask _class_ lands in workshops while facial _shops_ land in services. The `entryType` split keeps the two disjoint.)

Add the helper after `placeTypeSlug`:

```ts
/**
 * Group places into a neighborhood's sections. Section order is preserved,
 * each place lands in the first section whose categories (and entryType,
 * when set) match, and empty sections are omitted.
 */
export function groupPlacesBySection<
  T extends { category: string; entryType: PlaceEntryKind },
>(
  places: T[],
  sections: NeighborhoodSection[]
): { section: NeighborhoodSection; places: T[] }[] {
  const remaining = [...places];
  const groups: { section: NeighborhoodSection; places: T[] }[] = [];
  for (const section of sections) {
    const matched: T[] = [];
    for (let i = 0; i < remaining.length;) {
      const p = remaining[i];
      if (
        section.categories.includes(p.category) &&
        (!section.entryType || p.entryType === section.entryType)
      ) {
        matched.push(p);
        remaining.splice(i, 1);
      } else {
        i++;
      }
    }
    if (matched.length > 0) groups.push({ section, places: matched });
  }
  return groups;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- lib/taxonomy.test.ts` — Expected: PASS (all, including pre-existing).
Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/taxonomy.ts lib/taxonomy.test.ts
git commit -m "feat(taxonomy): neighborhood purpose sections + place grouping helper"
```

---

### Task 2: Curation data — Seongsu shops & cafés

**Files:**

- Modify: `data/adropofseoul_places.json` (append entries)
- Modify: `data/places-curation.en.json` (append to `places` map)

**Interfaces:**

- Consumes: existing JSON shapes (see worked example below); `scripts/seed-places.mjs` reads `slug, nameKr, rating, reviews, website, instagram, address, googleMaps, naverMap, verified` from source and `name, category, kind, area, serviceDetail, summary, bestFor, whyWeLikeIt, longDescription` from curation.
- Produces: 12–16 new `shop`/`cafe` rows with `area: "Seongsu"`, `verified: false`, consumed by Tasks 5–6.

- [ ] **Step 1: Research each venue from its official channel.** For each venue below, WebFetch/WebSearch the official site or official Instagram and capture: current operating status (drop pop-ups/closed), Korean name, road address (도로명), official website URL, official Instagram handle. These are the researched starting points — trust the official channel over this table if they disagree:

| Venue (EN / KR)                                                  | category / serviceDetail       | Known official source                         |
| ---------------------------------------------------------------- | ------------------------------ | --------------------------------------------- |
| Olive Young N Seongsu / 올리브영 N 성수                          | shop / K-beauty flagship       | oliveyoung.co.kr store guide                  |
| Amore Seongsu / 아모레성수                                       | shop / K-beauty flagship       | global.amoremall.com/pages/about-amoreseongsu |
| Tamburins Seongsu / 탬버린즈 성수                                | shop / Fragrance flagship      | tamburins.com/en/store/korea                  |
| Nonfiction Seongsu / 논픽션 성수                                 | shop / Fragrance flagship      | nonfiction.com/pages/stores                   |
| TIRTIR Seongsu / 티르티르 성수 (verify it exists as permanent)   | shop / K-beauty flagship       | official IG                                   |
| Amuse Seongsu showroom / 어뮤즈 성수 (verify)                    | shop / K-beauty flagship       | official IG                                   |
| fwee Seongsu / 퓌 성수 (verify)                                  | shop / K-beauty flagship       | official IG                                   |
| Musinsa Seongsu / 무신사 성수 (verify visitable store vs office) | shop / Fashion flagship        | musinsa.com                                   |
| Ader Error Seongsu Space / 아더에러 성수                         | shop / Fashion flagship        | adererror.com                                 |
| LCDC Seoul / LCDC 서울                                           | shop / Select shop complex     | lcdc-seoul.com                                |
| EQL Grove / 이큐엘 성수 (verify)                                 | shop / Select shop             | official IG                                   |
| Matin Kim Seongsu / 마뗑킴 성수 (verify)                         | shop / Fashion flagship        | matinkim.com                                  |
| Onion Seongsu / 어니언 성수                                      | cafe / Warehouse café & bakery | official IG @cafe.onion                       |
| Daelim Changgo / 대림창고                                        | cafe / Warehouse café-gallery  | official IG                                   |
| Center Coffee Seoul Forest / 센터커피 서울숲                     | cafe / Specialty roaster       | centercoffee.co.kr                            |
| Mesh Coffee / 메쉬커피                                           | cafe / Specialty espresso bar  | official IG                                   |

Venues marked "(verify)" that can't be confirmed permanent-and-operating from an official channel are dropped; target is 12–16 surviving entries.

- [ ] **Step 2: Append one entry per surviving venue to BOTH files.** Match the key set of existing entries in each file; unknown optional values are `null`. Worked example (repeat this shape for every venue):

`data/adropofseoul_places.json` (append to the array):

```json
{
  "slug": "amore-seongsu",
  "category": "뷰티",
  "entryType": "장소",
  "type": "브랜드 플래그십",
  "region": "성수",
  "nameEn": "Amore Seongsu",
  "nameKr": "아모레성수",
  "rating": null,
  "reviews": null,
  "website": "https://global.amoremall.com/pages/about-amoreseongsu",
  "instagram": "@amore_seongsu",
  "address": "서울 성동구 아차산로11길 7",
  "googleMaps": null,
  "naverMap": null,
  "reviewSummary": null,
  "verified": false
}
```

`data/places-curation.en.json` (add to the `places` map; `summary`/`bestFor`/`whyWeLikeIt` are 1–2 sentences of ORIGINAL editorial writing grounded in the official source — never copied review text):

```json
"amore-seongsu": {
  "name": "Amore Seongsu",
  "category": "shop",
  "kind": "place",
  "area": "Seongsu",
  "serviceDetail": "K-beauty flagship",
  "summary": "Amorepacific's flagship experience space in a converted repair shop — test 2,000+ products across 30+ brands, no checkout pressure.",
  "bestFor": "Trying the whole Amorepacific universe before you buy",
  "whyWeLikeIt": "It's built as a showroom, not a store — plus free luggage lockers, which every carry-on traveler eventually thanks them for."
}
```

Cafés use `"category": "카페"` / curation `"category": "cafe"`; fashion shops use source `"category": "패션"` and curation `"category": "shop"` with `serviceDetail` carrying the distinction (`"Fashion flagship"`, `"Select shop"`).

- [ ] **Step 3: Validate with the seed dry-run**

Run: `node scripts/seed-places.mjs --dry-run`
Expected: no throw (a missing curation entry throws `no curation entry for <slug>`); row count = 90 + number of new entries; `categories:` now includes `shop` and `cafe`; `areas:` still a small clean set containing `Seongsu`.
Also run: `python3 -c "import json; json.load(open('data/adropofseoul_places.json')); json.load(open('data/places-curation.en.json'))"` — Expected: silent (valid JSON).

- [ ] **Step 4: Commit**

```bash
git add data/adropofseoul_places.json data/places-curation.en.json
git commit -m "feat(data): curated Seongsu shops, flagships, and cafés (unpublished)"
```

---

### Task 3: Curation data — Seongsu beauty services on the rise

**Files:**

- Modify: `data/adropofseoul_places.json` (append)
- Modify: `data/places-curation.en.json` (append)

**Interfaces:** identical shapes to Task 2; produces 5–8 new service rows (`personal_color` / `nail_lash` / `salon` / `head_spa`), `kind: "place"`, `area: "Seongsu"`, `verified: false`.

- [ ] **Step 1: Research each venue from its official channel** (same procedure and drop rule as Task 2 Step 1):

| Venue (EN / KR)                                       | category / serviceDetail                             | Known official source              |
| ----------------------------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| In The Pink / 인더핑크 성수                           | personal_color / English-first personal color studio | inthepink-color.com                |
| Damppeum / 담뿜 성수 (verify official channel)        | personal_color / Personal color diagnosis            | official IG                        |
| CCL Color Image Convergence Lab / CCL 컬러랩 (verify) | personal_color / Personal color diagnosis            | official IG                        |
| 5x5 Nail Studio / 오오네일 성수 (verify)              | nail_lash / Nail art studio                          | official IG                        |
| Dakyo Nail Seongsu / 다쿄네일 성수 (verify)           | nail_lash / Nail art studio                          | official IG                        |
| FUSS Seongsu / 퍼스 성수 (verify)                     | head_spa / Scalp analysis & head spa                 | official IG                        |
| SOONSIKI Seongsu / 순시키 성수                        | salon / English-friendly hair salon                  | hongdaehairsalon.com (branch list) |

- [ ] **Step 2: Append entries to both files** using exactly the Task 2 Step 2 shapes (source `"category": "뷰티"`, `"entryType": "장소"`; curation `"kind": "place"`). Note these are the venues that book via Instagram DM — `website` may legitimately be `null` with only `instagram` set.

- [ ] **Step 3: Validate with the seed dry-run**

Run: `node scripts/seed-places.mjs --dry-run`
Expected: no throw; row count = Task 2 count + new service entries; `categories:` includes `personal_color` and `nail_lash` with increased counts.

- [ ] **Step 4: Commit**

```bash
git add data/adropofseoul_places.json data/places-curation.en.json
git commit -m "feat(data): curated Seongsu rising beauty services (unpublished)"
```

---

### Task 4: Hub page — area filter + purpose-section directory

**Files:**

- Modify: `services/places.ts` (`listPlaces`, ~L64-79)
- Create: `components/around-seoul/NeighborhoodDirectory.tsx`
- Modify: `app/around-seoul/[neighborhood]/page.tsx`

**Interfaces:**

- Consumes: `groupPlacesBySection`, `NeighborhoodSection`, `Neighborhood`, `placeTypeSlug` from Task 1; existing `PlaceCard` (`{ place: Place }`), `Place` type (`services/types`), `listPlaces`.
- Produces: `listPlaces` accepts `{ limit?, category?, area? }`; `NeighborhoodDirectory({ neighborhood, places })` server component.

- [ ] **Step 1: Add the `area` option to `listPlaces`** in `services/places.ts` — change the signature and add one filter line after the `category` filter:

```ts
export async function listPlaces(
  opts: { limit?: number; category?: string; area?: string } = {}
): Promise<Place[]> {
```

```ts
if (opts.category) query = query.eq("category", opts.category);
if (opts.area) query = query.eq("area", opts.area);
```

(No unit test: the change is one PostgREST filter line and the service layer has no supabase test harness; covered by typecheck + Task 5 manual check.)

- [ ] **Step 2: Create `components/around-seoul/NeighborhoodDirectory.tsx`** (complete file):

```tsx
import Link from "next/link";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import {
  groupPlacesBySection,
  placeTypeSlug,
  type Neighborhood,
} from "@/lib/taxonomy";
import type { Place } from "@/services/types";

// Purpose-first directory for a neighborhood hub: published places grouped
// into the neighborhood's configured sections, in editorial order. Renders
// nothing when the neighborhood has no section config or no places matched.
export function NeighborhoodDirectory({
  neighborhood,
  places,
}: {
  neighborhood: Neighborhood;
  places: Place[];
}) {
  const sections = neighborhood.sections ?? [];
  if (sections.length === 0 || places.length === 0) return null;
  const groups = groupPlacesBySection(places, sections);
  if (groups.length === 0) return null;
  return (
    <div className="mt-16 space-y-14">
      {groups.map(({ section, places: grouped }) => {
        const filter =
          section.categories.length === 1
            ? `/places?area=${encodeURIComponent(neighborhood.label)}&type=${placeTypeSlug(section.categories[0])}`
            : `/places?area=${encodeURIComponent(neighborhood.label)}`;
        return (
          <section key={section.title}>
            <h2 className="font-serif text-2xl md:text-3xl">{section.title}</h2>
            {section.blurb && (
              <p className="mt-1.5 max-w-2xl text-text-muted">
                {section.blurb}
              </p>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.map((pl) => (
                <PlaceCard key={pl.id} place={pl} />
              ))}
            </div>
            <p className="mt-4 text-sm">
              <Link
                href={filter}
                className="text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
              >
                Browse all in the directory →
              </Link>
            </p>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Wire it into `app/around-seoul/[neighborhood]/page.tsx`.** Add imports:

```tsx
import { NeighborhoodDirectory } from "@/components/around-seoul/NeighborhoodDirectory";
import { listPlaces } from "@/services/places";
import type { Place } from "@/services/types";
```

Add next to `neighborhoodPosts` (same error-swallowing idiom):

```tsx
// Published places for the hub's purpose sections; hubs render fine without.
async function neighborhoodPlaces(area: string): Promise<Place[]> {
  try {
    return await listPlaces({ limit: 100, area });
  } catch (err) {
    console.error("around-seoul: places fetch failed", err);
    return [];
  }
}
```

In the page component, fetch only when the neighborhood has sections, and render the directory between the map and the guides grid:

```tsx
const posts = await neighborhoodPosts(n.slug);
const places = n.sections?.length ? await neighborhoodPlaces(n.label) : [];
```

```tsx
{
  n.hasMap && <SeongsuMap course={1} className="mx-auto max-w-3xl" />;
}

<NeighborhoodDirectory neighborhood={n} places={places} />;
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck` — Expected: clean.
Run: `npm run test` — Expected: all pass.
Run: `npm run build` — Expected: builds (page is `force-dynamic`; no DB needed at build).

- [ ] **Step 5: Commit**

```bash
git add services/places.ts components/around-seoul/NeighborhoodDirectory.tsx "app/around-seoul/[neighborhood]/page.tsx"
git commit -m "feat(around-seoul): purpose-based place sections on neighborhood hubs"
```

---

### Task 5: Seed migration + local verification

**Files:**

- Create: `supabase/migrations/<timestamp>_seed_seongsu_purpose_places.sql` (generated)

**Interfaces:**

- Consumes: JSON data from Tasks 2–3; `scripts/seed-places.mjs --sql` (regenerates ALL rows as an idempotent upsert on slug — existing rows are re-asserted unchanged, which is the established pattern from `20260720010121_seed_places_directory.sql`).

- [ ] **Step 1: Generate the migration**

```bash
node scripts/seed-places.mjs --sql supabase/migrations/$(date +%Y%m%d%H%M%S)_seed_seongsu_purpose_places.sql
```

Expected: `wrote supabase/migrations/<ts>_seed_seongsu_purpose_places.sql (<N> rows)` where N matches the Task 3 dry-run count.

- [ ] **Step 2: Inspect the generated SQL** — spot-check: new slugs present with `false` as the final (`is_published`) value; existing published rows (e.g. `argyol-seongsu`) still end in `true`; every new row's area literal is `'Seongsu'`. Any mismatch → fix the JSONs, regenerate, re-check.

- [ ] **Step 3: Apply and verify against the DB.** The Supabase free-tier project auto-pauses — wake it from the dashboard first if data pages 500.

```bash
npm run db:push
```

Expected: migration applies cleanly. Then verify via the running app: `npm run dev`, open `/around-seoul/seongsu` — new rows must NOT appear yet (unpublished); `/places?area=Seongsu` shows only the previously published Seongsu rows; the four hub sections render with whatever published places already match (experiences + services backbone).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/*_seed_seongsu_purpose_places.sql
git commit -m "feat(db): seed Seongsu purpose-layer places (unpublished pending verification)"
```

---

### Task 6: Venue verification pass + publish gate

**Files:**

- Modify: `data/adropofseoul_places.json` (flip `verified` per venue)
- Create: `supabase/migrations/<timestamp>_publish_seongsu_places.sql` (regenerated seed)

**Interfaces:** consumes everything prior; final user-facing state change.

- [ ] **Step 1: Per-venue verification.** For every entry added in Tasks 2–3: re-fetch the official site/Instagram; confirm (a) currently operating, (b) address matches, (c) links live. Record a one-line verdict per venue. Confirmed → set `"verified": true` in `data/adropofseoul_places.json`. Unconfirmable → leave `false`.

- [ ] **Step 2: STOP — user review gate.** Present the verdict list (venue, category, verdict, evidence link) to the user and get explicit approval on the publish set. Do not proceed without it. Adjust flags per their answer.

- [ ] **Step 3: Regenerate + apply**

```bash
node scripts/seed-places.mjs --sql supabase/migrations/$(date +%Y%m%d%H%M%S)_publish_seongsu_places.sql
npm run db:push
```

Expected: approved venues flip to `is_published = true`.

- [ ] **Step 4: Manual end-check** — `/around-seoul/seongsu` shows all four sections populated (flagships, cafés, workshops, services); `/places?area=Seongsu&type=shop` filters correctly; a non-section neighborhood (`/around-seoul/common`) renders unchanged.

- [ ] **Step 5: Commit**

```bash
git add data/adropofseoul_places.json supabase/migrations/*_publish_seongsu_places.sql
git commit -m "feat(data): publish verified Seongsu purpose-layer places"
```
