# Admin Places Editor (CRUD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin UI to list, create, edit, and delete Seoul directory places (the `places` table), layered on the existing admin auth shell.

**Architecture:** Pure form parser (`lib/admin/places.ts`) → session-aware admin service (`services/admin/places.ts`) → server actions with admin re-auth (`app/admin/places/actions.ts`) → form primitives + `PlaceForm` (client, `useActionState`) → three admin pages + dashboard link. Category pages and the public `/places` reflect changes via `revalidatePath`.

**Tech Stack:** Next.js App Router (server components + server actions), React (`useActionState`), TypeScript, Supabase JS (session/anon client), Vitest + React Testing Library, Tailwind.

## Global Constraints

- Test runner: `npm run test -- <pattern>` (vitest). Full suite: `npm run test`.
- Client components start with `"use client";`. Server actions files start with `"use server";`.
- Admin writes use the existing session client `createClient` from `@/lib/supabase/server` — RLS `places_admin_all` (`for all to authenticated`) permits it. Do NOT introduce a service-role key.
- Every server action re-verifies the caller with `isAllowedAdmin` from `@/lib/auth` (defense in depth).
- Reuse `slugify` from `@/lib/slug`. Reuse `PLACE_TYPE_LABELS` and `PLACE_ENTRY_KINDS` from `@/lib/taxonomy` for select options.
- `Place` type (from `@/services/types`) already includes `id` and all camelCase place fields. `images` is a jsonb array (write a JS string array); `languages` is `text[]`.
- Commit message body ends with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. A pre-commit prettier hook runs automatically — expected.
- Commit after each task. Do NOT push unless asked.

---

### Task 1: Pure form parser + validation (`lib/admin/places.ts`)

**Files:**

- Create: `lib/admin/places.ts`
- Test: `lib/admin/places.test.ts`

**Interfaces:**

- Produces:
  - `type PlaceWriteInput = { name: string; nameKr: string | null; slug: string; category: string; entryType: "place" | "experience"; area: string | null; address: string | null; serviceDetail: string | null; shortDescription: string | null; longDescription: string | null; whyWeLikeIt: string | null; bestFor: string | null; priceRange: string | null; rating: number | null; reviewCount: number | null; websiteUrl: string | null; instagramUrl: string | null; naverMapUrl: string | null; googleMapUrl: string | null; bookingUrl: string | null; languages: string[]; images: string[]; isPublished: boolean }`
  - `type ParseResult = { ok: true; value: PlaceWriteInput } | { ok: false; errors: Record<string, string> }`
  - `parsePlaceForm(formData: FormData, opts: { mode: "create" | "edit" }): ParseResult`
- Consumes: `slugify` from `@/lib/slug`; `PLACE_TYPE_LABELS`, `PLACE_ENTRY_KINDS` from `@/lib/taxonomy`.

- [ ] **Step 1: Write the failing test**

Create `lib/admin/places.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parsePlaceForm } from "./places";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const valid = {
  name: "Test Salon",
  category: "salon",
  entryType: "place",
};

describe("parsePlaceForm", () => {
  it("requires a name", () => {
    const res = parsePlaceForm(fd({ ...valid, name: "  " }), {
      mode: "create",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.name).toBeTruthy();
  });

  it("rejects an unknown category and entryType", () => {
    const bad = parsePlaceForm(fd({ ...valid, category: "wat" }), {
      mode: "create",
    });
    expect(bad.ok).toBe(false);
    const badKind = parsePlaceForm(fd({ ...valid, entryType: "nope" }), {
      mode: "create",
    });
    expect(badKind.ok).toBe(false);
  });

  it("derives slug from name on create when slug blank", () => {
    const res = parsePlaceForm(fd({ ...valid, name: "Sool Loft Head Spa" }), {
      mode: "create",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.slug).toBe("sool-loft-head-spa");
  });

  it("slugifies a provided slug on create", () => {
    const res = parsePlaceForm(fd({ ...valid, slug: "My Custom Slug!" }), {
      mode: "create",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.slug).toBe("my-custom-slug");
  });

  it("normalizes empty text fields to null and trims", () => {
    const res = parsePlaceForm(
      fd({ ...valid, nameKr: "  더테스트  ", address: "" }),
      { mode: "create" }
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.nameKr).toBe("더테스트");
      expect(res.value.address).toBeNull();
    }
  });

  it("validates rating range and reviewCount", () => {
    const bad = parsePlaceForm(fd({ ...valid, rating: "9" }), {
      mode: "create",
    });
    expect(bad.ok).toBe(false);
    const ok = parsePlaceForm(
      fd({ ...valid, rating: "4.7", reviewCount: "12" }),
      {
        mode: "create",
      }
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value.rating).toBe(4.7);
      expect(ok.value.reviewCount).toBe(12);
    }
  });

  it("rejects a non-http url", () => {
    const res = parsePlaceForm(fd({ ...valid, naverMapUrl: "ftp://x" }), {
      mode: "create",
    });
    expect(res.ok).toBe(false);
  });

  it("splits languages and images by newline, dropping blanks", () => {
    const res = parsePlaceForm(
      fd({
        ...valid,
        languages: "English\n\nKorean\n",
        images: "https://a.com/1.jpg\nhttps://a.com/2.jpg",
      }),
      { mode: "create" }
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.languages).toEqual(["English", "Korean"]);
      expect(res.value.images).toEqual([
        "https://a.com/1.jpg",
        "https://a.com/2.jpg",
      ]);
    }
  });

  it("reads isPublished from a checkbox value", () => {
    const on = parsePlaceForm(fd({ ...valid, isPublished: "on" }), {
      mode: "create",
    });
    expect(on.ok && on.value.isPublished).toBe(true);
    const off = parsePlaceForm(fd({ ...valid }), { mode: "create" });
    expect(off.ok && off.value.isPublished).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- admin/places`
Expected: FAIL — cannot resolve `./places`.

- [ ] **Step 3: Implement the parser**

Create `lib/admin/places.ts`:

```ts
import { slugify } from "@/lib/slug";
import { PLACE_TYPE_LABELS, PLACE_ENTRY_KINDS } from "@/lib/taxonomy";

export type PlaceWriteInput = {
  name: string;
  nameKr: string | null;
  slug: string;
  category: string;
  entryType: "place" | "experience";
  area: string | null;
  address: string | null;
  serviceDetail: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  whyWeLikeIt: string | null;
  bestFor: string | null;
  priceRange: string | null;
  rating: number | null;
  reviewCount: number | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  naverMapUrl: string | null;
  googleMapUrl: string | null;
  bookingUrl: string | null;
  languages: string[];
  images: string[];
  isPublished: boolean;
};

export type ParseResult =
  | { ok: true; value: PlaceWriteInput }
  | { ok: false; errors: Record<string, string> };

const URL_FIELDS = [
  "websiteUrl",
  "instagramUrl",
  "naverMapUrl",
  "googleMapUrl",
  "bookingUrl",
] as const;

const ENTRY_KINDS = PLACE_ENTRY_KINDS.map((k) => k.value);

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function nullable(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

function lines(fd: FormData, key: string): string[] {
  return String(fd.get(key) ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function parsePlaceForm(
  fd: FormData,
  opts: { mode: "create" | "edit" }
): ParseResult {
  const errors: Record<string, string> = {};

  const name = str(fd, "name");
  if (!name) errors.name = "Name is required.";

  const category = str(fd, "category");
  if (!(category in PLACE_TYPE_LABELS)) errors.category = "Pick a category.";

  const entryType = str(fd, "entryType");
  if (!ENTRY_KINDS.includes(entryType as (typeof ENTRY_KINDS)[number])) {
    errors.entryType = "Pick an entry type.";
  }

  // slug: create derives from provided slug or name; edit keeps existing (the
  // update service never writes slug), so a placeholder is fine here.
  const slugSource = str(fd, "slug") || name;
  const slug = slugify(slugSource);
  if (opts.mode === "create" && !slug) {
    errors.slug = "Could not derive a slug from the name.";
  }

  let rating: number | null = null;
  const ratingRaw = str(fd, "rating");
  if (ratingRaw !== "") {
    const n = Number(ratingRaw);
    if (Number.isNaN(n) || n < 0 || n > 5) {
      errors.rating = "Rating must be a number between 0 and 5.";
    } else {
      rating = n;
    }
  }

  let reviewCount: number | null = null;
  const reviewRaw = str(fd, "reviewCount");
  if (reviewRaw !== "") {
    const n = Number(reviewRaw);
    if (!Number.isInteger(n) || n < 0) {
      errors.reviewCount = "Review count must be a non-negative integer.";
    } else {
      reviewCount = n;
    }
  }

  const urls: Record<string, string | null> = {};
  for (const key of URL_FIELDS) {
    const v = nullable(fd, key);
    if (v && !/^https?:\/\//i.test(v)) {
      errors[key] = "Must start with http:// or https://";
    }
    urls[key] = v;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      nameKr: nullable(fd, "nameKr"),
      slug,
      category,
      entryType: entryType as "place" | "experience",
      area: nullable(fd, "area"),
      address: nullable(fd, "address"),
      serviceDetail: nullable(fd, "serviceDetail"),
      shortDescription: nullable(fd, "shortDescription"),
      longDescription: nullable(fd, "longDescription"),
      whyWeLikeIt: nullable(fd, "whyWeLikeIt"),
      bestFor: nullable(fd, "bestFor"),
      priceRange: nullable(fd, "priceRange"),
      rating,
      reviewCount,
      websiteUrl: urls.websiteUrl,
      instagramUrl: urls.instagramUrl,
      naverMapUrl: urls.naverMapUrl,
      googleMapUrl: urls.googleMapUrl,
      bookingUrl: urls.bookingUrl,
      languages: lines(fd, "languages"),
      images: lines(fd, "images"),
      isPublished: str(fd, "isPublished") === "on",
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- admin/places`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add lib/admin/places.ts lib/admin/places.test.ts
git commit -m "feat(admin): pure place form parser + validation"
```

---

### Task 2: Admin place service (`services/admin/places.ts`)

**Files:**

- Create: `services/admin/places.ts`
- Test: `services/admin/places.test.ts`

**Interfaces:**

- Consumes: `createClient` from `@/lib/supabase/server`; `mapPlaceRow` from `@/services/places`; `Place` from `@/services/types`; `PlaceWriteInput` from `@/lib/admin/places`.
- Produces:
  - `type AdminPlace = Place & { isPublished: boolean }`
  - `listAllPlaces(): Promise<AdminPlace[]>`
  - `getAdminPlaceById(id: string): Promise<AdminPlace | null>`
  - `createPlace(input: PlaceWriteInput): Promise<{ id: string }>`
  - `updatePlace(id: string, input: PlaceWriteInput): Promise<void>` (never writes `slug`)
  - `deletePlace(id: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `services/admin/places.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
import { toRow, listAllPlaces, createPlace } from "./places";
import type { PlaceWriteInput } from "@/lib/admin/places";

const input: PlaceWriteInput = {
  name: "Test",
  nameKr: "테스트",
  slug: "test",
  category: "salon",
  entryType: "place",
  area: "Hongdae",
  address: null,
  serviceDetail: null,
  shortDescription: null,
  longDescription: null,
  whyWeLikeIt: null,
  bestFor: null,
  priceRange: null,
  rating: 4.5,
  reviewCount: 10,
  websiteUrl: null,
  instagramUrl: null,
  naverMapUrl: "https://map.naver.com/x",
  googleMapUrl: null,
  bookingUrl: null,
  languages: ["English"],
  images: ["https://a.com/1.jpg"],
  isPublished: true,
};

describe("toRow", () => {
  it("maps camelCase input to snake_case columns incl slug", () => {
    const row = toRow(input, { includeSlug: true });
    expect(row.name_kr).toBe("테스트");
    expect(row.entry_type).toBe("place");
    expect(row.naver_map_url).toBe("https://map.naver.com/x");
    expect(row.is_published).toBe(true);
    expect(row.slug).toBe("test");
  });
  it("omits slug when includeSlug is false (edit)", () => {
    const row = toRow(input, { includeSlug: false });
    expect("slug" in row).toBe(false);
  });
});

describe("listAllPlaces", () => {
  beforeEach(() => vi.clearAllMocks());
  it("queries places ordered by name without the published filter", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          name: "A",
          slug: "a",
          category: "salon",
          area: null,
          name_kr: null,
          entry_type: "place",
          rating: null,
          review_count: null,
          website_url: null,
          address: null,
          service_detail: null,
          short_description: null,
          long_description: null,
          why_we_like_it: null,
          best_for: null,
          price_range: null,
          instagram_url: null,
          naver_map_url: null,
          google_map_url: null,
          booking_url: null,
          languages: [],
          images: [],
          is_published: false,
        },
      ],
      error: null,
    });
    const select = vi.fn(() => ({ order }));
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: () => ({ select }),
    });
    const rows = await listAllPlaces();
    expect(rows).toHaveLength(1);
    expect(rows[0].isPublished).toBe(false);
    expect(rows[0].slug).toBe("a");
  });
});

describe("createPlace", () => {
  beforeEach(() => vi.clearAllMocks());
  it("inserts and returns the new id", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "new" }, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: () => ({ insert }),
    });
    const res = await createPlace(input);
    expect(res.id).toBe("new");
    expect(insert).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- services/admin/places`
Expected: FAIL — cannot resolve `./places`.

- [ ] **Step 3: Implement the service**

Create `services/admin/places.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { mapPlaceRow } from "@/services/places";
import type { Place } from "@/services/types";
import type { PlaceWriteInput } from "@/lib/admin/places";

export type AdminPlace = Place & { isPublished: boolean };

const COLUMNS =
  "id,name,slug,category,area,name_kr,entry_type,rating,review_count,website_url,address,service_detail,short_description,long_description,why_we_like_it,best_for,price_range,instagram_url,naver_map_url,google_map_url,booking_url,languages,images,is_published";

type RowWithPublished = Parameters<typeof mapPlaceRow>[0] & {
  is_published: boolean;
};

function mapAdmin(row: RowWithPublished): AdminPlace {
  return { ...mapPlaceRow(row), isPublished: row.is_published };
}

export function toRow(input: PlaceWriteInput, opts: { includeSlug: boolean }) {
  const row: Record<string, unknown> = {
    name: input.name,
    name_kr: input.nameKr,
    category: input.category,
    entry_type: input.entryType,
    area: input.area,
    address: input.address,
    service_detail: input.serviceDetail,
    short_description: input.shortDescription,
    long_description: input.longDescription,
    why_we_like_it: input.whyWeLikeIt,
    best_for: input.bestFor,
    price_range: input.priceRange,
    rating: input.rating,
    review_count: input.reviewCount,
    website_url: input.websiteUrl,
    instagram_url: input.instagramUrl,
    naver_map_url: input.naverMapUrl,
    google_map_url: input.googleMapUrl,
    booking_url: input.bookingUrl,
    languages: input.languages,
    images: input.images,
    is_published: input.isPublished,
  };
  if (opts.includeSlug) row.slug = input.slug;
  return row;
}

export async function listAllPlaces(): Promise<AdminPlace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as RowWithPublished[] | null)?.map(mapAdmin) ?? [];
}

export async function getAdminPlaceById(
  id: string
): Promise<AdminPlace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdmin(data as RowWithPublished) : null;
}

export async function createPlace(
  input: PlaceWriteInput
): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .insert(toRow(input, { includeSlug: true }))
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

export async function updatePlace(
  id: string,
  input: PlaceWriteInput
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("places")
    .update(toRow(input, { includeSlug: false }))
    .eq("id", id);
  if (error) throw error;
}

export async function deletePlace(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("places").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- services/admin/places`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/admin/places.ts services/admin/places.test.ts
git commit -m "feat(admin): places service — list all, get, create, update, delete"
```

---

### Task 3: Server actions (`app/admin/places/actions.ts`)

**Files:**

- Create: `app/admin/places/actions.ts`
- Test: `app/admin/places/actions.test.ts`

**Interfaces:**

- Consumes: `createClient` (`@/lib/supabase/server`), `isAllowedAdmin` (`@/lib/auth`), `parsePlaceForm` (`@/lib/admin/places`), `createPlace`/`updatePlace`/`deletePlace` (`@/services/admin/places`), `redirect`/`revalidatePath` (next).
- Produces:
  - `type FormState = { ok: boolean; errors?: Record<string, string>; formError?: string }`
  - `createPlaceAction(prev: FormState, formData: FormData): Promise<FormState>`
  - `updatePlaceAction(id: string, prev: FormState, formData: FormData): Promise<FormState>` (bind `id` at the call site)
  - `deletePlaceAction(id: string): Promise<void>` (bind `id`)

- [ ] **Step 1: Write the failing test**

Create `app/admin/places/actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/services/admin/places", () => ({
  createPlace: vi.fn(async () => ({ id: "x" })),
  updatePlace: vi.fn(async () => {}),
  deletePlace: vi.fn(async () => {}),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { createPlace } from "@/services/admin/places";
import { createPlaceAction } from "./actions";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

function mockUser(email: string | null) {
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: {
      getUser: async () => ({
        data: { user: email ? { email } : null },
      }),
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = "admin@example.com";
});

describe("createPlaceAction auth", () => {
  it("redirects to login when not an allowed admin", async () => {
    mockUser("stranger@example.com");
    await expect(
      createPlaceAction(
        { ok: true },
        fd({ name: "X", category: "salon", entryType: "place" })
      )
    ).rejects.toThrow("REDIRECT:/admin/login");
    expect(createPlace).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input (no write)", async () => {
    mockUser("admin@example.com");
    const res = await createPlaceAction(
      { ok: true },
      fd({ name: "", category: "salon", entryType: "place" })
    );
    expect(res.ok).toBe(false);
    expect(res.errors?.name).toBeTruthy();
    expect(createPlace).not.toHaveBeenCalled();
  });

  it("creates then redirects for a valid admin submission", async () => {
    mockUser("admin@example.com");
    await expect(
      createPlaceAction(
        { ok: true },
        fd({ name: "New Spot", category: "salon", entryType: "place" })
      )
    ).rejects.toThrow("REDIRECT:/admin/places?created=1");
    expect(createPlace).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- app/admin/places/actions`
Expected: FAIL — cannot resolve `./actions`.

- [ ] **Step 3: Implement the actions**

Create `app/admin/places/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";
import { parsePlaceForm } from "@/lib/admin/places";
import { createPlace, updatePlace, deletePlace } from "@/services/admin/places";

export type FormState = {
  ok: boolean;
  errors?: Record<string, string>;
  formError?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAllowedAdmin(user?.email)) redirect("/admin/login");
}

function revalidatePlaces() {
  revalidatePath("/admin/places");
  revalidatePath("/places");
  revalidatePath("/places/[slug]", "page");
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

export async function createPlaceAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePlaceForm(formData, { mode: "create" });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  try {
    await createPlace(parsed.value);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { slug: "That slug already exists." } };
    }
    return { ok: false, formError: "Could not save. Please try again." };
  }
  revalidatePlaces();
  redirect("/admin/places?created=1");
}

export async function updatePlaceAction(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePlaceForm(formData, { mode: "edit" });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  try {
    await updatePlace(id, parsed.value);
  } catch {
    return { ok: false, formError: "Could not save. Please try again." };
  }
  revalidatePlaces();
  redirect("/admin/places?updated=1");
}

export async function deletePlaceAction(id: string): Promise<void> {
  await requireAdmin();
  await deletePlace(id);
  revalidatePlaces();
  redirect("/admin/places?deleted=1");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- app/admin/places/actions`
Expected: PASS (auth redirect, validation error, create+redirect).

- [ ] **Step 5: Commit**

```bash
git add app/admin/places/actions.ts app/admin/places/actions.test.ts
git commit -m "feat(admin): places server actions with admin re-auth"
```

---

### Task 4: Form primitives + PlaceForm (`components/admin/`)

**Files:**

- Create: `components/admin/fields.tsx`
- Create: `components/admin/PlaceForm.tsx`
- Test: `components/admin/PlaceForm.test.tsx`

**Interfaces:**

- Consumes: `FormState`, `createPlaceAction`, `updatePlaceAction`, `deletePlaceAction` (`@/app/admin/places/actions`); `AdminPlace` (`@/services/admin/places`); `PLACE_TYPE_LABELS`, `PLACE_ENTRY_KINDS` (`@/lib/taxonomy`); `slugify` (`@/lib/slug`).
- Produces: `PlaceForm({ mode, place }: { mode: "create" | "edit"; place?: AdminPlace })`.

- [ ] **Step 1: Write the failing test**

Create `components/admin/PlaceForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceForm } from "./PlaceForm";
import type { AdminPlace } from "@/services/admin/places";

vi.mock("@/app/admin/places/actions", () => ({
  createPlaceAction: vi.fn(),
  updatePlaceAction: vi.fn(),
  deletePlaceAction: vi.fn(),
}));

const place: AdminPlace = {
  id: "1",
  name: "Test Salon",
  slug: "test-salon",
  category: "salon",
  area: "Hongdae",
  nameKr: "테스트",
  entryType: "place",
  rating: 4.5,
  reviewCount: 10,
  websiteUrl: null,
  address: null,
  serviceDetail: null,
  shortDescription: null,
  longDescription: null,
  whyWeLikeIt: null,
  bestFor: null,
  priceRange: null,
  instagramUrl: null,
  naverMapUrl: null,
  googleMapUrl: null,
  bookingUrl: null,
  languages: [],
  images: [],
  isPublished: true,
};

describe("PlaceForm", () => {
  it("renders core fields prefilled in edit mode with read-only slug", () => {
    render(<PlaceForm mode="edit" place={place} />);
    expect(
      (screen.getByLabelText(/Name \(English\)/i) as HTMLInputElement).value
    ).toBe("Test Salon");
    const slug = screen.getByLabelText(/Slug/i) as HTMLInputElement;
    expect(slug.value).toBe("test-salon");
    expect(slug.readOnly).toBe(true);
    // delete button shows only in edit mode
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
  });

  it("shows an editable slug and no delete button in create mode", () => {
    render(<PlaceForm mode="create" />);
    const slug = screen.getByLabelText(/Slug/i) as HTMLInputElement;
    expect(slug.readOnly).toBe(false);
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- components/admin/PlaceForm`
Expected: FAIL — cannot resolve `./PlaceForm`.

- [ ] **Step 3: Implement the primitives**

Create `components/admin/fields.tsx`:

```tsx
type Base = { label: string; name: string; error?: string };

const labelCls = "block text-sm font-medium text-text";
const inputCls =
  "mt-1 block w-full rounded border border-soft-gray px-3 py-2 text-sm focus:border-accent focus:outline-none";
const errCls = "mt-1 text-xs text-red-600";

function FieldShell({
  label,
  name,
  error,
  children,
}: Base & { children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      {children}
      {error && <p className={errCls}>{error}</p>}
    </div>
  );
}

export function TextField({
  label,
  name,
  error,
  defaultValue,
  readOnly,
}: Base & { defaultValue?: string; readOnly?: boolean }) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        readOnly={readOnly}
        className={inputCls}
      />
    </FieldShell>
  );
}

export function UrlField(props: Base & { defaultValue?: string }) {
  return <TextField {...props} />;
}

export function NumberField({
  label,
  name,
  error,
  defaultValue,
  step,
}: Base & { defaultValue?: string; step?: string }) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <input
        id={name}
        name={name}
        type="number"
        step={step}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  name,
  error,
  defaultValue,
  rows,
}: Base & { defaultValue?: string; rows?: number }) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <textarea
        id={name}
        name={name}
        rows={rows ?? 3}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      />
    </FieldShell>
  );
}

export function ListField({
  label,
  name,
  error,
  defaultValue,
}: Base & { defaultValue?: string[] }) {
  return (
    <FieldShell label={`${label} (one per line)`} name={name} error={error}>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={(defaultValue ?? []).join("\n")}
        className={inputCls}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  error,
  defaultValue,
  options,
}: Base & {
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-text">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
```

Create `components/admin/PlaceForm.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PLACE_TYPE_LABELS, PLACE_ENTRY_KINDS } from "@/lib/taxonomy";
import type { AdminPlace } from "@/services/admin/places";
import {
  createPlaceAction,
  updatePlaceAction,
  deletePlaceAction,
  type FormState,
} from "@/app/admin/places/actions";
import {
  TextField,
  UrlField,
  NumberField,
  TextArea,
  ListField,
  SelectField,
  CheckboxField,
} from "./fields";

const CATEGORY_OPTIONS = Object.entries(PLACE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
const KIND_OPTIONS = PLACE_ENTRY_KINDS.map((k) => ({
  value: k.value,
  label: k.label,
}));

export function PlaceForm({
  mode,
  place,
}: {
  mode: "create" | "edit";
  place?: AdminPlace;
}) {
  const action =
    mode === "edit" && place
      ? updatePlaceAction.bind(null, place.id)
      : createPlaceAction;
  const [state, formAction] = useActionState<FormState, FormData>(action, {
    ok: true,
  });
  const e = state.errors ?? {};

  return (
    <div className="max-w-2xl">
      {state.formError && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.formError}
        </p>
      )}
      <form action={formAction} className="grid gap-5">
        <TextField
          label="Name (English)"
          name="name"
          defaultValue={place?.name}
          error={e.name}
        />
        <TextField
          label="Name (Korean)"
          name="nameKr"
          defaultValue={place?.nameKr ?? ""}
          error={e.nameKr}
        />
        <TextField
          label="Slug"
          name="slug"
          defaultValue={place?.slug}
          readOnly={mode === "edit"}
          error={e.slug}
        />
        <SelectField
          label="Category"
          name="category"
          defaultValue={place?.category ?? "salon"}
          options={CATEGORY_OPTIONS}
          error={e.category}
        />
        <SelectField
          label="Entry type"
          name="entryType"
          defaultValue={place?.entryType ?? "place"}
          options={KIND_OPTIONS}
          error={e.entryType}
        />
        <TextField label="Area" name="area" defaultValue={place?.area ?? ""} />
        <TextField
          label="Address"
          name="address"
          defaultValue={place?.address ?? ""}
        />
        <TextField
          label="Service detail"
          name="serviceDetail"
          defaultValue={place?.serviceDetail ?? ""}
        />
        <TextArea
          label="Short description"
          name="shortDescription"
          defaultValue={place?.shortDescription ?? ""}
        />
        <TextArea
          label="Long description"
          name="longDescription"
          rows={6}
          defaultValue={place?.longDescription ?? ""}
        />
        <TextArea
          label="Why we like it"
          name="whyWeLikeIt"
          defaultValue={place?.whyWeLikeIt ?? ""}
        />
        <TextField
          label="Best for"
          name="bestFor"
          defaultValue={place?.bestFor ?? ""}
        />
        <TextField
          label="Price range"
          name="priceRange"
          defaultValue={place?.priceRange ?? ""}
        />
        <NumberField
          label="Rating (0–5)"
          name="rating"
          step="0.1"
          defaultValue={place?.rating != null ? String(place.rating) : ""}
          error={e.rating}
        />
        <NumberField
          label="Review count"
          name="reviewCount"
          defaultValue={
            place?.reviewCount != null ? String(place.reviewCount) : ""
          }
          error={e.reviewCount}
        />
        <UrlField
          label="Website URL"
          name="websiteUrl"
          defaultValue={place?.websiteUrl ?? ""}
          error={e.websiteUrl}
        />
        <UrlField
          label="Instagram URL"
          name="instagramUrl"
          defaultValue={place?.instagramUrl ?? ""}
          error={e.instagramUrl}
        />
        <UrlField
          label="Naver Map URL"
          name="naverMapUrl"
          defaultValue={place?.naverMapUrl ?? ""}
          error={e.naverMapUrl}
        />
        <UrlField
          label="Google Map URL"
          name="googleMapUrl"
          defaultValue={place?.googleMapUrl ?? ""}
          error={e.googleMapUrl}
        />
        <UrlField
          label="Booking URL"
          name="bookingUrl"
          defaultValue={place?.bookingUrl ?? ""}
          error={e.bookingUrl}
        />
        <ListField
          label="Languages"
          name="languages"
          defaultValue={place?.languages}
        />
        <ListField label="Images" name="images" defaultValue={place?.images} />
        <CheckboxField
          label="Published"
          name="isPublished"
          defaultChecked={place?.isPublished ?? false}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded bg-text px-4 py-2 text-sm text-bg hover:opacity-90"
          >
            {mode === "create" ? "Create place" : "Save changes"}
          </button>
          <Link
            href="/admin/places"
            className="text-sm text-text-muted hover:text-text"
          >
            Cancel
          </Link>
        </div>
      </form>

      {mode === "edit" && place && (
        <form
          action={deletePlaceAction.bind(null, place.id)}
          className="mt-8 border-t border-soft-gray pt-6"
          onSubmit={(ev) => {
            if (!confirm("Delete this place? This cannot be undone.")) {
              ev.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete place
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- components/admin/PlaceForm`
Expected: PASS (prefilled edit, read-only slug, delete button gating).

- [ ] **Step 5: Commit**

```bash
git add components/admin/fields.tsx components/admin/PlaceForm.tsx components/admin/PlaceForm.test.tsx
git commit -m "feat(admin): PlaceForm + reusable admin field primitives"
```

---

### Task 5: Admin pages + dashboard link + verification

**Files:**

- Create: `app/admin/places/page.tsx`
- Create: `app/admin/places/new/page.tsx`
- Create: `app/admin/places/[id]/page.tsx`
- Modify: `app/admin/page.tsx`

**Interfaces:**

- Consumes: `listAllPlaces`, `getAdminPlaceById` (`@/services/admin/places`); `PlaceForm` (`@/components/admin/PlaceForm`); `PLACE_TYPE_LABELS` (`@/lib/taxonomy`); `notFound` (next).
- Produces: the `/admin/places`, `/admin/places/new`, `/admin/places/[id]` routes and a dashboard link.

- [ ] **Step 1: Create the list page**

Create `app/admin/places/page.tsx`:

```tsx
import Link from "next/link";
import { listAllPlaces } from "@/services/admin/places";
import { PLACE_TYPE_LABELS } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

const FLASH: Record<string, string> = {
  created: "Place created.",
  updated: "Place updated.",
  deleted: "Place deleted.",
};

export default async function AdminPlacesPage({
  searchParams,
}: {
  searchParams: { created?: string; updated?: string; deleted?: string };
}) {
  const places = await listAllPlaces();
  const flashKey = Object.keys(FLASH).find(
    (k) => (searchParams as Record<string, string>)[k]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Places</h1>
        <Link
          href="/admin/places/new"
          className="rounded bg-text px-4 py-2 text-sm text-bg hover:opacity-90"
        >
          New place
        </Link>
      </div>
      {flashKey && (
        <p className="mt-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {FLASH[flashKey]}
        </p>
      )}
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-soft-gray text-left text-text-muted">
            <th className="py-2">Name</th>
            <th className="py-2">Category</th>
            <th className="py-2">Area</th>
            <th className="py-2">Status</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {places.map((p) => (
            <tr key={p.id} className="border-b border-soft-gray/60">
              <td className="py-2">
                {p.name}
                {p.nameKr && (
                  <span className="ml-2 text-text-muted">{p.nameKr}</span>
                )}
              </td>
              <td className="py-2">
                {PLACE_TYPE_LABELS[p.category] ?? p.category}
              </td>
              <td className="py-2">{p.area ?? "—"}</td>
              <td className="py-2">
                {p.isPublished ? (
                  <span className="text-green-700">Published</span>
                ) : (
                  <span className="text-text-muted">Draft</span>
                )}
              </td>
              <td className="py-2 text-right">
                <Link
                  href={`/admin/places/${p.id}`}
                  className="text-accent hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {places.length === 0 && (
        <p className="mt-6 text-text-muted">No places yet.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the new + edit pages**

Create `app/admin/places/new/page.tsx`:

```tsx
import { PlaceForm } from "@/components/admin/PlaceForm";

export default function NewPlacePage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">New place</h1>
      <div className="mt-6">
        <PlaceForm mode="create" />
      </div>
    </div>
  );
}
```

Create `app/admin/places/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getAdminPlaceById } from "@/services/admin/places";
import { PlaceForm } from "@/components/admin/PlaceForm";

export const dynamic = "force-dynamic";

export default async function EditPlacePage({
  params,
}: {
  params: { id: string };
}) {
  const place = await getAdminPlaceById(params.id);
  if (!place) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit place</h1>
      <p className="mt-1 text-text-muted">{place.name}</p>
      <div className="mt-6">
        <PlaceForm mode="edit" place={place} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the dashboard link**

Replace the body of `app/admin/page.tsx`:

```tsx
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      <ul className="mt-4 space-y-2">
        <li>
          <Link href="/admin/places" className="text-accent hover:underline">
            Manage places →
          </Link>
        </li>
      </ul>
      <p className="mt-4 text-sm text-text-muted">
        Posts and Products management arrive in a later CMS slice.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck, full test suite, and build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run test`
Expected: full suite PASS (includes the new admin tests).

Run: `npm run build`
Expected: build succeeds; `/admin/places`, `/admin/places/new`, `/admin/places/[id]` appear in the route list.

- [ ] **Step 5: Commit**

```bash
git add app/admin/places/page.tsx app/admin/places/new/page.tsx "app/admin/places/[id]/page.tsx" app/admin/page.tsx
git commit -m "feat(admin): places list, new, edit pages + dashboard link"
```

- [ ] **Step 6: Manual smoke checklist (needs a live session + Supabase)**

Not automated (RLS write needs a real admin session). Record for the human:

1. Log in at `/admin/login` with an `ADMIN_EMAILS` account.
2. `/admin` → "Manage places" → list renders all places (published + draft).
3. "New place" → fill name/category/entryType → Create → redirected to list with "Place created", new row present.
4. Edit that place → change `name_kr` and `naverMapUrl` → Save → "Place updated"; reopen to confirm persisted; slug field is read-only.
5. If published, confirm the change shows on `/places` (after revalidation).
6. Delete the test place → confirm dialog → "Place deleted"; row gone.

---

## Self-Review

**Spec coverage:**

- List all (incl. unpublished) → Task 2 `listAllPlaces` + Task 5 list page. ✓
- Create → Task 2 `createPlace` + Task 3 `createPlaceAction` + Task 5 new page. ✓
- Edit → Task 2 `updatePlace` + Task 3 `updatePlaceAction` + Task 5 edit page. ✓
- Delete w/ confirmation → Task 2 `deletePlace` + Task 3 `deletePlaceAction` + Task 4 confirm dialog. ✓
- Publish toggle → CheckboxField + parser `isPublished`. ✓
- slug auto on create / read-only on edit → parser slug logic + PlaceForm readOnly + `updatePlace` omits slug. ✓
- All specified fields editable → PlaceForm field set. ✓
- Auth (route gate reused + action re-auth) → Task 3 `requireAdmin`. ✓
- Images as URL list / languages array → ListField + parser `lines`. ✓
- Slug collision friendly error → Task 3 `isUniqueViolation`. ✓
- Revalidation of `/places` + `/places/[slug]` → Task 3 `revalidatePlaces`. ✓
- Out-of-scope (Posts/Products, upload, extra fields) → correctly absent. ✓

**Placeholder scan:** No TBD/TODO; full code in every step. ✓

**Type consistency:** `PlaceWriteInput` (Task 1) consumed by service (Task 2) and actions (Task 3) identically. `AdminPlace = Place & { isPublished }` defined Task 2, consumed Task 4/5. `FormState` defined Task 3, consumed Task 4. Action signatures: `createPlaceAction(prev, formData)`, `updatePlaceAction(id, prev, formData)` (bound with `id` in PlaceForm), `deletePlaceAction(id)` (bound) — consistent between Task 3 and Task 4. ✓
