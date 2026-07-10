# Admin CMS (CRUD Core) Implementation Plan — Plan 3

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working `/admin` CMS — Dashboard plus full create/edit/publish/delete for Posts, Places, and Products — on top of the existing auth shell and Plan 1 schema.

**Architecture:** Server Components read through a NEW, separate admin service layer (`services/admin/*`); Server Actions perform writes; pure validators + a data-driven status/workflow config live in `lib/admin/*`; reusable form-field primitives live in `components/admin/*`. Status comparisons flow through one config and entity writes through one `toRow` mapper per entity, so the future V2 "AI Editorial OS" lands additively (spec §7).

**Tech Stack:** Next.js 14 App Router · TypeScript · Tailwind · Supabase (server client) · Vitest + Testing Library (jsdom). No new runtime dependencies. Reuses the public `<Prose>` markdown renderer, `lib/slug.ts`, and `lib/validation.ts` patterns.

**Spec:** `docs/superpowers/specs/2026-06-29-admin-cms-design.md`

## Global Constraints

- **No new runtime dependencies.** Server Actions + Server Components only — no `react-hook-form`, `zod`, or API routes.
- **Separate admin reads:** admin queries live in `services/admin/*` and use the server Supabase client (`@/lib/supabase/server`). Public pages keep reading `services/{posts,places,products}.ts`. Never query drafts from a public page.
- **Bounded queries (ENG-R1):** `listAll` passes an explicit `.limit(500)`.
- **404 on missing (ENG-R4):** edit routes call `notFound()` when `getById` returns null.
- **Nullable fields → null, not "" (ENG-R5):** actions convert empty form strings to `null` before writing.
- **No double-submit (ENG-R7):** submit buttons disable while pending.
- **Auth model:** writes rely on the app-layer email allowlist (`isAllowedAdmin`) already enforced by `app/admin/layout.tsx` + middleware. Write RLS is `for all to authenticated` (conscious choice — spec §4.1).
- **Deferred fields stay untouched (spec §2):** do NOT surface `gallery_images`, `related_places`, `related_products`, or the social caption columns (`instagram_caption`, `threads_post`, `x_post`, `pinterest_title`, `pinterest_description`).
- **Images:** URL inputs only; `next.config.js` gets `images.unoptimized = true`.
- **Commit trailer:** end every commit message with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **All commands run from** `/Users/jj_whatap/up/adropofseoul`.

---

## File Structure

```
next.config.js                       # MODIFY: images.unoptimized = true
lib/admin/
  enums.ts                           # NEW: POST_CATEGORIES, PLACE_CATEGORIES option lists
  workflow.ts  workflow.test.ts      # NEW: POST_STATUSES, isLive, statusLabel, liveLabel
  validate.ts  validate.test.ts      # NEW: validatePost/Place/Product (pure)
services/
  _fake-supabase.ts                  # MODIFY: add insert/update/delete/single to the fake
  admin/
    types.ts                         # NEW: PostInput/PlaceInput/ProductInput, Admin* row types, WriteResult, Counts
    posts.ts     posts.test.ts       # NEW: listAll/getById/create/update/remove/counts
    places.ts    places.test.ts      # NEW
    products.ts  products.test.ts    # NEW
components/admin/
  TextField.tsx  TextAreaField.tsx  SelectField.tsx  UrlField.tsx
  TagsField.tsx  TagsField.test.tsx
  MarkdownField.tsx  MarkdownField.test.tsx
  StatusField.tsx  FormError.tsx  SubmitButton.tsx
  DeleteButton.tsx  DeleteButton.test.tsx
  fields.test.tsx                    # smoke render for the presentational primitives
app/admin/
  layout.tsx                         # MODIFY: add left-nav
  page.tsx                           # REPLACE: Dashboard
  actions/
    state.ts                         # NEW: FormState type + INITIAL_STATE + orNull helper
    posts.ts  places.ts  products.ts # NEW: "use server" save*/delete*
  posts/
    page.tsx  new/page.tsx  [id]/page.tsx
    PostForm.tsx
  places/
    page.tsx  new/page.tsx  [id]/page.tsx
    PlaceForm.tsx
  products/
    page.tsx  new/page.tsx  [id]/page.tsx
    ProductForm.tsx
```

---

### Task 1: Config + enums + status workflow + validators (pure, TDD)

**Files:**

- Modify: `next.config.js`
- Create: `lib/admin/enums.ts`, `lib/admin/workflow.ts`, `lib/admin/workflow.test.ts`, `lib/admin/validate.ts`, `lib/admin/validate.test.ts`

**Interfaces:**

- Consumes: `slugify` from `@/lib/slug` (not directly here — used by forms later).
- Produces:
  - `POST_CATEGORIES: {value:string;label:string}[]`, `PLACE_CATEGORIES: {value:string;label:string}[]` — `lib/admin/enums.ts`
  - `POST_STATUSES: {value:string;label:string}[]`, `isLive(status:string):boolean`, `statusLabel(status:string):string`, `liveLabel(isPublished:boolean):string` — `lib/admin/workflow.ts`
  - `validatePost(i:PostInput)`, `validatePlace(i:PlaceInput)`, `validateProduct(i:ProductInput)` → `Record<string,string>` — `lib/admin/validate.ts` (imports input types from `@/services/admin/types`, created in Task 2; until then the test stubs the types inline — see Step 5).

- [ ] **Step 1: Add `images.unoptimized` to `next.config.js`**

Read the current file first, then set the `images` key. The result must be:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Temporary (Plan 3): pasted image URLs render without next/image host
  // allow-listing. Revert when the Plan 4 Media Library + Supabase Storage
  // remotePatterns land.
  images: { unoptimized: true },
};

module.exports = nextConfig;
```

> If the existing file already has other keys, keep them and only add the `images` line + comment.

- [ ] **Step 2: Create `lib/admin/enums.ts`**

```ts
// Option lists mirroring the DB enums (migration 0001).
export const POST_CATEGORIES: { value: string; label: string }[] = [
  { value: "beauty", label: "Beauty" },
  { value: "hair", label: "Hair" },
  { value: "head_spa", label: "Head Spa" },
  { value: "places", label: "Places" },
  { value: "wellness", label: "Wellness" },
  { value: "products", label: "Products" },
  { value: "guides", label: "Guides" },
];

export const PLACE_CATEGORIES: { value: string; label: string }[] = [
  { value: "head_spa", label: "Head Spa" },
  { value: "salon", label: "Salon" },
  { value: "cafe", label: "Cafe" },
  { value: "clinic", label: "Clinic" },
  { value: "shop", label: "Shop" },
  { value: "wellness", label: "Wellness" },
];

export const POST_CATEGORY_VALUES = POST_CATEGORIES.map((c) => c.value);
export const PLACE_CATEGORY_VALUES = PLACE_CATEGORIES.map((c) => c.value);
```

- [ ] **Step 3: Write the failing test `lib/admin/workflow.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { POST_STATUSES, isLive, statusLabel, liveLabel } from "./workflow";

describe("workflow", () => {
  it("lists the current post statuses", () => {
    expect(POST_STATUSES.map((s) => s.value)).toEqual(["draft", "published"]);
  });
  it("treats only 'published' as live", () => {
    expect(isLive("published")).toBe(true);
    expect(isLive("draft")).toBe(false);
  });
  it("labels statuses for display", () => {
    expect(statusLabel("draft")).toBe("Draft");
    expect(statusLabel("published")).toBe("Published");
  });
  it("labels a boolean is_published uniformly", () => {
    expect(liveLabel(true)).toBe("Published");
    expect(liveLabel(false)).toBe("Hidden");
  });
});
```

- [ ] **Step 4: Run it → FAIL** (`npm run test -- workflow`). Expected: `./workflow` not found.

- [ ] **Step 5: Implement `lib/admin/workflow.ts`**

```ts
// The SINGLE place status logic lives. V2 extends POST_STATUSES here (plus an
// additive `ALTER TYPE post_status ADD VALUE` migration) — see spec §7.
export const POST_STATUSES: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

const LIVE_STATUSES = new Set(["published"]);

export function isLive(status: string): boolean {
  return LIVE_STATUSES.has(status);
}

export function statusLabel(status: string): string {
  return POST_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function liveLabel(isPublished: boolean): string {
  return isPublished ? "Published" : "Hidden";
}
```

- [ ] **Step 6: Run it → PASS** (`npm run test -- workflow`, 4 tests).

- [ ] **Step 7: Write the failing test `lib/admin/validate.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { validatePost, validatePlace, validateProduct } from "./validate";

const basePost = {
  title: "Hello",
  slug: "hello",
  subtitle: null,
  excerpt: null,
  body: null,
  category: "beauty",
  tags: [],
  featuredImage: null,
  author: null,
  seoTitle: null,
  metaDescription: null,
  status: "draft",
  publishedAt: null,
};

describe("validatePost", () => {
  it("passes a valid post", () => {
    expect(validatePost(basePost)).toEqual({});
  });
  it("requires title, slug, and a known category", () => {
    const e = validatePost({
      ...basePost,
      title: "  ",
      slug: "",
      category: "nope",
    });
    expect(e.title).toBeTruthy();
    expect(e.slug).toBeTruthy();
    expect(e.category).toBeTruthy();
  });
  it("rejects a malformed slug", () => {
    expect(validatePost({ ...basePost, slug: "Has Spaces" }).slug).toBeTruthy();
  });
  it("rejects a non-URL featured image", () => {
    expect(
      validatePost({ ...basePost, featuredImage: "not-a-url" }).featuredImage
    ).toBeTruthy();
  });
  it("rejects an unknown status", () => {
    expect(validatePost({ ...basePost, status: "weird" }).status).toBeTruthy();
  });
});

const basePlace = {
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: null,
  address: null,
  shortDescription: null,
  longDescription: null,
  whyWeLikeIt: null,
  bestFor: null,
  priceRange: null,
  instagramUrl: null,
  naverMapUrl: null,
  googleMapUrl: null,
  bookingUrl: null,
  contactEmail: null,
  contactPhone: null,
  languages: [],
  isPublished: false,
  notes: null,
};

describe("validatePlace", () => {
  it("passes a valid place", () => {
    expect(validatePlace(basePlace)).toEqual({});
  });
  it("requires name, slug, known category", () => {
    const e = validatePlace({ ...basePlace, name: "", category: "nope" });
    expect(e.name).toBeTruthy();
    expect(e.category).toBeTruthy();
  });
  it("rejects a bad map URL and a bad contact email", () => {
    const e = validatePlace({
      ...basePlace,
      googleMapUrl: "x",
      contactEmail: "y",
    });
    expect(e.googleMapUrl).toBeTruthy();
    expect(e.contactEmail).toBeTruthy();
  });
});

const baseProduct = {
  name: "Rice Toner",
  brand: null,
  slug: "rice-toner",
  category: null,
  description: null,
  price: null,
  image: null,
  affiliateUrl: null,
  whereToBuy: null,
  bestFor: null,
  ingredients: null,
  rating: null,
  disclosureRequired: false,
  isPublished: false,
};

describe("validateProduct", () => {
  it("passes a valid product", () => {
    expect(validateProduct(baseProduct)).toEqual({});
  });
  it("requires name and slug", () => {
    const e = validateProduct({ ...baseProduct, name: "", slug: "" });
    expect(e.name).toBeTruthy();
    expect(e.slug).toBeTruthy();
  });
  it("rejects a rating outside 0–5 and a bad affiliate URL", () => {
    const e = validateProduct({
      ...baseProduct,
      rating: 9,
      affiliateUrl: "nope",
    });
    expect(e.rating).toBeTruthy();
    expect(e.affiliateUrl).toBeTruthy();
  });
});
```

- [ ] **Step 8: Run it → FAIL** (`npm run test -- validate`).

- [ ] **Step 9: Implement `lib/admin/validate.ts`**

```ts
import { isValidEmail } from "@/lib/validation";
import { POST_CATEGORY_VALUES, PLACE_CATEGORY_VALUES } from "./enums";
import { POST_STATUSES } from "./workflow";
import type {
  PostInput,
  PlaceInput,
  ProductInput,
} from "@/services/admin/types";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUS_VALUES = POST_STATUSES.map((s) => s.value);

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function required(map: Record<string, string>, field: string, value: string) {
  if (!value || !value.trim()) map[field] = "Required.";
}

function slugField(map: Record<string, string>, value: string) {
  if (!value || !value.trim()) {
    map.slug = "Required.";
  } else if (!SLUG_RE.test(value)) {
    map.slug = "Lowercase letters, numbers, and hyphens only.";
  }
}

function urlIfPresent(
  map: Record<string, string>,
  field: string,
  value: string | null
) {
  if (value && !isHttpUrl(value)) map[field] = "Must be a valid http(s) URL.";
}

export function validatePost(i: PostInput): Record<string, string> {
  const e: Record<string, string> = {};
  required(e, "title", i.title);
  slugField(e, i.slug);
  if (!POST_CATEGORY_VALUES.includes(i.category))
    e.category = "Choose a category.";
  if (!STATUS_VALUES.includes(i.status)) e.status = "Choose a status.";
  urlIfPresent(e, "featuredImage", i.featuredImage);
  return e;
}

export function validatePlace(i: PlaceInput): Record<string, string> {
  const e: Record<string, string> = {};
  required(e, "name", i.name);
  slugField(e, i.slug);
  if (!PLACE_CATEGORY_VALUES.includes(i.category))
    e.category = "Choose a category.";
  urlIfPresent(e, "instagramUrl", i.instagramUrl);
  urlIfPresent(e, "naverMapUrl", i.naverMapUrl);
  urlIfPresent(e, "googleMapUrl", i.googleMapUrl);
  urlIfPresent(e, "bookingUrl", i.bookingUrl);
  if (i.contactEmail && !isValidEmail(i.contactEmail))
    e.contactEmail = "Invalid email.";
  return e;
}

export function validateProduct(i: ProductInput): Record<string, string> {
  const e: Record<string, string> = {};
  required(e, "name", i.name);
  slugField(e, i.slug);
  urlIfPresent(e, "image", i.image);
  urlIfPresent(e, "affiliateUrl", i.affiliateUrl);
  if (i.rating !== null && (i.rating < 0 || i.rating > 5))
    e.rating = "Must be 0–5.";
  return e;
}
```

> This imports input types from `@/services/admin/types` (Task 2). To keep Task 1 self-contained and green, **do Step 10 (create the types file) before re-running** — or run Task 2 Step 1 first. The plan orders the types file creation here as Step 10 so Task 1 compiles on its own.

- [ ] **Step 10: Create `services/admin/types.ts`** (input + result types the validator and services share)

```ts
export type PostInput = {
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string;
  tags: string[];
  featuredImage: string | null;
  author: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  status: string;
  publishedAt: string | null;
};

export type PlaceInput = {
  name: string;
  slug: string;
  category: string;
  area: string | null;
  address: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  whyWeLikeIt: string | null;
  bestFor: string | null;
  priceRange: string | null;
  instagramUrl: string | null;
  naverMapUrl: string | null;
  googleMapUrl: string | null;
  bookingUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  languages: string[];
  isPublished: boolean;
  notes: string | null;
};

export type ProductInput = {
  name: string;
  brand: string | null;
  slug: string;
  category: string | null;
  description: string | null;
  price: string | null;
  image: string | null;
  affiliateUrl: string | null;
  whereToBuy: string | null;
  bestFor: string | null;
  ingredients: string | null;
  rating: number | null;
  disclosureRequired: boolean;
  isPublished: boolean;
};

export type AdminPost = PostInput & { id: string; updatedAt: string };
export type AdminPlace = PlaceInput & { id: string; updatedAt: string };
export type AdminProduct = ProductInput & { id: string; updatedAt: string };

export type WriteResult =
  | { ok: true; id?: string }
  | { ok: false; code: string | null; message: string };

export type Counts = { total: number; live: number; hidden: number };
```

- [ ] **Step 11: Run the suite + typecheck + commit**

Run: `npm run test && npm run typecheck`
Expected: pass; +12 tests (workflow 4, validate 8).

```bash
git add next.config.js lib/admin services/admin/types.ts
git commit -m "feat(admin): config + enums + status workflow + validators (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Fake-client extension + Posts admin service (CRUD, TDD)

**Files:**

- Modify: `services/_fake-supabase.ts`
- Create: `services/admin/posts.ts`, `services/admin/posts.test.ts`

**Interfaces:**

- Consumes: `createClient` from `@/lib/supabase/server`; `PostInput`, `AdminPost`, `WriteResult`, `Counts` from `@/services/admin/types`.
- Produces (in `services/admin/posts.ts`):
  - `listAllPosts(): Promise<AdminPost[]>`
  - `getPostById(id: string): Promise<AdminPost | null>`
  - `createPost(input: PostInput): Promise<WriteResult>`
  - `updatePost(id: string, input: PostInput): Promise<WriteResult>`
  - `removePost(id: string): Promise<WriteResult>`
  - `postCounts(): Promise<Counts>`
  - `mapAdminPostRow(row): AdminPost`

- [ ] **Step 1: Extend `services/_fake-supabase.ts`** to support writes + `single`

Add `insert`, `update`, `delete` chain methods and a `single` resolver. The new file:

```ts
type Result = { data: unknown; error: unknown; count?: number };

export function fakeClient(result: Result) {
  const calls: string[] = [];
  const builder: Record<string, unknown> & { calls: string[] } = { calls };
  const chain =
    (name: string) =>
    (..._args: unknown[]) => {
      calls.push(name);
      return builder;
    };
  builder.select = chain("select");
  builder.eq = chain("eq");
  builder.order = chain("order");
  builder.limit = chain("limit");
  builder.range = chain("range");
  builder.insert = chain("insert");
  builder.update = chain("update");
  builder.delete = chain("delete");
  builder.maybeSingle = () => Promise.resolve(result);
  builder.single = () => Promise.resolve(result);
  // Awaiting the builder itself resolves the result (for list/count/write queries).
  (builder as unknown as { then: unknown }).then = (
    onFulfilled: (r: Result) => unknown
  ) => Promise.resolve(result).then(onFulfilled);
  return {
    from: () => builder,
    calls,
  };
}
```

> The existing `services/places.test.ts` / `services/posts.test.ts` still pass — they only use `select/eq/maybeSingle/then`, all unchanged.

- [ ] **Step 2: Write the failing test `services/admin/posts.test.ts`**

```ts
import { describe, it, expect, vi } from "vitest";
import {
  mapAdminPostRow,
  getPostById,
  createPost,
  updatePost,
  removePost,
} from "./posts";
import { fakeClient } from "../_fake-supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
const mocked = createClient as ReturnType<typeof vi.fn>;

const row = {
  id: "p1",
  title: "Hello",
  slug: "hello",
  subtitle: null,
  excerpt: null,
  body: "## hi",
  category: "beauty",
  tags: ["k"],
  featured_image: null,
  author: "Team",
  seo_title: null,
  meta_description: null,
  status: "draft",
  published_at: null,
  updated_at: "2026-01-01T00:00:00Z",
};

const input = {
  title: "Hello",
  slug: "hello",
  subtitle: null,
  excerpt: null,
  body: "## hi",
  category: "beauty",
  tags: ["k"],
  featuredImage: null,
  author: "Team",
  seoTitle: null,
  metaDescription: null,
  status: "draft",
  publishedAt: null,
};

describe("mapAdminPostRow", () => {
  it("maps snake_case row to camelCase AdminPost incl. status + updatedAt", () => {
    const p = mapAdminPostRow(row as never);
    expect(p.id).toBe("p1");
    expect(p.featuredImage).toBeNull();
    expect(p.status).toBe("draft");
    expect(p.updatedAt).toBe("2026-01-01T00:00:00Z");
    expect(p.tags).toEqual(["k"]);
  });
});

describe("getPostById", () => {
  it("returns null when not found", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    expect(await getPostById("nope")).toBeNull();
  });
  it("maps a found row", async () => {
    mocked.mockResolvedValue(fakeClient({ data: row, error: null }));
    expect((await getPostById("p1"))?.slug).toBe("hello");
  });
});

describe("createPost", () => {
  it("returns ok with the new id", async () => {
    mocked.mockResolvedValue(fakeClient({ data: { id: "p1" }, error: null }));
    expect(await createPost(input as never)).toEqual({ ok: true, id: "p1" });
  });
  it("surfaces a unique-violation code", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: null, error: { code: "23505", message: "dup" } })
    );
    const r = await createPost(input as never);
    expect(r).toEqual({ ok: false, code: "23505", message: "dup" });
  });
});

describe("updatePost / removePost", () => {
  it("update returns ok on no error", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    expect(await updatePost("p1", input as never)).toEqual({ ok: true });
  });
  it("remove surfaces an error message", async () => {
    mocked.mockResolvedValue(
      fakeClient({ data: null, error: { code: "500", message: "boom" } })
    );
    expect(await removePost("p1")).toEqual({
      ok: false,
      code: "500",
      message: "boom",
    });
  });
});
```

- [ ] **Step 3: Run it → FAIL** (`npm run test -- admin/posts`).

- [ ] **Step 4: Implement `services/admin/posts.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import type { AdminPost, PostInput, WriteResult, Counts } from "./types";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string;
  tags: string[] | null;
  featured_image: string | null;
  author: string | null;
  seo_title: string | null;
  meta_description: string | null;
  status: string;
  published_at: string | null;
  updated_at: string;
};

const COLUMNS =
  "id,title,slug,subtitle,excerpt,body,category,tags,featured_image,author,seo_title,meta_description,status,published_at,updated_at";

export function mapAdminPostRow(row: PostRow): AdminPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category,
    tags: row.tags ?? [],
    featuredImage: row.featured_image,
    author: row.author,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: PostInput) {
  const publishedAt =
    input.status === "published" && !input.publishedAt
      ? new Date().toISOString()
      : input.publishedAt;
  return {
    title: input.title,
    slug: input.slug,
    subtitle: input.subtitle,
    excerpt: input.excerpt,
    body: input.body,
    category: input.category,
    tags: input.tags,
    featured_image: input.featuredImage,
    author: input.author,
    seo_title: input.seoTitle,
    meta_description: input.metaDescription,
    status: input.status,
    published_at: publishedAt,
  };
}

export async function listAllPosts(): Promise<AdminPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as PostRow[] | null)?.map(mapAdminPostRow) ?? [];
}

export async function getPostById(id: string): Promise<AdminPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdminPostRow(data as PostRow) : null;
}

export async function createPost(input: PostInput): Promise<WriteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

export async function updatePost(
  id: string,
  input: PostInput
): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update(toRow(input))
    .eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function removePost(id: string): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function postCounts(): Promise<Counts> {
  const supabase = await createClient();
  const total = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });
  const live = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  const t = total.count ?? 0;
  const l = live.count ?? 0;
  return { total: t, live: l, hidden: t - l };
}
```

- [ ] **Step 5: Run it → PASS** (`npm run test -- admin/posts`). Then full suite: `npm run test` (existing public-service tests still green).

- [ ] **Step 6: Typecheck + commit**

Run: `npm run typecheck`

```bash
git add services/_fake-supabase.ts services/admin/posts.ts services/admin/posts.test.ts
git commit -m "feat(admin): posts admin service — CRUD + counts (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Places admin service (CRUD, TDD)

**Files:**

- Create: `services/admin/places.ts`, `services/admin/places.test.ts`

**Interfaces:**

- Consumes: `createClient`; `PlaceInput`, `AdminPlace`, `WriteResult`, `Counts`.
- Produces: `listAllPlaces()`, `getPlaceById(id)`, `createPlace(input)`, `updatePlace(id,input)`, `removePlace(id)`, `placeCounts()`, `mapAdminPlaceRow(row)` — `services/admin/places.ts`.

- [ ] **Step 1: Write the failing test `services/admin/places.test.ts`**

```ts
import { describe, it, expect, vi } from "vitest";
import {
  mapAdminPlaceRow,
  getPlaceById,
  createPlace,
  placeCounts,
} from "./places";
import { fakeClient } from "../_fake-supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
const mocked = createClient as ReturnType<typeof vi.fn>;

const row = {
  id: "x1",
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
  address: null,
  short_description: "x",
  long_description: null,
  why_we_like_it: null,
  best_for: null,
  price_range: null,
  instagram_url: null,
  naver_map_url: null,
  google_map_url: null,
  booking_url: null,
  contact_email: null,
  contact_phone: null,
  languages: ["en"],
  is_published: true,
  notes: null,
  updated_at: "2026-01-01T00:00:00Z",
};

describe("mapAdminPlaceRow", () => {
  it("maps row incl. isPublished + updatedAt", () => {
    const p = mapAdminPlaceRow(row as never);
    expect(p.name).toBe("Sool Loft");
    expect(p.isPublished).toBe(true);
    expect(p.languages).toEqual(["en"]);
    expect(p.updatedAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("getPlaceById", () => {
  it("returns null when missing", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    expect(await getPlaceById("nope")).toBeNull();
  });
});

describe("createPlace", () => {
  it("returns ok with id", async () => {
    mocked.mockResolvedValue(fakeClient({ data: { id: "x1" }, error: null }));
    const r = await createPlace({} as never);
    expect(r).toEqual({ ok: true, id: "x1" });
  });
});

describe("placeCounts", () => {
  it("derives hidden = total - live", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null, count: 3 }));
    expect(await placeCounts()).toEqual({ total: 3, live: 3, hidden: 0 });
  });
});
```

- [ ] **Step 2: Run it → FAIL** (`npm run test -- admin/places`).

- [ ] **Step 3: Implement `services/admin/places.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import type { AdminPlace, PlaceInput, WriteResult, Counts } from "./types";

type PlaceRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  area: string | null;
  address: string | null;
  short_description: string | null;
  long_description: string | null;
  why_we_like_it: string | null;
  best_for: string | null;
  price_range: string | null;
  instagram_url: string | null;
  naver_map_url: string | null;
  google_map_url: string | null;
  booking_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  languages: string[] | null;
  is_published: boolean;
  notes: string | null;
  updated_at: string;
};

const COLUMNS =
  "id,name,slug,category,area,address,short_description,long_description,why_we_like_it,best_for,price_range,instagram_url,naver_map_url,google_map_url,booking_url,contact_email,contact_phone,languages,is_published,notes,updated_at";

export function mapAdminPlaceRow(row: PlaceRow): AdminPlace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    area: row.area,
    address: row.address,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    whyWeLikeIt: row.why_we_like_it,
    bestFor: row.best_for,
    priceRange: row.price_range,
    instagramUrl: row.instagram_url,
    naverMapUrl: row.naver_map_url,
    googleMapUrl: row.google_map_url,
    bookingUrl: row.booking_url,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    languages: row.languages ?? [],
    isPublished: row.is_published,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

function toRow(input: PlaceInput) {
  return {
    name: input.name,
    slug: input.slug,
    category: input.category,
    area: input.area,
    address: input.address,
    short_description: input.shortDescription,
    long_description: input.longDescription,
    why_we_like_it: input.whyWeLikeIt,
    best_for: input.bestFor,
    price_range: input.priceRange,
    instagram_url: input.instagramUrl,
    naver_map_url: input.naverMapUrl,
    google_map_url: input.googleMapUrl,
    booking_url: input.bookingUrl,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    languages: input.languages,
    is_published: input.isPublished,
    notes: input.notes,
  };
}

export async function listAllPlaces(): Promise<AdminPlace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as PlaceRow[] | null)?.map(mapAdminPlaceRow) ?? [];
}

export async function getPlaceById(id: string): Promise<AdminPlace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdminPlaceRow(data as PlaceRow) : null;
}

export async function createPlace(input: PlaceInput): Promise<WriteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

export async function updatePlace(
  id: string,
  input: PlaceInput
): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("places")
    .update(toRow(input))
    .eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function removePlace(id: string): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("places").delete().eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function placeCounts(): Promise<Counts> {
  const supabase = await createClient();
  const total = await supabase
    .from("places")
    .select("*", { count: "exact", head: true });
  const live = await supabase
    .from("places")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);
  const t = total.count ?? 0;
  const l = live.count ?? 0;
  return { total: t, live: l, hidden: t - l };
}
```

- [ ] **Step 4: Run it → PASS**, then `npm run test` (all green).

- [ ] **Step 5: Typecheck + commit**

```bash
git add services/admin/places.ts services/admin/places.test.ts
git commit -m "feat(admin): places admin service — CRUD + counts (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Products admin service (CRUD, TDD)

**Files:**

- Create: `services/admin/products.ts`, `services/admin/products.test.ts`

**Interfaces:**

- Consumes: `createClient`; `ProductInput`, `AdminProduct`, `WriteResult`, `Counts`.
- Produces: `listAllProducts()`, `getProductById(id)`, `createProduct(input)`, `updateProduct(id,input)`, `removeProduct(id)`, `productCounts()`, `mapAdminProductRow(row)`.

- [ ] **Step 1: Write the failing test `services/admin/products.test.ts`**

```ts
import { describe, it, expect, vi } from "vitest";
import { mapAdminProductRow, getProductById, createProduct } from "./products";
import { fakeClient } from "../_fake-supabase";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
const mocked = createClient as ReturnType<typeof vi.fn>;

const row = {
  id: "r1",
  name: "Rice Toner",
  brand: "Beauty of Joseon",
  slug: "boj-rice-toner",
  category: "toner",
  description: "milky",
  price: "$17",
  image: null,
  affiliate_url: null,
  where_to_buy: null,
  best_for: "dull skin",
  ingredients: null,
  rating: null,
  disclosure_required: true,
  is_published: true,
  updated_at: "2026-01-01T00:00:00Z",
};

describe("mapAdminProductRow", () => {
  it("maps row incl. disclosureRequired + isPublished", () => {
    const p = mapAdminProductRow(row as never);
    expect(p.brand).toBe("Beauty of Joseon");
    expect(p.disclosureRequired).toBe(true);
    expect(p.isPublished).toBe(true);
    expect(p.updatedAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("getProductById", () => {
  it("returns null when missing", async () => {
    mocked.mockResolvedValue(fakeClient({ data: null, error: null }));
    expect(await getProductById("nope")).toBeNull();
  });
});

describe("createProduct", () => {
  it("returns ok with id", async () => {
    mocked.mockResolvedValue(fakeClient({ data: { id: "r1" }, error: null }));
    expect(await createProduct({} as never)).toEqual({ ok: true, id: "r1" });
  });
});
```

- [ ] **Step 2: Run it → FAIL** (`npm run test -- admin/products`).

- [ ] **Step 3: Implement `services/admin/products.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import type { AdminProduct, ProductInput, WriteResult, Counts } from "./types";

type ProductRow = {
  id: string;
  name: string;
  brand: string | null;
  slug: string;
  category: string | null;
  description: string | null;
  price: string | null;
  image: string | null;
  affiliate_url: string | null;
  where_to_buy: string | null;
  best_for: string | null;
  ingredients: string | null;
  rating: number | null;
  disclosure_required: boolean;
  is_published: boolean;
  updated_at: string;
};

const COLUMNS =
  "id,name,brand,slug,category,description,price,image,affiliate_url,where_to_buy,best_for,ingredients,rating,disclosure_required,is_published,updated_at";

export function mapAdminProductRow(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    slug: row.slug,
    category: row.category,
    description: row.description,
    price: row.price,
    image: row.image,
    affiliateUrl: row.affiliate_url,
    whereToBuy: row.where_to_buy,
    bestFor: row.best_for,
    ingredients: row.ingredients,
    rating: row.rating,
    disclosureRequired: row.disclosure_required,
    isPublished: row.is_published,
    updatedAt: row.updated_at,
  };
}

function toRow(input: ProductInput) {
  return {
    name: input.name,
    brand: input.brand,
    slug: input.slug,
    category: input.category,
    description: input.description,
    price: input.price,
    image: input.image,
    affiliate_url: input.affiliateUrl,
    where_to_buy: input.whereToBuy,
    best_for: input.bestFor,
    ingredients: input.ingredients,
    rating: input.rating,
    disclosure_required: input.disclosureRequired,
    is_published: input.isPublished,
  };
}

export async function listAllProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as ProductRow[] | null)?.map(mapAdminProductRow) ?? [];
}

export async function getProductById(id: string): Promise<AdminProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdminProductRow(data as ProductRow) : null;
}

export async function createProduct(input: ProductInput): Promise<WriteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(toRow(input))
    .eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function removeProduct(id: string): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function productCounts(): Promise<Counts> {
  const supabase = await createClient();
  const total = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });
  const live = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);
  const t = total.count ?? 0;
  const l = live.count ?? 0;
  return { total: t, live: l, hidden: t - l };
}
```

- [ ] **Step 4: Run it → PASS**, then `npm run test`.

- [ ] **Step 5: Typecheck + commit**

```bash
git add services/admin/products.ts services/admin/products.test.ts
git commit -m "feat(admin): products admin service — CRUD + counts (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Form-field primitives (TDD with Testing Library)

**Files:**

- Create: `components/admin/TextField.tsx`, `TextAreaField.tsx`, `SelectField.tsx`, `UrlField.tsx`, `StatusField.tsx`, `FormError.tsx`, `SubmitButton.tsx`, `TagsField.tsx`, `MarkdownField.tsx`, `DeleteButton.tsx`
- Create tests: `TagsField.test.tsx`, `MarkdownField.test.tsx`, `DeleteButton.test.tsx`, `fields.test.tsx`

**Interfaces:**

- Consumes: `Prose` from `@/components/editorial/Prose`; `POST_STATUSES` from `@/lib/admin/workflow`.
- Produces (all in `components/admin/`):
  - `<TextField name label defaultValue? error? required? />`
  - `<TextAreaField name label defaultValue? error? rows? />`
  - `<SelectField name label options={{value,label}[]} defaultValue? error? />`
  - `<UrlField name label defaultValue? error? />`
  - `<SlugField sourceId label? defaultValue? error? />` (client; "Generate" slugifies the value of the input with id=`sourceId`)
  - `<StatusField name defaultValue? error? />` (uses `POST_STATUSES`)
  - `<FormError message? />`
  - `<SubmitButton>label</SubmitButton>` (client; disables while pending)
  - `<TagsField name label defaultValue?: string[] />` (serializes to a hidden comma-joined input)
  - `<MarkdownField name label defaultValue? />` (textarea + live `<Prose>` preview)
  - `<DeleteButton action />` (client; confirm-then-submit)

- [ ] **Step 1: Implement the presentational primitives**

`components/admin/FormError.tsx`:

```tsx
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}
```

`components/admin/TextField.tsx`:

```tsx
import { FormError } from "./FormError";

export function TextField({
  name,
  label,
  defaultValue,
  error,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className="mt-1 w-full rounded-md border border-soft-gray bg-white px-3 py-2"
      />
      <FormError message={error} />
    </div>
  );
}
```

`components/admin/TextAreaField.tsx`:

```tsx
import { FormError } from "./FormError";

export function TextAreaField({
  name,
  label,
  defaultValue,
  error,
  rows = 3,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  error?: string;
  rows?: number;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className="mt-1 w-full rounded-md border border-soft-gray bg-white px-3 py-2"
      />
      <FormError message={error} />
    </div>
  );
}
```

`components/admin/SelectField.tsx`:

```tsx
import { FormError } from "./FormError";

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className="mt-1 w-full rounded-md border border-soft-gray bg-white px-3 py-2"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FormError message={error} />
    </div>
  );
}
```

`components/admin/UrlField.tsx`:

```tsx
import { FormError } from "./FormError";

export function UrlField({
  name,
  label,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="url"
        inputMode="url"
        placeholder="https://…"
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        className="mt-1 w-full rounded-md border border-soft-gray bg-white px-3 py-2"
      />
      <FormError message={error} />
    </div>
  );
}
```

`components/admin/StatusField.tsx`:

```tsx
import { SelectField } from "./SelectField";
import { POST_STATUSES } from "@/lib/admin/workflow";

export function StatusField({
  name = "status",
  defaultValue,
  error,
}: {
  name?: string;
  defaultValue?: string | null;
  error?: string;
}) {
  return (
    <SelectField
      name={name}
      label="Status"
      options={POST_STATUSES}
      defaultValue={defaultValue ?? "draft"}
      error={error}
    />
  );
}
```

`components/admin/SubmitButton.tsx`:

```tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
```

`components/admin/SlugField.tsx` (client; reuses `lib/slug.ts`, spec §4.2):

```tsx
"use client";

import { useState } from "react";
import { slugify } from "@/lib/slug";
import { FormError } from "./FormError";

export function SlugField({
  sourceId,
  name = "slug",
  label = "Slug",
  defaultValue,
  error,
}: {
  sourceId: string;
  name?: string;
  label?: string;
  defaultValue?: string | null;
  error?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  function generate() {
    const el = document.getElementById(sourceId) as HTMLInputElement | null;
    if (el) setValue(slugify(el.value));
  }
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        <span className="text-red-600"> *</span>
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          className="w-full rounded-md border border-soft-gray bg-white px-3 py-2"
        />
        <button
          type="button"
          onClick={generate}
          className="shrink-0 rounded-md border border-soft-gray px-3 text-sm hover:border-accent"
        >
          Generate
        </button>
      </div>
      <FormError message={error} />
    </div>
  );
}
```

- [ ] **Step 2: Write `components/admin/fields.test.tsx`** (smoke for presentational primitives)

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";
import { StatusField } from "./StatusField";
import { FormError } from "./FormError";
import { SlugField } from "./SlugField";

describe("primitives", () => {
  it("TextField renders a labelled input and an error", () => {
    render(<TextField name="title" label="Title" error="Required." required />);
    expect(screen.getByLabelText(/Title/)).toBeTruthy();
    expect(screen.getByText("Required.")).toBeTruthy();
  });
  it("SelectField renders its options", () => {
    render(
      <SelectField
        name="category"
        label="Category"
        options={[{ value: "beauty", label: "Beauty" }]}
      />
    );
    expect(screen.getByRole("option", { name: "Beauty" })).toBeTruthy();
  });
  it("StatusField defaults to draft and offers published", () => {
    render(<StatusField />);
    expect(screen.getByRole("option", { name: "Published" })).toBeTruthy();
  });
  it("FormError renders nothing without a message", () => {
    const { container } = render(<FormError />);
    expect(container.firstChild).toBeNull();
  });
  it("SlugField generates a slug from the source input", () => {
    render(
      <>
        <input id="title" defaultValue="Hello World!" readOnly />
        <SlugField sourceId="title" />
      </>
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect((screen.getByLabelText(/Slug/) as HTMLInputElement).value).toBe(
      "hello-world"
    );
  });
});
```

- [ ] **Step 3: Run it → PASS** (`npm run test -- fields`).

- [ ] **Step 4: Write `components/admin/TagsField.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagsField } from "./TagsField";

describe("TagsField", () => {
  it("seeds chips from defaultValue and serializes to a hidden input", () => {
    const { container } = render(
      <TagsField name="tags" label="Tags" defaultValue={["k-beauty"]} />
    );
    expect(screen.getByText("k-beauty")).toBeTruthy();
    const hidden = container.querySelector('input[type="hidden"][name="tags"]');
    expect((hidden as HTMLInputElement).value).toBe("k-beauty");
  });
  it("adds a chip on Enter and updates the hidden value", () => {
    const { container } = render(<TagsField name="tags" label="Tags" />);
    const input = screen.getByLabelText("Tags") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "serum" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("serum")).toBeTruthy();
    const hidden = container.querySelector('input[type="hidden"][name="tags"]');
    expect((hidden as HTMLInputElement).value).toBe("serum");
  });
});
```

- [ ] **Step 5: Run it → FAIL**, then implement `components/admin/TagsField.tsx`

```tsx
"use client";

import { useState } from "react";

export function TagsField({
  name,
  label,
  defaultValue = [],
}: {
  name: string;
  label: string;
  defaultValue?: string[];
}) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setDraft("");
  }

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-soft-gray px-3 py-1 text-sm"
          >
            {t}
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={() => setTags(tags.filter((x) => x !== t))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        id={name}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="Type and press Enter"
        className="mt-2 w-full rounded-md border border-soft-gray bg-white px-3 py-2"
      />
      <input type="hidden" name={name} value={tags.join(",")} />
    </div>
  );
}
```

- [ ] **Step 6: Run it → PASS** (`npm run test -- TagsField`).

- [ ] **Step 7: Write `components/admin/MarkdownField.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MarkdownField } from "./MarkdownField";

describe("MarkdownField", () => {
  it("renders a live preview of the markdown", () => {
    render(
      <MarkdownField name="body" label="Body" defaultValue={"## Hello"} />
    );
    expect(screen.getByRole("heading", { name: "Hello" })).toBeTruthy();
  });
  it("updates the preview as you type", () => {
    render(<MarkdownField name="body" label="Body" />);
    const ta = screen.getByLabelText("Body");
    fireEvent.change(ta, { target: { value: "## Fresh" } });
    expect(screen.getByRole("heading", { name: "Fresh" })).toBeTruthy();
  });
});
```

- [ ] **Step 8: Run it → FAIL**, then implement `components/admin/MarkdownField.tsx`

```tsx
"use client";

import { useState } from "react";
import { Prose } from "@/components/editorial/Prose";

export function MarkdownField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1 grid gap-4 md:grid-cols-2">
        <textarea
          id={name}
          name={name}
          rows={16}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-md border border-soft-gray bg-white px-3 py-2 font-mono text-sm"
        />
        <div className="rounded-md border border-soft-gray bg-white px-4 py-2">
          <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
            Preview
          </p>
          <Prose markdown={value} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Run it → PASS** (`npm run test -- MarkdownField`).

- [ ] **Step 10: Write `components/admin/DeleteButton.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteButton } from "./DeleteButton";

async function noop() {
  "use server";
}

describe("DeleteButton", () => {
  it("hides the confirm control until Delete is clicked", () => {
    render(<DeleteButton action={noop} />);
    expect(
      screen.queryByRole("button", { name: /confirm delete/i })
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      screen.getByRole("button", { name: /confirm delete/i })
    ).toBeTruthy();
  });
  it("Cancel returns to the idle state", () => {
    render(<DeleteButton action={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("button", { name: /confirm delete/i })
    ).toBeNull();
  });
});
```

- [ ] **Step 11: Run it → FAIL**, then implement `components/admin/DeleteButton.tsx`

```tsx
"use client";

import { useState } from "react";

export function DeleteButton({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:underline"
      >
        Delete
      </button>
    );
  }

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <span className="text-sm text-text-muted">Sure?</span>
      <button
        type="submit"
        className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
      >
        Confirm delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-text-muted hover:underline"
      >
        Cancel
      </button>
    </form>
  );
}
```

> The `id` to delete is provided by the consuming page via a hidden input inside the same form, or by binding the server action with `action.bind(null, id)`. Pages in Tasks 7–9 bind the id.

- [ ] **Step 12: Run it → PASS** (`npm run test -- DeleteButton`).

- [ ] **Step 13: Run suite + typecheck + commit**

Run: `npm run test && npm run typecheck`
Expected: pass; +10 tests (fields 4, TagsField 2, MarkdownField 2, DeleteButton 2).

```bash
git add components/admin
git commit -m "feat(admin): reusable form-field primitives (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Admin layout nav + Dashboard

**Files:**

- Modify: `app/admin/layout.tsx`
- Replace: `app/admin/page.tsx`

**Interfaces:**

- Consumes: `postCounts`, `placeCounts`, `productCounts` from `@/services/admin/*`; `listAllPosts`/`listAllPlaces`/`listAllProducts` (for recent activity); `liveLabel` from `@/lib/admin/workflow`.

- [ ] **Step 1: Add a left-nav to `app/admin/layout.tsx`**

Keep the existing auth gate and header (do not remove the allowlist re-check or the sign-out form). Add a nav row under the header. The body becomes:

```tsx
return (
  <div className="min-h-screen">
    <header className="flex items-center justify-between border-b border-soft-gray px-6 py-4">
      <span className="font-serif text-xl">A Drop of Seoul · Admin</span>
      <form action={signOut}>
        <button className="text-sm text-text-muted hover:text-text">
          Sign out
        </button>
      </form>
    </header>
    <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
      <nav aria-label="Admin" className="w-40 shrink-0 space-y-1 text-sm">
        <a href="/admin" className="block rounded px-2 py-1 hover:bg-soft-gray">
          Dashboard
        </a>
        <a
          href="/admin/posts"
          className="block rounded px-2 py-1 hover:bg-soft-gray"
        >
          Posts
        </a>
        <a
          href="/admin/places"
          className="block rounded px-2 py-1 hover:bg-soft-gray"
        >
          Places
        </a>
        <a
          href="/admin/products"
          className="block rounded px-2 py-1 hover:bg-soft-gray"
        >
          Products
        </a>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  </div>
);
```

> Use plain `<a>` (full reload) to keep the layout a Server Component without importing `next/link` — acceptable for a low-traffic admin. (`next/link` is also fine if preferred.)

- [ ] **Step 2: Replace `app/admin/page.tsx` with the Dashboard**

```tsx
import { postCounts, listAllPosts } from "@/services/admin/posts";
import { placeCounts, listAllPlaces } from "@/services/admin/places";
import { productCounts, listAllProducts } from "@/services/admin/products";
import { isLive } from "@/lib/admin/workflow";

export const dynamic = "force-dynamic";

function Card({
  title,
  total,
  live,
  hidden,
  href,
}: {
  title: string;
  total: number;
  live: number;
  hidden: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-lg border border-soft-gray bg-white p-5 hover:border-accent"
    >
      <p className="font-serif text-xl">{title}</p>
      <p className="mt-2 text-sm text-text-muted">
        {total} total · {live} live · {hidden} hidden
      </p>
    </a>
  );
}

export default async function AdminDashboard() {
  const [posts, places, products, pc, plc, prc] = await Promise.all([
    listAllPosts(),
    listAllPlaces(),
    listAllProducts(),
    postCounts(),
    placeCounts(),
    productCounts(),
  ]);

  const recent = [
    ...posts.map((p) => ({
      kind: "Post",
      name: p.title,
      href: `/admin/posts/${p.id}`,
      live: isLive(p.status),
      updatedAt: p.updatedAt,
    })),
    ...places.map((p) => ({
      kind: "Place",
      name: p.name,
      href: `/admin/places/${p.id}`,
      live: p.isPublished,
      updatedAt: p.updatedAt,
    })),
    ...products.map((p) => ({
      kind: "Product",
      name: p.name,
      href: `/admin/products/${p.id}`,
      live: p.isPublished,
      updatedAt: p.updatedAt,
    })),
  ]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 8);

  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card title="Posts" {...pc} href="/admin/posts" />
        <Card title="Places" {...plc} href="/admin/places" />
        <Card title="Products" {...prc} href="/admin/products" />
      </div>

      <h2 className="mt-10 font-serif text-2xl">Recently updated</h2>
      {recent.length === 0 ? (
        <p className="mt-2 text-text-muted">
          Nothing yet — create your first post.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-soft-gray rounded-lg border border-soft-gray bg-white">
          {recent.map((r) => (
            <li key={r.href}>
              <a
                href={r.href}
                className="flex items-center justify-between px-4 py-3 hover:bg-soft-gray/40"
              >
                <span>
                  <span className="text-xs uppercase tracking-wide text-text-muted">
                    {r.kind}
                  </span>{" "}
                  {r.name}
                </span>
                <span className="text-xs text-text-muted">
                  {r.live ? "Published" : "Hidden"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build (dynamic admin route; no live DB needed for build)**

Run: `npm run typecheck && npm run build`
Expected: PASS. `/admin` is `force-dynamic`, so the build does not execute the queries.

- [ ] **Step 4: Commit**

```bash
git add app/admin/layout.tsx app/admin/page.tsx
git commit -m "feat(admin): left-nav + dashboard (counts + recent activity)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Posts CRUD UI — shared form state + actions + form + routes

**Files:**

- Create: `app/admin/actions/state.ts`, `app/admin/actions/posts.ts`, `app/admin/posts/PostForm.tsx`, `app/admin/posts/page.tsx`, `app/admin/posts/new/page.tsx`, `app/admin/posts/[id]/page.tsx`

**Interfaces:**

- Produces (consumed by Tasks 8–9):
  - `type FormState = { errors: Record<string,string>; formError?: string }`, `INITIAL_STATE: FormState`, `orNull(v: FormDataEntryValue | null): string | null` — `app/admin/actions/state.ts`
  - `savePost(prev: FormState, formData: FormData): Promise<FormState>`, `deletePost(id: string): Promise<void>` — `app/admin/actions/posts.ts`
- Consumes: admin posts service (Task 2); form primitives (Task 5); `POST_CATEGORIES` (Task 1); `validatePost` (Task 1).

- [ ] **Step 1: Create `app/admin/actions/state.ts`**

```ts
export type FormState = { errors: Record<string, string>; formError?: string };

export const INITIAL_STATE: FormState = { errors: {} };

/** Empty string → null (ENG-R5); trims first. */
export function orNull(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}
```

- [ ] **Step 2: Create `app/admin/actions/posts.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPost, updatePost, removePost } from "@/services/admin/posts";
import { validatePost } from "@/lib/admin/validate";
import type { PostInput } from "@/services/admin/types";
import { type FormState, orNull } from "./state";

function readPost(formData: FormData): PostInput {
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    subtitle: orNull(formData.get("subtitle")),
    excerpt: orNull(formData.get("excerpt")),
    body: orNull(formData.get("body")),
    category: String(formData.get("category") ?? "").trim(),
    tags,
    featuredImage: orNull(formData.get("featuredImage")),
    author: orNull(formData.get("author")),
    seoTitle: orNull(formData.get("seoTitle")),
    metaDescription: orNull(formData.get("metaDescription")),
    status: String(formData.get("status") ?? "draft").trim(),
    publishedAt: orNull(formData.get("publishedAt")),
  };
}

export async function savePost(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = orNull(formData.get("id"));
  const input = readPost(formData);

  const errors = validatePost(input);
  if (Object.keys(errors).length > 0) return { errors };

  const result = id ? await updatePost(id, input) : await createPost(input);

  if (!result.ok) {
    if (result.code === "23505") {
      return { errors: { slug: "That slug is already taken." } };
    }
    return { errors: {}, formError: "Could not save. Please try again." };
  }

  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function deletePost(id: string): Promise<void> {
  "use server";
  await removePost(id);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}
```

- [ ] **Step 3: Create `app/admin/posts/PostForm.tsx`**

```tsx
"use client";

import { useFormState } from "react-dom";
import { savePost } from "@/app/admin/actions/posts";
import { INITIAL_STATE } from "@/app/admin/actions/state";
import type { AdminPost } from "@/services/admin/types";
import { POST_CATEGORIES } from "@/lib/admin/enums";
import { TextField } from "@/components/admin/TextField";
import { TextAreaField } from "@/components/admin/TextAreaField";
import { SelectField } from "@/components/admin/SelectField";
import { UrlField } from "@/components/admin/UrlField";
import { SlugField } from "@/components/admin/SlugField";
import { TagsField } from "@/components/admin/TagsField";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { StatusField } from "@/components/admin/StatusField";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormError } from "@/components/admin/FormError";

export function PostForm({ post }: { post?: AdminPost }) {
  const [state, action] = useFormState(savePost, INITIAL_STATE);
  const e = state.errors;

  return (
    <form action={action} className="max-w-3xl">
      {post && <input type="hidden" name="id" value={post.id} />}
      <TextField
        name="title"
        label="Title"
        defaultValue={post?.title}
        error={e.title}
        required
      />
      <SlugField sourceId="title" defaultValue={post?.slug} error={e.slug} />
      <TextField
        name="subtitle"
        label="Subtitle"
        defaultValue={post?.subtitle}
      />
      <TextAreaField
        name="excerpt"
        label="Excerpt"
        defaultValue={post?.excerpt}
      />
      <SelectField
        name="category"
        label="Category"
        options={POST_CATEGORIES}
        defaultValue={post?.category}
        error={e.category}
      />
      <TagsField name="tags" label="Tags" defaultValue={post?.tags} />
      <UrlField
        name="featuredImage"
        label="Featured image URL"
        defaultValue={post?.featuredImage}
        error={e.featuredImage}
      />
      <TextField name="author" label="Author" defaultValue={post?.author} />
      <MarkdownField
        name="body"
        label="Body (Markdown)"
        defaultValue={post?.body}
      />
      <TextField
        name="seoTitle"
        label="SEO title"
        defaultValue={post?.seoTitle}
      />
      <TextAreaField
        name="metaDescription"
        label="Meta description"
        defaultValue={post?.metaDescription}
      />
      <StatusField defaultValue={post?.status} error={e.status} />

      {state.formError && <FormError message={state.formError} />}
      <div className="mt-4">
        <SubmitButton>{post ? "Save changes" : "Create post"}</SubmitButton>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create `app/admin/posts/page.tsx`** (list)

```tsx
import { listAllPosts } from "@/services/admin/posts";
import { statusLabel } from "@/lib/admin/workflow";
import { deletePost } from "@/app/admin/actions/posts";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function PostsListPage() {
  const posts = await listAllPosts();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Posts</h1>
        <a
          href="/admin/posts/new"
          className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          New post
        </a>
      </div>
      {posts.length === 0 ? (
        <p className="mt-6 text-text-muted">No posts yet.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-soft-gray text-left text-text-muted">
              <th className="py-2">Title</th>
              <th className="py-2">Status</th>
              <th className="py-2">Updated</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-soft-gray">
                <td className="py-2">
                  <a
                    href={`/admin/posts/${p.id}`}
                    className="hover:text-accent"
                  >
                    {p.title}
                  </a>
                </td>
                <td className="py-2">{statusLabel(p.status)}</td>
                <td className="py-2 text-text-muted">
                  {p.updatedAt.slice(0, 10)}
                </td>
                <td className="py-2 text-right">
                  <DeleteButton action={deletePost.bind(null, p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `app/admin/posts/new/page.tsx`**

```tsx
import { PostForm } from "../PostForm";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">New post</h1>
      <div className="mt-6">
        <PostForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `app/admin/posts/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getPostById } from "@/services/admin/posts";
import { PostForm } from "../PostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPostById(params.id);
  if (!post) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit post</h1>
      <div className="mt-6">
        <PostForm post={post} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify + commit**

Run: `npm run test && npm run typecheck && npm run build`
Expected: PASS (no new unit tests; existing suite stays green; build compiles the new dynamic routes).

```bash
git add app/admin/actions app/admin/posts
git commit -m "feat(admin): posts CRUD UI — actions, form, list/new/edit

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Places CRUD UI

**Files:**

- Create: `app/admin/actions/places.ts`, `app/admin/places/PlaceForm.tsx`, `app/admin/places/page.tsx`, `app/admin/places/new/page.tsx`, `app/admin/places/[id]/page.tsx`

**Interfaces:**

- Consumes: `app/admin/actions/state.ts` (Task 7); admin places service (Task 3); primitives; `PLACE_CATEGORIES`; `validatePlace`; `liveLabel`.

- [ ] **Step 1: Create `app/admin/actions/places.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPlace, updatePlace, removePlace } from "@/services/admin/places";
import { validatePlace } from "@/lib/admin/validate";
import type { PlaceInput } from "@/services/admin/types";
import { type FormState, orNull } from "./state";

function readPlace(formData: FormData): PlaceInput {
  const languages = String(formData.get("languages") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    area: orNull(formData.get("area")),
    address: orNull(formData.get("address")),
    shortDescription: orNull(formData.get("shortDescription")),
    longDescription: orNull(formData.get("longDescription")),
    whyWeLikeIt: orNull(formData.get("whyWeLikeIt")),
    bestFor: orNull(formData.get("bestFor")),
    priceRange: orNull(formData.get("priceRange")),
    instagramUrl: orNull(formData.get("instagramUrl")),
    naverMapUrl: orNull(formData.get("naverMapUrl")),
    googleMapUrl: orNull(formData.get("googleMapUrl")),
    bookingUrl: orNull(formData.get("bookingUrl")),
    contactEmail: orNull(formData.get("contactEmail")),
    contactPhone: orNull(formData.get("contactPhone")),
    languages,
    isPublished: formData.get("isPublished") === "on",
    notes: orNull(formData.get("notes")),
  };
}

export async function savePlace(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = orNull(formData.get("id"));
  const input = readPlace(formData);

  const errors = validatePlace(input);
  if (Object.keys(errors).length > 0) return { errors };

  const result = id ? await updatePlace(id, input) : await createPlace(input);
  if (!result.ok) {
    if (result.code === "23505")
      return { errors: { slug: "That slug is already taken." } };
    return { errors: {}, formError: "Could not save. Please try again." };
  }

  revalidatePath("/admin/places");
  redirect("/admin/places");
}

export async function deletePlace(id: string): Promise<void> {
  "use server";
  await removePlace(id);
  revalidatePath("/admin/places");
  redirect("/admin/places");
}
```

- [ ] **Step 2: Create `app/admin/places/PlaceForm.tsx`**

```tsx
"use client";

import { useFormState } from "react-dom";
import { savePlace } from "@/app/admin/actions/places";
import { INITIAL_STATE } from "@/app/admin/actions/state";
import type { AdminPlace } from "@/services/admin/types";
import { PLACE_CATEGORIES } from "@/lib/admin/enums";
import { TextField } from "@/components/admin/TextField";
import { TextAreaField } from "@/components/admin/TextAreaField";
import { SelectField } from "@/components/admin/SelectField";
import { UrlField } from "@/components/admin/UrlField";
import { SlugField } from "@/components/admin/SlugField";
import { TagsField } from "@/components/admin/TagsField";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormError } from "@/components/admin/FormError";

export function PlaceForm({ place }: { place?: AdminPlace }) {
  const [state, action] = useFormState(savePlace, INITIAL_STATE);
  const e = state.errors;
  return (
    <form action={action} className="max-w-3xl">
      {place && <input type="hidden" name="id" value={place.id} />}
      <TextField
        name="name"
        label="Name"
        defaultValue={place?.name}
        error={e.name}
        required
      />
      <SlugField sourceId="name" defaultValue={place?.slug} error={e.slug} />
      <SelectField
        name="category"
        label="Category"
        options={PLACE_CATEGORIES}
        defaultValue={place?.category}
        error={e.category}
      />
      <TextField name="area" label="Area" defaultValue={place?.area} />
      <TextField name="address" label="Address" defaultValue={place?.address} />
      <TextAreaField
        name="shortDescription"
        label="Short description"
        defaultValue={place?.shortDescription}
      />
      <MarkdownField
        name="longDescription"
        label="Long description (Markdown)"
        defaultValue={place?.longDescription}
      />
      <TextAreaField
        name="whyWeLikeIt"
        label="Why we like it"
        defaultValue={place?.whyWeLikeIt}
      />
      <TextField
        name="bestFor"
        label="Best for"
        defaultValue={place?.bestFor}
      />
      <TextField
        name="priceRange"
        label="Price range"
        defaultValue={place?.priceRange}
      />
      <UrlField
        name="instagramUrl"
        label="Instagram URL"
        defaultValue={place?.instagramUrl}
        error={e.instagramUrl}
      />
      <UrlField
        name="naverMapUrl"
        label="Naver Map URL"
        defaultValue={place?.naverMapUrl}
        error={e.naverMapUrl}
      />
      <UrlField
        name="googleMapUrl"
        label="Google Map URL"
        defaultValue={place?.googleMapUrl}
        error={e.googleMapUrl}
      />
      <UrlField
        name="bookingUrl"
        label="Booking URL"
        defaultValue={place?.bookingUrl}
        error={e.bookingUrl}
      />
      <TextField
        name="contactEmail"
        label="Contact email"
        defaultValue={place?.contactEmail}
        error={e.contactEmail}
      />
      <TextField
        name="contactPhone"
        label="Contact phone"
        defaultValue={place?.contactPhone}
      />
      <TagsField
        name="languages"
        label="Languages"
        defaultValue={place?.languages}
      />
      <TextAreaField
        name="notes"
        label="Internal notes"
        defaultValue={place?.notes}
      />
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={place?.isPublished}
        />
        Published
      </label>

      {state.formError && <FormError message={state.formError} />}
      <div className="mt-4">
        <SubmitButton>{place ? "Save changes" : "Create place"}</SubmitButton>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create `app/admin/places/page.tsx`**

```tsx
import { listAllPlaces } from "@/services/admin/places";
import { liveLabel } from "@/lib/admin/workflow";
import { deletePlace } from "@/app/admin/actions/places";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function PlacesListPage() {
  const places = await listAllPlaces();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Places</h1>
        <a
          href="/admin/places/new"
          className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          New place
        </a>
      </div>
      {places.length === 0 ? (
        <p className="mt-6 text-text-muted">No places yet.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-soft-gray text-left text-text-muted">
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
              <th className="py-2">Updated</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {places.map((p) => (
              <tr key={p.id} className="border-b border-soft-gray">
                <td className="py-2">
                  <a
                    href={`/admin/places/${p.id}`}
                    className="hover:text-accent"
                  >
                    {p.name}
                  </a>
                </td>
                <td className="py-2">{liveLabel(p.isPublished)}</td>
                <td className="py-2 text-text-muted">
                  {p.updatedAt.slice(0, 10)}
                </td>
                <td className="py-2 text-right">
                  <DeleteButton action={deletePlace.bind(null, p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `app/admin/places/new/page.tsx`**

```tsx
import { PlaceForm } from "../PlaceForm";

export default function NewPlacePage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">New place</h1>
      <div className="mt-6">
        <PlaceForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `app/admin/places/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getPlaceById } from "@/services/admin/places";
import { PlaceForm } from "../PlaceForm";

export const dynamic = "force-dynamic";

export default async function EditPlacePage({
  params,
}: {
  params: { id: string };
}) {
  const place = await getPlaceById(params.id);
  if (!place) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit place</h1>
      <div className="mt-6">
        <PlaceForm place={place} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify + commit**

Run: `npm run test && npm run typecheck && npm run build`
Expected: PASS.

```bash
git add app/admin/actions/places.ts app/admin/places
git commit -m "feat(admin): places CRUD UI — actions, form, list/new/edit

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Products CRUD UI

**Files:**

- Create: `app/admin/actions/products.ts`, `app/admin/products/ProductForm.tsx`, `app/admin/products/page.tsx`, `app/admin/products/new/page.tsx`, `app/admin/products/[id]/page.tsx`

**Interfaces:**

- Consumes: `app/admin/actions/state.ts`; admin products service (Task 4); primitives; `validateProduct`; `liveLabel`.

- [ ] **Step 1: Create `app/admin/actions/products.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  updateProduct,
  removeProduct,
} from "@/services/admin/products";
import { validateProduct } from "@/lib/admin/validate";
import type { ProductInput } from "@/services/admin/types";
import { type FormState, orNull } from "./state";

function readProduct(formData: FormData): ProductInput {
  const ratingRaw = orNull(formData.get("rating"));
  return {
    name: String(formData.get("name") ?? "").trim(),
    brand: orNull(formData.get("brand")),
    slug: String(formData.get("slug") ?? "").trim(),
    category: orNull(formData.get("category")),
    description: orNull(formData.get("description")),
    price: orNull(formData.get("price")),
    image: orNull(formData.get("image")),
    affiliateUrl: orNull(formData.get("affiliateUrl")),
    whereToBuy: orNull(formData.get("whereToBuy")),
    bestFor: orNull(formData.get("bestFor")),
    ingredients: orNull(formData.get("ingredients")),
    rating: ratingRaw === null ? null : Number(ratingRaw),
    disclosureRequired: formData.get("disclosureRequired") === "on",
    isPublished: formData.get("isPublished") === "on",
  };
}

export async function saveProduct(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = orNull(formData.get("id"));
  const input = readProduct(formData);

  const errors = validateProduct(input);
  if (Object.keys(errors).length > 0) return { errors };

  const result = id
    ? await updateProduct(id, input)
    : await createProduct(input);
  if (!result.ok) {
    if (result.code === "23505")
      return { errors: { slug: "That slug is already taken." } };
    return { errors: {}, formError: "Could not save. Please try again." };
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(id: string): Promise<void> {
  "use server";
  await removeProduct(id);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
```

- [ ] **Step 2: Create `app/admin/products/ProductForm.tsx`**

```tsx
"use client";

import { useFormState } from "react-dom";
import { saveProduct } from "@/app/admin/actions/products";
import { INITIAL_STATE } from "@/app/admin/actions/state";
import type { AdminProduct } from "@/services/admin/types";
import { TextField } from "@/components/admin/TextField";
import { TextAreaField } from "@/components/admin/TextAreaField";
import { UrlField } from "@/components/admin/UrlField";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormError } from "@/components/admin/FormError";

export function ProductForm({ product }: { product?: AdminProduct }) {
  const [state, action] = useFormState(saveProduct, INITIAL_STATE);
  const e = state.errors;
  return (
    <form action={action} className="max-w-3xl">
      {product && <input type="hidden" name="id" value={product.id} />}
      <TextField
        name="name"
        label="Name"
        defaultValue={product?.name}
        error={e.name}
        required
      />
      <TextField name="brand" label="Brand" defaultValue={product?.brand} />
      <TextField
        name="slug"
        label="Slug"
        defaultValue={product?.slug}
        error={e.slug}
        required
      />
      <TextField
        name="category"
        label="Category"
        defaultValue={product?.category}
      />
      <TextAreaField
        name="description"
        label="Description"
        defaultValue={product?.description}
      />
      <TextField
        name="price"
        label="Price (free text, e.g. $17)"
        defaultValue={product?.price}
      />
      <UrlField
        name="image"
        label="Image URL"
        defaultValue={product?.image}
        error={e.image}
      />
      <UrlField
        name="affiliateUrl"
        label="Affiliate URL"
        defaultValue={product?.affiliateUrl}
        error={e.affiliateUrl}
      />
      <TextField
        name="whereToBuy"
        label="Where to buy"
        defaultValue={product?.whereToBuy}
      />
      <TextField
        name="bestFor"
        label="Best for"
        defaultValue={product?.bestFor}
      />
      <TextAreaField
        name="ingredients"
        label="Ingredients"
        defaultValue={product?.ingredients}
      />
      <TextField
        name="rating"
        label="Rating (0–5)"
        defaultValue={product?.rating?.toString() ?? null}
        error={e.rating}
      />
      <label className="mb-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="disclosureRequired"
          defaultChecked={product?.disclosureRequired}
        />
        Requires affiliate disclosure
      </label>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={product?.isPublished}
        />
        Published
      </label>

      {state.formError && <FormError message={state.formError} />}
      <div className="mt-4">
        <SubmitButton>
          {product ? "Save changes" : "Create product"}
        </SubmitButton>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create `app/admin/products/page.tsx`**

```tsx
import { listAllProducts } from "@/services/admin/products";
import { liveLabel } from "@/lib/admin/workflow";
import { deleteProduct } from "@/app/admin/actions/products";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ProductsListPage() {
  const products = await listAllProducts();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Products</h1>
        <a
          href="/admin/products/new"
          className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          New product
        </a>
      </div>
      {products.length === 0 ? (
        <p className="mt-6 text-text-muted">No products yet.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-soft-gray text-left text-text-muted">
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
              <th className="py-2">Updated</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-soft-gray">
                <td className="py-2">
                  <a
                    href={`/admin/products/${p.id}`}
                    className="hover:text-accent"
                  >
                    {p.name}
                  </a>
                </td>
                <td className="py-2">{liveLabel(p.isPublished)}</td>
                <td className="py-2 text-text-muted">
                  {p.updatedAt.slice(0, 10)}
                </td>
                <td className="py-2 text-right">
                  <DeleteButton action={deleteProduct.bind(null, p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `app/admin/products/new/page.tsx`**

```tsx
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">New product</h1>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `app/admin/products/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getProductById } from "@/services/admin/products";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductById(params.id);
  if (!product) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit product</h1>
      <div className="mt-6">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify full suite + build + commit**

Run: `npm run test && npm run typecheck && npm run build`
Expected: all tests pass (≈ 38 existing + 12 Task 1 + 8 services + 10 components ≈ 68); build compiles all `/admin/*` routes as dynamic.

```bash
git add app/admin/actions/products.ts app/admin/products
git commit -m "feat(admin): products CRUD UI — actions, form, list/new/edit

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Live Smoke Checklist (post-merge, against deployed Supabase)

Not automated (no E2E harness in this MVP). After deploy, signed in as the
allowlisted admin at `/admin`:

1. Create a **draft** post → it appears in `/admin/posts` as "Draft" and is
   absent from the public `/articles`.
2. Edit it to **Published** → appears on `/articles` and `/articles/<slug>`;
   `published_at` set.
3. Try a second post with a duplicate slug → inline "That slug is already
   taken." error, no row created.
4. Repeat create→publish→delete lightly for a Place and a Product; confirm
   public `/places` and `/picks` reflect each change.
5. Delete the test post → confirm dialog → row gone from list and public site.

---

## Definition of Done (Plan 3)

- `services/admin/{posts,places,products}.ts` with listAll/getById/create/update/remove/counts; fake-client extended for writes.
- `lib/admin/{enums,workflow,validate}.ts` unit-tested; status logic isolated in `workflow.ts`; one `toRow` mapper per entity (V2 seams, spec §7).
- `/admin` Dashboard (counts + recent activity) + left-nav; list/new/edit routes for all three entities.
- Reusable `components/admin/*` primitives incl. markdown live preview, tags chips, confirm-delete; entity forms compose them; inline validation; no double-submit.
- `images.unoptimized = true`.
- `npm run test`, `npm run typecheck`, `npm run build` green.
- Live smoke checklist documented above for the post-merge pass.

**Next:** Plan 4 — Media Library (Supabase Storage) + admin en/ko i18n + Settings.
