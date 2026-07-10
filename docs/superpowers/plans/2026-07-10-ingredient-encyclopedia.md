# Ingredient Encyclopedia (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a K-beauty ingredient dictionary — a normalized `ingredients` data model plus public `/ingredients` index and detail pages — as the first slice of the platform's encyclopedia and the seed of the future Essenly skin-type/ingredient/product DB.

**Architecture:** New Supabase tables (`ingredients`, `product_ingredients`) via migration `0003`. A `lib/taxonomy.ts` constants module defines the skin-type/concern/function vocabularies (same pattern as `lib/categories.ts`). A `services/ingredients.ts` data-access module mirrors `services/posts.ts` (inline snake_case Row type → hand-written camelCase `Ingredient` in `services/types.ts`, `React.cache`-wrapped `getBySlug`, published-only reads). Public pages reuse the existing editorial components (`Eyebrow`, `Prose`, `SectionHeading`, chip pattern from `AreaFilter`) and `DefinedTerm` JSON-LD. Content is seeded from `content/ingredients/*.md` files via an idempotent upsert script (mirroring the posts inserter).

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Postgres + RLS) · Vitest + @testing-library/react (jsdom).

## Global Constraints

- All code must build and its tests pass WITHOUT the live DB: services are unit-tested with the existing `fakeClient` (`services/_fake-supabase.ts`); pages are verified via `npm run build`. Only migration-apply + seeding + live render require DB access (final task).
- Services define their own inline snake_case `Row` type and map to a hand-written camelCase type in `services/types.ts`. Do NOT depend on regenerating `types/database.types.ts` (regen is an optional live step).
- Reuse the existing `post_status` enum (`'draft' | 'published'`) for `ingredients.status`; do NOT create a new enum.
- RLS mirrors existing tables exactly: `anon` may `SELECT` published rows; `authenticated` has full access (app-layer admin allowlist governs real access).
- Taxonomy is stored as Postgres `text[]` and validated in-app against `lib/taxonomy.ts`; no Postgres enums for skin-type/concern/function (Essenly-extensibility).
- Skin types: `oily · dry · combination · sensitive · normal · acne_prone`. Concerns: `acne · aging · hyperpigmentation · redness · dryness · dullness · texture · pores · barrier`. Functions: `humectant · emollient · occlusive · antioxidant · exfoliant · brightening · soothing · barrier_support · sebum_control · anti_aging`.
- Data-backed pages use `export const dynamic = "force-dynamic"` and wrap fetches in try/catch → empty fallback (match `/articles`, `/places`).
- Tests use Vitest globals + @testing-library/react; assert with `.toBeTruthy()` / `getAttribute()` / `getAllByText` — NO jest-dom matchers. Pristine output.
- Content is original: ingredient facts written from scratch; never copy Hwahae/INCIDecoder/EWG text or scores.
- `content/` is in `.prettierignore` — draft/seed markdown is never reformatted.
- Commit style `type(scope): summary` with footer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Work on branch `feat/ingredient-encyclopedia` (create from `main`).

---

## File Structure

**Create:**

- `supabase/migrations/0003_ingredients.sql` — `ingredients` + `product_ingredients` tables, indexes, RLS.
- `lib/taxonomy.ts` + `lib/taxonomy.test.ts` — vocab constants + label helpers.
- `services/ingredients.ts` + `services/ingredients.test.ts` — data access.
- `components/editorial/TagChips.tsx` + `.test.tsx` — presentational chip row.
- `components/editorial/IngredientCard.tsx` + `.test.tsx` — index card.
- `app/ingredients/page.tsx` — index + filter.
- `app/ingredients/[slug]/page.tsx` — detail.
- `content/ingredients/<slug>.md` — seed source files.
- `scripts/seed-ingredients.mjs` — idempotent upsert script (documented; run at final task).

**Modify:**

- `services/types.ts` — add `Ingredient` type.
- `lib/seo.ts` — add `definedTermJsonLd` + `definedTermSetJsonLd`.
- `lib/nav.ts` — add `{ label: "Ingredients", href: "/ingredients" }`.

---

### Task 1: Migration `0003` — ingredients + product_ingredients

**Files:**

- Create: `supabase/migrations/0003_ingredients.sql`

**Interfaces:**

- Produces: tables `ingredients` (columns per Global Constraints) and `product_ingredients (product_id, ingredient_id, is_key, position)`; RLS policies; indexes. Consumed conceptually by `services/ingredients.ts` (Task 3).

- [ ] **Step 1: Write the migration** — `supabase/migrations/0003_ingredients.sql`

```sql
-- Ingredient dictionary (public reads published rows; writes require an
-- authenticated session, gated by the app-layer admin allowlist). Reuses the
-- existing post_status enum and set_updated_at() trigger from 0001.

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  inci_name text,
  also_known_as text[] not null default '{}',
  functions text[] not null default '{}',
  summary text,
  description text,
  benefits text,
  good_for_skin_types text[] not null default '{}',
  targets_concerns text[] not null default '{}',
  caution text,
  seo_title text,
  meta_description text,
  status post_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ingredients_status_name_idx on ingredients (status, name);
create index ingredients_functions_idx on ingredients using gin (functions);
create index ingredients_skin_types_idx on ingredients using gin (good_for_skin_types);
create index ingredients_concerns_idx on ingredients using gin (targets_concerns);
create trigger ingredients_set_updated_at before update on ingredients
  for each row execute function set_updated_at();

create table product_ingredients (
  product_id uuid not null references products(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  is_key boolean not null default false,
  position int,
  primary key (product_id, ingredient_id)
);
create index product_ingredients_ingredient_idx on product_ingredients (ingredient_id);

alter table ingredients enable row level security;
alter table product_ingredients enable row level security;

create policy ingredients_public_read on ingredients
  for select to anon using (status = 'published');
create policy ingredients_admin_all on ingredients
  for all to authenticated using (true) with check (true);

create policy product_ingredients_public_read on product_ingredients
  for select to anon using (true);
create policy product_ingredients_admin_all on product_ingredients
  for all to authenticated using (true) with check (true);
```

- [ ] **Step 2: Sanity-check the SQL locally (syntax only, no live apply)**

Run: `grep -c "create policy" supabase/migrations/0003_ingredients.sql`
Expected: `4`. (Live apply happens in Task 11.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0003_ingredients.sql
git commit -m "$(printf 'feat(db): ingredients + product_ingredients migration (0003)\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 2: `lib/taxonomy.ts`

**Files:**

- Create: `lib/taxonomy.ts`
- Test: `lib/taxonomy.test.ts`

**Interfaces:**

- Produces: `type Term = { value: string; label: string }`; arrays `SKIN_TYPES`, `CONCERNS`, `INGREDIENT_FUNCTIONS`; label helpers `skinTypeLabel(v)`, `concernLabel(v)`, `functionLabel(v)` (fall back to the raw value); value arrays `SKIN_TYPE_VALUES`, `CONCERN_VALUES`, `FUNCTION_VALUES`.

- [ ] **Step 1: Write the failing test** — `lib/taxonomy.test.ts`

```ts
import { describe, it, expect } from "vitest";
import {
  SKIN_TYPES,
  CONCERNS,
  INGREDIENT_FUNCTIONS,
  skinTypeLabel,
  concernLabel,
  functionLabel,
} from "./taxonomy";

describe("taxonomy", () => {
  it("has the documented vocabularies", () => {
    expect(SKIN_TYPES.map((t) => t.value)).toEqual([
      "oily",
      "dry",
      "combination",
      "sensitive",
      "normal",
      "acne_prone",
    ]);
    expect(CONCERNS.length).toBe(9);
    expect(INGREDIENT_FUNCTIONS.length).toBe(10);
  });
  it("labels values and falls back to the raw value", () => {
    expect(skinTypeLabel("acne_prone")).toBe("Acne-Prone");
    expect(concernLabel("hyperpigmentation")).toBe("Hyperpigmentation");
    expect(functionLabel("barrier_support")).toBe("Barrier Support");
    expect(skinTypeLabel("unknown")).toBe("unknown");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/taxonomy.test.ts`
Expected: FAIL — cannot import from `./taxonomy`.

- [ ] **Step 3: Write the implementation** — `lib/taxonomy.ts`

```ts
export type Term = { value: string; label: string };

export const SKIN_TYPES: Term[] = [
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "sensitive", label: "Sensitive" },
  { value: "normal", label: "Normal" },
  { value: "acne_prone", label: "Acne-Prone" },
];

export const CONCERNS: Term[] = [
  { value: "acne", label: "Acne" },
  { value: "aging", label: "Aging" },
  { value: "hyperpigmentation", label: "Hyperpigmentation" },
  { value: "redness", label: "Redness" },
  { value: "dryness", label: "Dryness" },
  { value: "dullness", label: "Dullness" },
  { value: "texture", label: "Texture" },
  { value: "pores", label: "Pores" },
  { value: "barrier", label: "Barrier" },
];

export const INGREDIENT_FUNCTIONS: Term[] = [
  { value: "humectant", label: "Humectant" },
  { value: "emollient", label: "Emollient" },
  { value: "occlusive", label: "Occlusive" },
  { value: "antioxidant", label: "Antioxidant" },
  { value: "exfoliant", label: "Exfoliant" },
  { value: "brightening", label: "Brightening" },
  { value: "soothing", label: "Soothing" },
  { value: "barrier_support", label: "Barrier Support" },
  { value: "sebum_control", label: "Sebum Control" },
  { value: "anti_aging", label: "Anti-Aging" },
];

function labeler(terms: Term[]): (value: string) => string {
  const m = new Map(terms.map((t) => [t.value, t.label]));
  return (value: string) => m.get(value) ?? value;
}

export const skinTypeLabel = labeler(SKIN_TYPES);
export const concernLabel = labeler(CONCERNS);
export const functionLabel = labeler(INGREDIENT_FUNCTIONS);

export const SKIN_TYPE_VALUES = SKIN_TYPES.map((t) => t.value);
export const CONCERN_VALUES = CONCERNS.map((t) => t.value);
export const FUNCTION_VALUES = INGREDIENT_FUNCTIONS.map((t) => t.value);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/taxonomy.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/taxonomy.ts lib/taxonomy.test.ts
git commit -m "$(printf 'feat(lib): skin-type/concern/function taxonomy\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 3: `Ingredient` type + `services/ingredients.ts`

**Files:**

- Modify: `services/types.ts`
- Create: `services/ingredients.ts`
- Test: `services/ingredients.test.ts`

**Interfaces:**

- Consumes: `@/lib/react-cache` `cache`, `@/lib/supabase/server` `createClient`, `mapProductRow` from `./products`, `fakeClient` from `./_fake-supabase` (test).
- Produces: `Ingredient` type; `mapIngredientRow(row)`, `listIngredients(opts?: { limit?; skinType?; func? }): Promise<Ingredient[]>`, `getIngredientBySlug(slug): Promise<Ingredient | null>`, `listProductsForIngredient(ingredientId): Promise<Product[]>`.

- [ ] **Step 1: Add the `Ingredient` type** — append to `services/types.ts`

```ts
export type Ingredient = {
  id: string;
  slug: string;
  name: string;
  inciName: string | null;
  alsoKnownAs: string[];
  functions: string[];
  summary: string | null;
  description: string | null;
  benefits: string | null;
  goodForSkinTypes: string[];
  targetsConcerns: string[];
  caution: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
};
```

- [ ] **Step 2: Write the failing test** — `services/ingredients.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";
import {
  mapIngredientRow,
  listIngredients,
  getIngredientBySlug,
} from "./ingredients";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1",
  slug: "niacinamide",
  name: "Niacinamide",
  inci_name: "Niacinamide",
  also_known_as: ["Vitamin B3"],
  functions: ["brightening", "sebum_control"],
  summary: "A versatile vitamin B3 derivative.",
  description: "## What it is\n\nNiacinamide...",
  benefits: "Brightens, balances oil.",
  good_for_skin_types: ["oily", "acne_prone"],
  targets_concerns: ["hyperpigmentation", "pores"],
  caution: null,
  seo_title: null,
  meta_description: null,
};

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";

describe("mapIngredientRow", () => {
  it("maps snake_case to camelCase with array defaults", () => {
    const ing = mapIngredientRow(row as never);
    expect(ing.inciName).toBe("Niacinamide");
    expect(ing.alsoKnownAs).toEqual(["Vitamin B3"]);
    expect(ing.goodForSkinTypes).toEqual(["oily", "acne_prone"]);
  });
});

describe("listIngredients", () => {
  it("returns mapped rows and issues a bounded query", async () => {
    const theFake = fakeClient({ data: [row], error: null });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(theFake);
    const result = await listIngredients();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("niacinamide");
    expect(theFake.calls).toContain("limit");
  });
  it("filters by skin type via contains", async () => {
    const theFake = fakeClient({ data: [row], error: null });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(theFake);
    await listIngredients({ skinType: "oily" });
    expect(theFake.calls).toContain("contains");
  });
});

describe("getIngredientBySlug", () => {
  it("returns null when not found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: null, error: null })
    );
    expect(await getIngredientBySlug("nope")).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run services/ingredients.test.ts`
Expected: FAIL — cannot import from `./ingredients`.

- [ ] **Step 4: Add `contains` to the fake client** — modify `services/_fake-supabase.ts`

Add one line so the chainable builder supports the `.contains()` filter used by `listIngredients`. Insert after the `builder.limit = chain("limit");` line:

```ts
builder.contains = chain("contains");
```

- [ ] **Step 5: Write the implementation** — `services/ingredients.ts`

```ts
import { cache } from "@/lib/react-cache";
import { createClient } from "@/lib/supabase/server";
import { mapProductRow } from "./products";
import type { Ingredient, Product } from "./types";

type IngredientRow = {
  id: string;
  slug: string;
  name: string;
  inci_name: string | null;
  also_known_as: string[];
  functions: string[];
  summary: string | null;
  description: string | null;
  benefits: string | null;
  good_for_skin_types: string[];
  targets_concerns: string[];
  caution: string | null;
  seo_title: string | null;
  meta_description: string | null;
};

const COLUMNS =
  "id,slug,name,inci_name,also_known_as,functions,summary,description,benefits,good_for_skin_types,targets_concerns,caution,seo_title,meta_description";

export function mapIngredientRow(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    inciName: row.inci_name,
    alsoKnownAs: row.also_known_as ?? [],
    functions: row.functions ?? [],
    summary: row.summary,
    description: row.description,
    benefits: row.benefits,
    goodForSkinTypes: row.good_for_skin_types ?? [],
    targetsConcerns: row.targets_concerns ?? [],
    caution: row.caution,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
  };
}

export async function listIngredients(
  opts: { limit?: number; skinType?: string; func?: string } = {}
): Promise<Ingredient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ingredients")
    .select(COLUMNS)
    .eq("status", "published")
    .order("name", { ascending: true })
    .limit(opts.limit ?? 200);
  if (opts.skinType)
    query = query.contains("good_for_skin_types", [opts.skinType]);
  if (opts.func) query = query.contains("functions", [opts.func]);
  const { data, error } = await query;
  if (error) throw error;
  return (data as IngredientRow[] | null)?.map(mapIngredientRow) ?? [];
}

export const getIngredientBySlug = cache(
  async (slug: string): Promise<Ingredient | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select(COLUMNS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return data ? mapIngredientRow(data as IngredientRow) : null;
  }
);

const PRODUCT_COLUMNS =
  "id,name,brand,slug,category,description,price,image,affiliate_url,where_to_buy,best_for,ingredients,rating,disclosure_required";

export async function listProductsForIngredient(
  ingredientId: string
): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_ingredients")
    .select(`product:products(${PRODUCT_COLUMNS})`)
    .eq("ingredient_id", ingredientId)
    .limit(24);
  if (error) throw error;
  const rows = (data as { product: unknown }[] | null) ?? [];
  return rows
    .map((r) => r.product)
    .filter(Boolean)
    .map((p) => mapProductRow(p as never));
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run services/ingredients.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Run the full suite (fake-client change is shared)**

Run: `npx vitest run`
Expected: all pass (the added `contains` chain does not affect existing tests).

- [ ] **Step 8: Commit**

```bash
git add services/types.ts services/ingredients.ts services/ingredients.test.ts services/_fake-supabase.ts
git commit -m "$(printf 'feat(services): ingredients data access + Ingredient type\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 4: `DefinedTerm` JSON-LD helpers

**Files:**

- Modify: `lib/seo.ts`
- Test: `lib/seo.test.ts` (create)

**Interfaces:**

- Consumes: `canonical`, `SITE_NAME`, `Ingredient`.
- Produces: `definedTermJsonLd(ingredient): object` (`@type: DefinedTerm`), `definedTermSetJsonLd(ingredients): object` (`@type: DefinedTermSet`).

- [ ] **Step 1: Write the failing test** — `lib/seo.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { definedTermJsonLd, definedTermSetJsonLd } from "./seo";
import type { Ingredient } from "@/services/types";

const ing = {
  id: "1",
  slug: "niacinamide",
  name: "Niacinamide",
  inciName: "Niacinamide",
  alsoKnownAs: ["Vitamin B3"],
  functions: ["brightening"],
  summary: "A vitamin B3 derivative.",
  description: null,
  benefits: null,
  goodForSkinTypes: ["oily"],
  targetsConcerns: ["pores"],
  caution: null,
  seoTitle: null,
  metaDescription: null,
} as Ingredient;

describe("definedTermJsonLd", () => {
  it("builds a DefinedTerm with name, description, and url", () => {
    const j = definedTermJsonLd(ing) as Record<string, unknown>;
    expect(j["@type"]).toBe("DefinedTerm");
    expect(j.name).toBe("Niacinamide");
    expect(String(j.url)).toContain("/ingredients/niacinamide");
  });
});

describe("definedTermSetJsonLd", () => {
  it("wraps terms in a DefinedTermSet", () => {
    const j = definedTermSetJsonLd([ing]) as Record<string, unknown>;
    expect(j["@type"]).toBe("DefinedTermSet");
    expect(Array.isArray(j.hasDefinedTerm)).toBe(true);
    expect((j.hasDefinedTerm as unknown[]).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/seo.test.ts`
Expected: FAIL — exports not defined.

- [ ] **Step 3: Add helpers** — append to `lib/seo.ts` (and extend the import)

Change the top import line to include `Ingredient`:

```ts
import type { Post, Place, Ingredient } from "@/services/types";
```

Append at the end of the file:

```ts
export function definedTermJsonLd(ingredient: Ingredient): object {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: ingredient.name,
    description: ingredient.summary ?? undefined,
    termCode: ingredient.inciName ?? undefined,
    inDefinedTermSet: canonical("/ingredients"),
    url: canonical(`/ingredients/${ingredient.slug}`),
  };
}

export function definedTermSetJsonLd(ingredients: Ingredient[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: `${SITE_NAME} — K-Beauty Ingredient Dictionary`,
    url: canonical("/ingredients"),
    hasDefinedTerm: ingredients.map((i) => ({
      "@type": "DefinedTerm",
      name: i.name,
      url: canonical(`/ingredients/${i.slug}`),
    })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/seo.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/seo.ts lib/seo.test.ts
git commit -m "$(printf 'feat(seo): DefinedTerm + DefinedTermSet JSON-LD for ingredients\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 5: Add "Ingredients" to nav

**Files:**

- Modify: `lib/nav.ts`

**Interfaces:**

- Produces: an added `NAV_ITEMS` entry `{ label: "Ingredients", href: "/ingredients" }`, rendered automatically by `SiteHeader`.

- [ ] **Step 1: Add the nav item** — in `lib/nav.ts`, add to the `NAV_ITEMS` array after the `Places` entry:

```ts
  { label: "Ingredients", href: "/ingredients" },
```

- [ ] **Step 2: Verify existing nav/header tests still pass**

Run: `npx vitest run components/editorial/SiteHeader.test.tsx`
Expected: PASS (the test checks a fixed label subset and does not assert an exact item count, so an added item is safe).

- [ ] **Step 3: Commit**

```bash
git add lib/nav.ts
git commit -m "$(printf 'feat(nav): add Ingredients to primary nav\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 6: `TagChips` component

**Files:**

- Create: `components/editorial/TagChips.tsx`
- Test: `components/editorial/TagChips.test.tsx`

**Interfaces:**

- Produces: `<TagChips items={string[]} />` — a small row of static labeled chips (non-interactive), using the editorial chip styling. Renders nothing when `items` is empty.

- [ ] **Step 1: Write the failing test** — `components/editorial/TagChips.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TagChips } from "./TagChips";

describe("TagChips", () => {
  it("renders a chip per item", () => {
    render(<TagChips items={["Oily", "Acne-Prone"]} />);
    expect(screen.getByText("Oily")).toBeTruthy();
    expect(screen.getByText("Acne-Prone")).toBeTruthy();
  });
  it("renders nothing when empty", () => {
    const { container } = render(<TagChips items={[]} />);
    expect(container.querySelector("span,ul")).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/TagChips.test.tsx`
Expected: FAIL — cannot import `TagChips`.

- [ ] **Step 3: Write the implementation** — `components/editorial/TagChips.tsx`

```tsx
export function TagChips({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-soft-gray px-3 py-1.5 text-[11px] uppercase tracking-label text-text-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/TagChips.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/TagChips.tsx components/editorial/TagChips.test.tsx
git commit -m "$(printf 'feat(editorial): TagChips presentational chip row\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 7: `IngredientCard` component

**Files:**

- Create: `components/editorial/IngredientCard.tsx`
- Test: `components/editorial/IngredientCard.test.tsx`

**Interfaces:**

- Consumes: `Ingredient`, `functionLabel` from `@/lib/taxonomy`.
- Produces: `<IngredientCard ingredient={Ingredient} />` — links to `/ingredients/${slug}`, shows a function eyebrow, serif name, and summary. No image (ingredients are type-led, not photo-led).

- [ ] **Step 1: Write the failing test** — `components/editorial/IngredientCard.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IngredientCard } from "./IngredientCard";
import type { Ingredient } from "@/services/types";

const ing = {
  id: "1",
  slug: "niacinamide",
  name: "Niacinamide",
  inciName: "Niacinamide",
  alsoKnownAs: ["Vitamin B3"],
  functions: ["brightening"],
  summary: "A versatile vitamin B3 derivative.",
  description: null,
  benefits: null,
  goodForSkinTypes: ["oily"],
  targetsConcerns: ["pores"],
  caution: null,
  seoTitle: null,
  metaDescription: null,
} as Ingredient;

describe("IngredientCard", () => {
  it("links to the ingredient and shows name + summary + function", () => {
    render(<IngredientCard ingredient={ing} />);
    const link = screen.getByRole("link", { name: /Niacinamide/ });
    expect(link.getAttribute("href")).toBe("/ingredients/niacinamide");
    expect(screen.getByText(/vitamin B3 derivative/)).toBeTruthy();
    expect(screen.getByText("Brightening")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/IngredientCard.test.tsx`
Expected: FAIL — cannot import `IngredientCard`.

- [ ] **Step 3: Write the implementation** — `components/editorial/IngredientCard.tsx`

```tsx
import Link from "next/link";
import type { Ingredient } from "@/services/types";
import { functionLabel } from "@/lib/taxonomy";

export function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const primary = ingredient.functions[0];
  return (
    <Link
      href={`/ingredients/${ingredient.slug}`}
      className="group block border-t border-soft-gray py-6"
    >
      {primary && (
        <p className="text-[11px] uppercase tracking-label text-accent">
          {functionLabel(primary)}
        </p>
      )}
      <h3 className="mt-1 font-serif text-2xl transition-colors duration-medium ease-editorial group-hover:text-accent">
        {ingredient.name}
      </h3>
      {ingredient.summary && (
        <p className="mt-1 text-sm text-text-muted line-clamp-2">
          {ingredient.summary}
        </p>
      )}
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/IngredientCard.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/IngredientCard.tsx components/editorial/IngredientCard.test.tsx
git commit -m "$(printf 'feat(editorial): IngredientCard index row\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 8: `/ingredients` index page

**Files:**

- Create: `app/ingredients/page.tsx`

**Interfaces:**

- Consumes: `listIngredients`, `IngredientCard`, `SectionHeading`, `AreaFilter`-style chips (reuse the `AreaFilter` component for the skin-type filter), `INGREDIENT_FUNCTIONS`/`SKIN_TYPES` from taxonomy, `definedTermSetJsonLd`, `JsonLd`, `canonical`.
- Produces: the public index route.

- [ ] **Step 1: Write the page** — `app/ingredients/page.tsx`

```tsx
import type { Metadata } from "next";
import { listIngredients } from "@/services/ingredients";
import { IngredientCard } from "@/components/editorial/IngredientCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { JsonLd } from "@/components/editorial/JsonLd";
import { AreaFilter } from "@/components/editorial/AreaFilter";
import { SKIN_TYPES, skinTypeLabel } from "@/lib/taxonomy";
import { canonical, definedTermSetJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "K-Beauty Ingredient Dictionary",
  description:
    "What Korean beauty ingredients actually do — niacinamide, snail mucin, centella, and more, by function and skin type.",
  alternates: { canonical: canonical("/ingredients") },
};

export const dynamic = "force-dynamic";

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: { skin?: string };
}) {
  let ingredients: Awaited<ReturnType<typeof listIngredients>> = [];
  try {
    ingredients = await listIngredients({ limit: 200 });
  } catch (err) {
    console.error("ingredients: fetch failed", err);
  }

  const skinValues = SKIN_TYPES.map((t) => t.value);
  const active =
    searchParams.skin && skinValues.includes(searchParams.skin)
      ? searchParams.skin
      : undefined;
  const visible = active
    ? ingredients.filter((i) => i.goodForSkinTypes.includes(active))
    : ingredients;

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd data={definedTermSetJsonLd(ingredients)} />
      <SectionHeading
        title="Ingredient Dictionary"
        eyebrow="Know your actives"
      />
      {ingredients.length > 0 && (
        <AreaFilter
          basePath="/ingredients"
          param="skin"
          options={SKIN_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          active={active}
        />
      )}
      {visible.length === 0 ? (
        <p className="text-text-muted">
          Ingredients are being added — check back soon.
        </p>
      ) : (
        <div className="border-b border-soft-gray">
          {visible.map((i) => (
            <IngredientCard key={i.id} ingredient={i} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Generalize `AreaFilter` so it is reusable** — modify `components/editorial/AreaFilter.tsx`

The current `AreaFilter` is hardcoded to `/places` + `?area=`. Generalize it to accept `basePath`, `param`, and `{value,label}` options while keeping the places page working. Replace the component body:

```tsx
import Link from "next/link";

function Chip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-label transition-colors duration-medium ease-editorial ${
        active
          ? "border-text bg-text text-bg"
          : "border-soft-gray text-text-muted hover:border-accent hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
}

export function AreaFilter({
  areas,
  active,
  basePath = "/places",
  param = "area",
  options,
}: {
  areas?: string[];
  active?: string;
  basePath?: string;
  param?: string;
  options?: { value: string; label: string }[];
}) {
  const opts = options ?? (areas ?? []).map((a) => ({ value: a, label: a }));
  return (
    <nav aria-label="Filter" className="mb-10 flex flex-wrap gap-2.5">
      <Chip label="All" href={basePath} active={!active} />
      {opts.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          href={`${basePath}?${param}=${encodeURIComponent(o.value)}`}
          active={active === o.value}
        />
      ))}
    </nav>
  );
}
```

This is backward compatible: `/places` still calls `<AreaFilter areas={areas} active={active} />` (defaults `basePath="/places"`, `param="area"`), and the existing `AreaFilter.test.tsx` still passes (it uses `areas`/`active` and asserts `/places` + `/places?area=Seongsu`).

- [ ] **Step 3: Verify AreaFilter test still passes + build**

Run: `npx vitest run components/editorial/AreaFilter.test.tsx && npm run build`
Expected: AreaFilter test PASS; `next build` compiles with `/ingredients` in the route list (`ƒ`).

- [ ] **Step 4: Commit**

```bash
git add app/ingredients/page.tsx components/editorial/AreaFilter.tsx
git commit -m "$(printf 'feat(ingredients): index page + generalize AreaFilter\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 9: `/ingredients/[slug]` detail page

**Files:**

- Create: `app/ingredients/[slug]/page.tsx`

**Interfaces:**

- Consumes: `getIngredientBySlug`, `listProductsForIngredient`, `Prose`, `TagChips`, `Eyebrow`, `JsonLd`, `ProductCard`, `definedTermJsonLd`, `breadcrumbJsonLd`, `canonical`, taxonomy label helpers, `notFound`.
- Produces: the public detail route.

- [ ] **Step 1: Write the page** — `app/ingredients/[slug]/page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getIngredientBySlug,
  listProductsForIngredient,
} from "@/services/ingredients";
import { Prose } from "@/components/editorial/Prose";
import { Eyebrow } from "@/components/editorial/Eyebrow";
import { TagChips } from "@/components/editorial/TagChips";
import { ProductCard } from "@/components/editorial/ProductCard";
import { JsonLd } from "@/components/editorial/JsonLd";
import { skinTypeLabel, concernLabel, functionLabel } from "@/lib/taxonomy";
import { canonical, definedTermJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const ing = await getIngredientBySlug(params.slug);
  if (!ing) return { title: "Not found" };
  return {
    title: ing.seoTitle ?? `${ing.name} — K-Beauty Ingredient`,
    description: ing.metaDescription ?? ing.summary ?? undefined,
    alternates: { canonical: canonical(`/ingredients/${ing.slug}`) },
  };
}

export default async function IngredientPage({
  params,
}: {
  params: { slug: string };
}) {
  const ing = await getIngredientBySlug(params.slug);
  if (!ing) notFound();

  let products: Awaited<ReturnType<typeof listProductsForIngredient>> = [];
  try {
    products = await listProductsForIngredient(ing.id);
  } catch (err) {
    console.error("ingredient: products fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={definedTermJsonLd(ing)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Ingredients", path: "/ingredients" },
          { name: ing.name, path: `/ingredients/${ing.slug}` },
        ])}
      />

      <Eyebrow>
        {ing.functions.map(functionLabel).join(" · ") || "Ingredient"}
      </Eyebrow>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">{ing.name}</h1>
      {(ing.inciName || ing.alsoKnownAs.length > 0) && (
        <p className="mt-2 text-sm text-text-muted">
          {[ing.inciName, ...ing.alsoKnownAs].filter(Boolean).join(" · ")}
        </p>
      )}
      {ing.summary && (
        <p className="mt-4 text-xl text-text-muted">{ing.summary}</p>
      )}

      {(ing.goodForSkinTypes.length > 0 || ing.targetsConcerns.length > 0) && (
        <div className="mt-6 flex flex-col gap-3 border-y border-soft-gray py-5">
          {ing.goodForSkinTypes.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-label text-accent">
                Good for
              </p>
              <TagChips items={ing.goodForSkinTypes.map(skinTypeLabel)} />
            </div>
          )}
          {ing.targetsConcerns.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-label text-accent">
                Targets
              </p>
              <TagChips items={ing.targetsConcerns.map(concernLabel)} />
            </div>
          )}
        </div>
      )}

      {ing.description && <Prose markdown={ing.description} className="mt-8" />}

      {ing.benefits && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Benefits</h2>
          <Prose markdown={ing.benefits} className="mt-2" />
        </section>
      )}

      {ing.caution && (
        <section className="mt-8 rounded-sm bg-porcelain/60 p-5">
          <h2 className="font-serif text-xl">Good to know</h2>
          <Prose markdown={ing.caution} className="mt-2" />
        </section>
      )}

      {products.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">Found in</h2>
          <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
```

Note: confirm `Prose`'s prop name is `markdown` by opening `components/editorial/Prose.tsx`; if the existing prop differs (e.g. `content`), use that name here and in the two other `<Prose>` usages above.

- [ ] **Step 2: Build to verify the route compiles**

Run: `npm run build`
Expected: compiles; `/ingredients/[slug]` appears as a dynamic route (`ƒ`).

- [ ] **Step 3: Commit**

```bash
git add "app/ingredients/[slug]/page.tsx"
git commit -m "$(printf 'feat(ingredients): detail page with DefinedTerm JSON-LD + Found in\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 10: Seed format + insert script + starter entries

**Files:**

- Create: `content/ingredients/niacinamide.md`, `content/ingredients/snail-mucin.md`, `content/ingredients/centella-asiatica.md` (3 real starter entries proving the format)
- Create: `scripts/seed-ingredients.mjs`

**Interfaces:**

- Produces: the seed-file frontmatter contract (keys map to `ingredients` columns) and an idempotent upsert script. Consumed at Task 11 to load the full batch.

- [ ] **Step 1: Write one starter entry** — `content/ingredients/niacinamide.md` (original copy; the other two follow the same shape)

```markdown
---
slug: "niacinamide"
name: "Niacinamide"
inci_name: "Niacinamide"
also_known_as: ["Vitamin B3", "Nicotinamide"]
functions: ["brightening", "sebum_control", "barrier_support"]
summary: "A do-it-all vitamin B3 derivative that calms, brightens, and helps regulate oil."
good_for_skin_types: ["oily", "combination", "acne_prone", "sensitive"]
targets_concerns: ["hyperpigmentation", "pores", "redness", "barrier"]
seo_title: "Niacinamide for Skin: Benefits, Uses, and Who Should Skip It"
meta_description: "What niacinamide (vitamin B3) does for skin — brightening, oil control, and barrier support — plus who should patch-test first."
status: "published"
caution: "Generally very well tolerated. A small number of people find high concentrations (10%+) briefly flushing or tingly; if your skin is reactive, start with a 5% formula."
---

## What it is

Niacinamide is a form of vitamin B3 that shows up in a huge share of Korean
serums, toners, and moisturizers. It's water-soluble, plays well with almost
every other active, and is stable enough that brands can use it generously.

## What it does

It supports the skin barrier by boosting ceramide production, helps fade the
look of post-acne marks over weeks of consistent use, and moderates excess
oil — which is why it turns up so often in products aimed at combination and
acne-prone skin.

## How to use it

Morning or night, after your lightest watery steps and before heavier creams.
It layers comfortably under sunscreen and pairs well with hyaluronic acid and
gentle exfoliants.
```

- [ ] **Step 2: Write the insert script** — `scripts/seed-ingredients.mjs`

```js
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
```

- [ ] **Step 3: Verify the script parses (dry, no network) + full suite green**

Run: `node -e "import('./scripts/seed-ingredients.mjs').catch(e=>{console.log('expected to reach fetch or env:', e.message)})" ; npx vitest run`
Expected: the module loads (it will attempt env/fetch — a network/env error is fine here; we only confirm it is syntactically valid). Vitest full suite PASS.

- [ ] **Step 4: Commit**

```bash
git add content/ingredients scripts/seed-ingredients.mjs
git commit -m "$(printf 'feat(content): ingredient seed format + insert script + 3 entries\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 11: Live apply, seed, and full verification (DB access required)

**Files:** none (integration/ops).

**Interfaces:**

- Consumes everything above. This is the only task needing live Supabase access (a Supabase access token for the Management API, or the SQL Editor, plus the service-role key already in `.env.local`).

- [ ] **Step 1: Full offline verification gate**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: all four exit 0; `/ingredients` and `/ingredients/[slug]` present in the build route list.

- [ ] **Step 2: Apply migration `0003` to the live project**

Apply `supabase/migrations/0003_ingredients.sql` to project `yisdsaetxgrboqlirvgb` via ONE of:

- Supabase dashboard → SQL Editor → paste the migration → Run, or
- Management API: `POST https://api.supabase.com/v1/projects/yisdsaetxgrboqlirvgb/database/query` with `Authorization: Bearer <access-token>` and body `{"query": "<contents of 0003_ingredients.sql>"}`.

Verify: `ingredients` and `product_ingredients` appear in the Table Editor.

- [ ] **Step 3: Seed the starter entries**

Run: `node scripts/seed-ingredients.mjs`
Expected: `201` and the upserted rows echoed. Confirm via REST:
`curl -s "$URL/rest/v1/ingredients?select=slug,status&limit=5" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"` returns the published rows.

- [ ] **Step 4: Expand the seed to 30–50 ingredients**

Draft the remaining ingredient entries as `content/ingredients/*.md` (original copy, same frontmatter contract, validated against `lib/taxonomy.ts` vocabularies) — this is a content activity (e.g. dispatch parallel drafting agents with the taxonomy + format as the brief), editor-reviewed, then re-run `node scripts/seed-ingredients.mjs` (idempotent upsert). Commit the new files.

- [ ] **Step 5: Live smoke check**

Run: after `npx vercel --prod --yes`, verify:
`curl -s -o /dev/null -w "%{http_code}\n" https://adropofseoul.vercel.app/ingredients` → `200`
`curl -s -o /dev/null -w "%{http_code}\n" https://adropofseoul.vercel.app/ingredients/niacinamide` → `200`
and the index shows ingredient names + the skin-type filter chips.

- [ ] **Step 6: (Optional) regenerate DB types**

If desired for editor accuracy: `SUPABASE_PROJECT_ID=yisdsaetxgrboqlirvgb npm run db:types` and commit `types/database.types.ts`. Not required — services use hand-written types.

---

## Self-Review

**Spec coverage:**

- Migration `0003` (ingredients + product_ingredients + RLS + indexes) → Task 1. ✓
- `lib/taxonomy.ts` vocab + helpers → Task 2. ✓
- `services/ingredients.ts` + `Ingredient` type + published-only/bounded queries → Task 3. ✓
- `DefinedTerm`/`DefinedTermSet` JSON-LD → Task 4. ✓
- Nav entry → Task 5. ✓
- Chips + IngredientCard → Tasks 6–7. ✓
- `/ingredients` index with skin-type filter → Task 8 (generalizes `AreaFilter`). ✓
- `/ingredients/[slug]` detail (Prose, chips, caution, Found-in, JSON-LD, notFound) → Task 9. ✓
- Seed file format + insert script + starter entries → Task 10. ✓
- Migration apply + seed + live verify → Task 11. ✓
- force-dynamic + try/catch resilience → Tasks 8, 9. ✓
- Original-content/legality → Task 10 copy + Global Constraints. ✓

**Placeholder scan:** No TBD/"handle edge cases"/"similar to". One explicit verification note in Task 9 (confirm `Prose` prop name) — actionable, not a placeholder.

**Type consistency:** `Ingredient` fields (Task 3) are used identically in Tasks 4/7/9. `listIngredients({ limit, skinType, func })`, `getIngredientBySlug`, `listProductsForIngredient(id)` referenced consistently. `AreaFilter` generalized signature (Task 8) stays backward-compatible with the Task-from-prior-plan `/places` usage and its existing test.

**Note on `AreaFilter` generalization:** Task 8 rewrites `AreaFilter` to add optional `basePath`/`param`/`options` while defaulting to the current `/places`+`area` behavior, so `app/places/page.tsx` and `AreaFilter.test.tsx` keep working unchanged. If the reviewer prefers a separate `FilterChips` component instead of generalizing, that is an acceptable equivalent.
