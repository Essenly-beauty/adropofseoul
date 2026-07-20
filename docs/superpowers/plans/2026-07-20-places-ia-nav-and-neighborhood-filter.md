# Places IA: Lean Nav + Neighborhood Filter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "All Places →" link to the Places nav dropdown and a client-side neighborhood filter to the `/places` hub, without touching the already-working category routes.

**Architecture:** The nav is data-driven from `lib/nav.ts` (one array edit). The `/places` page is a server component; its static card grid is replaced by a new client component `PlacesDirectory` that owns neighborhood chip state and renders the filtered grid with the existing `DiscoveryPlaceCard`. Category pages (`/places/hair-salons`, etc.) already work via the hybrid `app/places/[slug]/page.tsx` and are NOT modified.

**Tech Stack:** Next.js (App Router), React (client component with `useState`), TypeScript, Vitest + React Testing Library, Tailwind.

## Global Constraints

- Package manager / test runner: `npm`, tests via `vitest` (config in `vitest.config.ts`).
- Client components must start with `"use client";`.
- Reuse `DiscoveryPlaceCard` from `components/editorial/DiscoveryCards.tsx` — do not reimplement card markup.
- `Place` type and `PLACES` array come from `@/lib/discovery`. Each place has `slug: string`, `type: PlaceType`, `neighborhood: string`.
- Match existing Tailwind conventions for filter chips (mirror the type-pill styling in `app/places/page.tsx`: `rounded-full border border-soft-gray px-4 py-2 text-xs uppercase tracking-label text-text-muted ... hover:border-accent hover:text-accent`).
- Commit after each task. Do NOT push unless asked.

---

### Task 1: Add "All Places →" to the Places nav dropdown

**Files:**

- Modify: `lib/nav.ts` (Places dropdown `items`, lines 20-29)
- Test: `components/editorial/SiteHeader.test.tsx`

**Interfaces:**

- Consumes: `NAV_ITEMS` shape `{ label: string; href: string; items?: {label,href}[] }`.
- Produces: Places dropdown now includes `{ label: "All Places →", href: "/places" }` as the last item.

- [ ] **Step 1: Write the failing test**

Add this test inside the existing `describe("SiteHeader", ...)` block in `components/editorial/SiteHeader.test.tsx`:

```tsx
it("exposes an All Places link in the Places dropdown", () => {
  render(<SiteHeader />);
  const allPlaces = screen.getByRole("link", { name: "All Places →" });
  expect(allPlaces.getAttribute("href")).toBe("/places");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- SiteHeader`
Expected: FAIL — `Unable to find an accessible element with the role "link" and name "All Places →"`.

- [ ] **Step 3: Implement the minimal change**

In `lib/nav.ts`, update the Places dropdown `items` array to append the link:

```ts
  {
    label: "Places",
    href: "/places",
    items: [
      { label: "Hair Salons", href: "/places/hair-salons" },
      { label: "Head Spas", href: "/places/head-spas" },
      { label: "Skin Clinics", href: "/places/skin-clinics" },
      { label: "Beauty Stores", href: "/places/beauty-stores" },
      { label: "All Places →", href: "/places" },
    ],
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- SiteHeader`
Expected: PASS (all SiteHeader tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/nav.ts components/editorial/SiteHeader.test.tsx
git commit -m "feat: add All Places link to Places nav dropdown"
```

---

### Task 2: Neighborhood filter component (`PlacesDirectory`)

**Files:**

- Create: `components/editorial/PlacesDirectory.tsx`
- Test: `components/editorial/PlacesDirectory.test.tsx`

**Interfaces:**

- Consumes: `Place` type and `DiscoveryPlaceCard` (`{ place: Place }`) from existing modules.
- Produces: `export function PlacesDirectory({ places }: { places: Place[] }): JSX.Element`. Renders a `nav[aria-label="Neighborhood filters"]` of chip buttons (an "All" button plus one per distinct `place.neighborhood`, in first-appearance order) and a grid of `DiscoveryPlaceCard` filtered to the selected neighborhood. Default selection is "All" (shows every place). The active chip has `aria-pressed="true"`.

- [ ] **Step 1: Write the failing test**

Create `components/editorial/PlacesDirectory.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { PlacesDirectory } from "./PlacesDirectory";
import type { Place } from "@/lib/discovery";

const base: Omit<Place, "slug" | "name" | "type" | "neighborhood" | "summary"> =
  {
    overview: "",
    whyGo: [],
    bestFor: [],
    signatureServices: [],
  } as unknown as Omit<
    Place,
    "slug" | "name" | "type" | "neighborhood" | "summary"
  >;

function makePlace(
  slug: string,
  name: string,
  neighborhood: string,
  type: Place["type"] = "hair-salon"
): Place {
  return { ...base, slug, name, type, neighborhood, summary: name } as Place;
}

const places: Place[] = [
  makePlace("a", "Alpha Salon", "Hongdae"),
  makePlace("b", "Bravo Spa", "Seongsu", "head-spa"),
  makePlace("c", "Charlie Store", "Hongdae", "beauty-store"),
];

describe("PlacesDirectory", () => {
  it("shows all places by default", () => {
    render(<PlacesDirectory places={places} />);
    expect(screen.getByRole("link", { name: /Alpha Salon/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Bravo Spa/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Charlie Store/ })).toBeTruthy();
  });

  it("renders one chip per distinct neighborhood plus All", () => {
    render(<PlacesDirectory places={places} />);
    const filters = screen.getByRole("navigation", {
      name: "Neighborhood filters",
    });
    expect(within(filters).getByRole("button", { name: "All" })).toBeTruthy();
    expect(
      within(filters).getByRole("button", { name: "Hongdae" })
    ).toBeTruthy();
    expect(
      within(filters).getByRole("button", { name: "Seongsu" })
    ).toBeTruthy();
    // Hongdae appears twice in data but only one chip
    expect(
      within(filters).getAllByRole("button", { name: "Hongdae" }).length
    ).toBe(1);
  });

  it("filters the grid to the selected neighborhood and resets on All", () => {
    render(<PlacesDirectory places={places} />);
    fireEvent.click(screen.getByRole("button", { name: "Seongsu" }));
    expect(screen.getByRole("link", { name: /Bravo Spa/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Alpha Salon/ })).toBe(null);
    expect(screen.queryByRole("link", { name: /Charlie Store/ })).toBe(null);

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByRole("link", { name: /Alpha Salon/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Charlie Store/ })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- PlacesDirectory`
Expected: FAIL — cannot resolve `./PlacesDirectory` (module does not exist yet).

- [ ] **Step 3: Implement the component**

Create `components/editorial/PlacesDirectory.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Place } from "@/lib/discovery";
import { DiscoveryPlaceCard } from "./DiscoveryCards";

const ALL = "All";

export function PlacesDirectory({ places }: { places: Place[] }) {
  const [selected, setSelected] = useState<string>(ALL);

  const neighborhoods = useMemo(() => {
    const seen: string[] = [];
    for (const place of places) {
      if (!seen.includes(place.neighborhood)) seen.push(place.neighborhood);
    }
    return seen;
  }, [places]);

  const visible =
    selected === ALL
      ? places
      : places.filter((place) => place.neighborhood === selected);

  const chips = [ALL, ...neighborhoods];

  return (
    <div>
      <nav aria-label="Neighborhood filters" className="flex flex-wrap gap-3">
        {chips.map((chip) => {
          const active = chip === selected;
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(chip)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-label transition-colors duration-medium ease-editorial ${
                active
                  ? "border-accent text-accent"
                  : "border-soft-gray text-text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {chip}
            </button>
          );
        })}
      </nav>

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {visible.map((place) => (
          <DiscoveryPlaceCard key={place.slug} place={place} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- PlacesDirectory`
Expected: PASS (all three tests green).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/PlacesDirectory.tsx components/editorial/PlacesDirectory.test.tsx
git commit -m "feat: add PlacesDirectory neighborhood filter component"
```

---

### Task 3: Wire `PlacesDirectory` into the /places hub

**Files:**

- Modify: `app/places/page.tsx` (grid section, lines 79-86)
- Test: manual build/typecheck (page is a thin server wrapper; component logic is covered in Task 2)

**Interfaces:**

- Consumes: `PlacesDirectory` from Task 2 and `PLACES` from `@/lib/discovery`.
- Produces: the hub renders `<PlacesDirectory places={PLACES} />` in place of the static grid; type filter pills and JSON-LD remain unchanged.

- [ ] **Step 1: Add the import**

In `app/places/page.tsx`, add to the imports at the top (with the other component imports):

```tsx
import { PlacesDirectory } from "@/components/editorial/PlacesDirectory";
```

- [ ] **Step 2: Replace the static grid section**

Replace the existing directory `<section>` (currently lines 79-86):

```tsx
<section className="mt-12">
  <SectionHeading title="All Seoul Places" eyebrow="Directory" />
  <div className="grid gap-8 md:grid-cols-3">
    {PLACES.map((place) => (
      <DiscoveryPlaceCard key={place.slug} place={place} />
    ))}
  </div>
</section>
```

with:

```tsx
<section className="mt-12">
  <SectionHeading title="All Seoul Places" eyebrow="Directory" />
  <div className="mt-8">
    <PlacesDirectory places={PLACES} />
  </div>
</section>
```

- [ ] **Step 3: Remove the now-unused `DiscoveryPlaceCard` import**

`DiscoveryPlaceCard` is no longer referenced in `app/places/page.tsx`. Remove its
import (line 3: `import { DiscoveryPlaceCard } from "@/components/editorial/DiscoveryCards";`).
Leave all other imports (`PLACES`, `SectionHeading`, JSON-LD helpers) intact — they
are still used.

- [ ] **Step 4: Typecheck and run the full test suite**

Run: `npm run test`
Expected: PASS (whole suite). Then run: `npx tsc --noEmit`
Expected: no errors (confirms the removed import left no dangling reference).

- [ ] **Step 5: Verify in the running app**

Run: `npm run dev`, open `/places`. Confirm: the neighborhood chip row renders under
"All Seoul Places", clicking a neighborhood narrows the grid, "All" resets it, the
type pills still link to category pages (`/places/head-spas` etc.), and the nav
"All Places →" link returns to `/places`.

- [ ] **Step 6: Commit**

```bash
git add app/places/page.tsx
git commit -m "feat: use PlacesDirectory neighborhood filter on places hub"
```

---

## Self-Review

**Spec coverage:**

- Work item 1 (nav "All Places →") → Task 1. ✓
- Work item 2 (neighborhood filter component + wire into hub) → Task 2 (component) + Task 3 (wiring). ✓
- Out-of-scope items (route restructuring, neighborhood routes, extra facets) → correctly absent. ✓
- Testing section (nav dropdown test, directory filter test) → Task 1 test + Task 2 tests. ✓

**Placeholder scan:** No TBD/TODO; all code shown in full. ✓

**Type consistency:** `PlacesDirectory({ places }: { places: Place[] })` used identically in Task 2 (definition), Task 2 test, and Task 3 (call site). `Place` imported from `@/lib/discovery` everywhere. `DiscoveryPlaceCard` prop shape `{ place: Place }` matches its definition in `DiscoveryCards.tsx`. ✓
