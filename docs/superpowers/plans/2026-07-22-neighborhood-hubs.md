# Neighborhood Hubs (Phase b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Hongdae, Myeongdong, and Gangnam & Cheongdam purpose-based hubs from existing published data, per `docs/superpowers/specs/2026-07-22-neighborhood-hubs-design.md`.

**Architecture:** Pure config + two small mechanical extensions: `Neighborhood.areas` (multi-area hubs) with a `neighborhoodAreas` helper, and an `areas` filter on `listPlaces`. No data changes, no migrations, no new components.

**Tech Stack:** Next.js App Router, Vitest.

## Global Constraints

- No data-file or migration changes in this plan. Only `lib/taxonomy.ts`, `lib/taxonomy.test.ts`, `services/places.ts`, `components/around-seoul/NeighborhoodDirectory.tsx`, `app/around-seoul/[neighborhood]/page.tsx` may change.
- Do NOT touch `data/beauty-pipeline/**`.
- All copy strings below are final editorial copy — transcribe verbatim.
- Verification: `npm run typecheck`, `npm run test`, `npm run build` from the worktree root.
- Branch: `feat/neighborhood-hubs` (stacked on `feat/seongsu-purpose-guide`).

---

### Task 1: Taxonomy — areas support + three neighborhood configs

**Files:**

- Modify: `lib/taxonomy.ts` (Neighborhood type; `AROUND_SEOUL_NEIGHBORHOODS`; helper next to `getNeighborhood`)
- Test: `lib/taxonomy.test.ts` (append)

**Interfaces:**

- Consumes: existing `Neighborhood`, `NeighborhoodSection`, `PLACE_TYPE_LABELS`, `getNeighborhood`.
- Produces (used by Task 2): `Neighborhood.areas?: string[]`; `export function neighborhoodAreas(n: Neighborhood): string[]` returning `n.areas ?? [n.label]`.

- [ ] **Step 1: Write the failing tests** — append to `lib/taxonomy.test.ts` (add `neighborhoodAreas` and `AROUND_SEOUL_NEIGHBORHOODS` to the existing import from `./taxonomy`):

```ts
describe("phase-b neighborhoods", () => {
  it("exposes the four neighborhoods in order", () => {
    expect(AROUND_SEOUL_NEIGHBORHOODS.map((n) => n.slug)).toEqual([
      "seongsu",
      "hongdae",
      "myeongdong",
      "gangnam-cheongdam",
    ]);
  });

  it("derives hub areas with label fallback", () => {
    expect(neighborhoodAreas(getNeighborhood("myeongdong")!)).toEqual([
      "Myeongdong",
    ]);
    expect(neighborhoodAreas(getNeighborhood("hongdae")!)).toEqual([
      "Hongdae",
      "Yeonnam",
    ]);
    expect(neighborhoodAreas(getNeighborhood("gangnam-cheongdam")!)).toEqual([
      "Gangnam",
      "Cheongdam",
      "Apgujeong",
      "Garosugil",
    ]);
  });

  it("only uses known place types in section configs", () => {
    for (const n of AROUND_SEOUL_NEIGHBORHOODS)
      for (const s of n.sections ?? [])
        for (const c of s.categories)
          expect(
            PLACE_TYPE_LABELS[c],
            `${n.slug} / ${s.title} / ${c}`
          ).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- lib/taxonomy.test.ts`
Expected: FAIL — `neighborhoodAreas` not exported; neighborhoods array has 1 entry.

- [ ] **Step 3: Implement in `lib/taxonomy.ts`**

Extend `Neighborhood` (after the `sections?` field):

```ts
  /** Place `area` values this hub aggregates; defaults to [label]. */
  areas?: string[];
```

Add after `getNeighborhood`:

```ts
/** The place `area` values that belong to a neighborhood hub. */
export function neighborhoodAreas(n: Neighborhood): string[] {
  return n.areas ?? [n.label];
}
```

Append to `AROUND_SEOUL_NEIGHBORHOODS` after the Seongsu entry, verbatim:

```ts
  {
    slug: "hongdae",
    label: "Hongdae",
    blurb:
      "Personal color, nails, lashes, and indie perfume — Seoul's youngest beauty district.",
    heading: "Hongdae, in full color",
    lede: "Hongdae is where Seoul gets its color done — the personal-color capital, plus walk-in friendly salons, lash and nail studios, and perfume labs, all at student-district prices.",
    areas: ["Hongdae", "Yeonnam"],
    sections: [
      {
        title: "Personal color & makeup",
        blurb: "Where Seoul's personal-color boom lives — book ahead.",
        categories: ["personal_color", "makeup"],
      },
      {
        title: "Nails & lashes",
        blurb: "Detail work Hongdae does better than anywhere.",
        categories: ["nail_lash"],
      },
      {
        title: "Hair salons",
        blurb: "English-friendly cuts and color without the Gangnam price tag.",
        categories: ["salon"],
      },
      {
        title: "Perfume workshops",
        blurb: "Blend your own bottle to take home.",
        categories: ["perfume"],
        entryType: "experience",
      },
      {
        title: "Spa & skin",
        blurb: "Scrubs, facials, and skin clinics between the studios.",
        categories: ["spa", "facial", "clinic"],
      },
    ],
  },
  {
    slug: "myeongdong",
    label: "Myeongdong",
    blurb: "Spas, facials, and walk-in salons in the heart of tourist Seoul.",
    heading: "Myeongdong, made easy",
    lede: "Myeongdong is Seoul's beauty-service hub for first-timers — the densest cluster of tourist-friendly spas, facials, and walk-in salons, minutes from the flagship shopping streets.",
    sections: [
      {
        title: "Spa & massage",
        blurb: "Full-body, foot, and everything in between — no Korean needed.",
        categories: ["spa"],
      },
      {
        title: "Facial & skincare",
        blurb: "Glass-skin facials an elevator ride from the shopping.",
        categories: ["facial"],
      },
      {
        title: "Hair & makeup",
        blurb: "Walk-in friendly salons used to international guests.",
        categories: ["salon", "makeup"],
      },
      {
        title: "Personal color",
        blurb: "Quick diagnoses that fit between itinerary stops.",
        categories: ["personal_color"],
      },
    ],
  },
  {
    slug: "gangnam-cheongdam",
    label: "Gangnam & Cheongdam",
    blurb: "K-pop hair & makeup, head spas, and the premium end of K-beauty.",
    heading: "Gangnam & Cheongdam, the premium tier",
    lede: "South of the river is Seoul's premium tier — the K-pop stylist salons of Cheongdam, the city's head-spa district, and the studios where personal color analysis got serious.",
    areas: ["Gangnam", "Cheongdam", "Apgujeong", "Garosugil"],
    sections: [
      {
        title: "K-pop hair & makeup",
        blurb: "The salons idols actually sit in — book well ahead.",
        categories: ["salon", "makeup"],
      },
      {
        title: "Head spa & massage",
        blurb: "Seoul's head-spa district, plus aroma and body work.",
        categories: ["head_spa", "spa"],
      },
      {
        title: "Personal color",
        blurb: "The first-generation studios that started the trend.",
        categories: ["personal_color"],
      },
      {
        title: "Classes & workshops",
        blurb: "Private perfume blending and hands-on Korean cooking.",
        categories: ["perfume", "cooking_class"],
        entryType: "experience",
      },
      {
        title: "Nails & clinics",
        blurb: "Celebrity nail art and dermatology-grade skin care.",
        categories: ["nail_lash", "clinic"],
      },
    ],
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- lib/taxonomy.test.ts` — Expected: PASS (all, including pre-existing).
Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/taxonomy.ts lib/taxonomy.test.ts
git commit -m "feat(taxonomy): Hongdae, Myeongdong, Gangnam & Cheongdam hub configs with multi-area support"
```

---

### Task 2: Service + page — areas filter and multi-area-safe links

**Files:**

- Modify: `services/places.ts` (`listPlaces`)
- Modify: `components/around-seoul/NeighborhoodDirectory.tsx` (link building)
- Modify: `app/around-seoul/[neighborhood]/page.tsx` (fetch + footer link)

**Interfaces:**

- Consumes: `neighborhoodAreas` from Task 1.
- Produces: `listPlaces` accepts `{ limit?, category?, area?, areas? }`.

- [ ] **Step 1: `services/places.ts`** — extend the options type and add one filter line after the existing `area` filter:

```ts
export async function listPlaces(
  opts: {
    limit?: number;
    category?: string;
    area?: string;
    areas?: string[];
  } = {}
): Promise<Place[]> {
```

```ts
if (opts.area) query = query.eq("area", opts.area);
if (opts.areas?.length) query = query.in("area", opts.areas);
```

- [ ] **Step 2: `components/around-seoul/NeighborhoodDirectory.tsx`** — replace the `filter` URL construction inside the section map with a params builder that drops `area` for multi-area hubs (the label of a multi-area hub is not a valid `area` value on `/places`):

```tsx
const params = new URLSearchParams();
if (!neighborhood.areas) params.set("area", neighborhood.label);
if (section.categories.length === 1)
  params.set("type", placeTypeSlug(section.categories[0]));
else if (section.entryType) params.set("kind", section.entryType);
const query = params.toString();
const filter = query ? `/places?${query}` : "/places";
```

- [ ] **Step 3: `app/around-seoul/[neighborhood]/page.tsx`** — import `neighborhoodAreas` from `@/lib/taxonomy`; change `neighborhoodPlaces` to take the area list and raise the limit:

```tsx
// Published places for the hub's purpose sections; hubs render fine without.
// limit 200 matches /places; revisit if any hub's row count approaches it.
async function neighborhoodPlaces(areas: string[]): Promise<Place[]> {
  try {
    return await listPlaces({ limit: 200, areas });
  } catch (err) {
    console.error("around-seoul: places fetch failed", err);
    return [];
  }
}
```

Call site: `const places = n.sections?.length ? await neighborhoodPlaces(neighborhoodAreas(n)) : [];`

Bottom "Browse the {n.label} directory →" link: drop the `area` param for multi-area hubs:

```tsx
          <Link
            href={
              n.areas
                ? "/places"
                : `/places?area=${encodeURIComponent(n.label)}`
            }
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck` && `npm run test` && `npm run build` — Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add services/places.ts components/around-seoul/NeighborhoodDirectory.tsx "app/around-seoul/[neighborhood]/page.tsx"
git commit -m "feat(around-seoul): multi-area hub fetch and directory links"
```
