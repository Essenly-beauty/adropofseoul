# Admin Posts + Products Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port Posts (blog) and Products admin CRUD editors onto current main, mirroring the existing `places` editor exactly, plus a shared admin left-nav.

**Architecture:** For each entity: pure parser (`lib/admin/<e>.ts`) → session admin service (`services/admin/<e>.ts`) → server actions with admin re-auth (`app/admin/<e>/actions.ts`) → `<E>Form` client component (reusing `components/admin/fields.tsx`) → three pages. Shared: post enum consts in `lib/taxonomy.ts`, a left-nav in `app/admin/layout.tsx`, dashboard links.

**Tech Stack:** Next.js 14 App Router (server components + server actions), React 18 (`useFormState` from **react-dom**, NOT `useActionState`), TypeScript, Supabase JS session client, Vitest + RTL, Tailwind.

## Global Constraints

- **The current `places` editor is the reference implementation to mirror.** For each task, READ the named places file(s) and reproduce their structure, changing only the fields/types/deltas the task specifies. Files: `lib/admin/places.ts`, `services/admin/places.ts`, `app/admin/places/actions.ts`, `components/admin/PlaceForm.tsx`, `components/admin/fields.tsx`, `app/admin/places/page.tsx`, `app/admin/places/new/page.tsx`, `app/admin/places/[id]/page.tsx`.
- React 18 / Next 14: form state via `import { useFormState } from "react-dom"` (never `useActionState`). Component tests mock react-dom's `useFormState` exactly as `components/admin/PlaceForm.test.tsx` does.
- Client components start with `"use client";`. Server-action files start with `"use server";`.
- Admin writes use session client `createClient` from `@/lib/supabase/server` (RLS `posts`/`products` `*_admin_all` = for-all-authenticated). No service-role key.
- Every server action first calls a local `requireAdmin()` that does `supabase.auth.getUser()` → `isAllowedAdmin(user?.email)` → `redirect("/admin/login")` (mirror places actions verbatim).
- Reuse read-side mappers/types where possible: `mapPostRow` + `Post` from `@/services/posts`/`@/services/types`; `mapProductRow` + `Product` likewise. Admin services select extra columns (`status`,`updated_at` for posts; `is_published`,`updated_at` for products) not in the read COLUMNS.
- Content writes revalidate `revalidatePath("/admin/<e>")` AND `revalidatePath("/", "layout")` (posts/products render across many public routes).
- slug: `slugify` from `@/lib/slug`; create derives from title/name (or provided slug), edit is read-only and never written by `update*`.
- Commit after each task; body ends with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Pre-commit prettier runs automatically. Do NOT push unless asked.
- Test runner: `npm run test -- <pattern>`; full suite `npm run test`.

---

### Task 1: Post enum consts in taxonomy

**Files:**

- Modify: `lib/taxonomy.ts`
- Test: `lib/taxonomy.test.ts` (extend existing)

**Interfaces:**

- Produces: `POST_CATEGORIES: { value: string; label: string }[]` and `POST_STATUSES: { value: string; label: string }[]`.

- [ ] **Step 1: Write the failing test** — add to `lib/taxonomy.test.ts`:

```ts
import { POST_CATEGORIES, POST_STATUSES } from "./taxonomy";

describe("post taxonomy", () => {
  it("lists the post_category enum values", () => {
    expect(POST_CATEGORIES.map((c) => c.value)).toEqual([
      "beauty",
      "hair",
      "head_spa",
      "places",
      "wellness",
      "products",
      "guides",
    ]);
  });
  it("lists the post_status enum values", () => {
    expect(POST_STATUSES.map((s) => s.value)).toEqual(["draft", "published"]);
  });
});
```

- [ ] **Step 2: Run `npm run test -- taxonomy` → FAIL** (exports missing).

- [ ] **Step 3: Implement** — append to `lib/taxonomy.ts`:

```ts
// --- Posts -----------------------------------------------------------------
export const POST_CATEGORIES: { value: string; label: string }[] = [
  { value: "beauty", label: "Beauty" },
  { value: "hair", label: "Hair" },
  { value: "head_spa", label: "Head Spa" },
  { value: "places", label: "Places" },
  { value: "wellness", label: "Wellness" },
  { value: "products", label: "Products" },
  { value: "guides", label: "Guides" },
];

export const POST_STATUSES: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];
```

- [ ] **Step 4: Run `npm run test -- taxonomy` → PASS.**
- [ ] **Step 5: Commit** `git add lib/taxonomy.ts lib/taxonomy.test.ts && git commit -m "feat(admin): post category/status taxonomy consts"`

---

### Task 2: Posts backend — parser, service, actions

**Files:**

- Create: `lib/admin/posts.ts` + `lib/admin/posts.test.ts`
- Create: `services/admin/posts.ts` + `services/admin/posts.test.ts`
- Create: `app/admin/posts/actions.ts` + `app/admin/posts/actions.test.ts`

**Interfaces:**

- `PostWriteInput = { title: string; slug: string; subtitle: string|null; excerpt: string|null; body: string|null; category: string; tags: string[]; featuredImage: string|null; author: string|null; seoTitle: string|null; metaDescription: string|null; status: string; publishedAt: string|null }`
- `parsePostForm(fd, {mode}): { ok:true; value:PostWriteInput } | { ok:false; errors }`
- `AdminPost = Post & { status: string; updatedAt: string }`
- `services/admin/posts.ts`: `listAllPosts()`, `getAdminPostById(id)`, `createPost(input)→{id}`, `updatePost(id,input)`, `deletePost(id)`, plus exported `toRow(input,{includeSlug})`.
- `app/admin/posts/actions.ts`: `FormState`, `createPostAction(_prev,fd)`, `updatePostAction(id,_prev,fd)`, `deletePostAction(id)`.

**Mirror:** `lib/admin/places.ts`, `services/admin/places.ts`, `app/admin/places/actions.ts` respectively. Apply these deltas:

**Parser (`lib/admin/posts.ts`)** — mirror `parsePlaceForm`, but:

- Fields per `PostWriteInput` above. Required: `title` (not name). slug source = provided slug or `title`.
- `category` validated against `POST_CATEGORIES` (`POST_CATEGORIES.some(c => c.value === category)`); `status` against `POST_STATUSES`; default status to `"draft"` if blank.
- `tags`: newline-split via the same `lines()` helper places uses for languages/images.
- URL field: only `featuredImage` (http(s) check).
- `publishedAt`: read as `nullable(fd, "publishedAt")` and pass through unchanged (round-trip; no validation).
- No rating/reviewCount/entryType/area logic.

- [ ] **Step 1: Write `lib/admin/posts.test.ts`** mirroring `lib/admin/places.test.ts`'s cases, adapted:

```ts
import { describe, it, expect } from "vitest";
import { parsePostForm } from "./posts";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}
const valid = { title: "Hello World", category: "beauty", status: "draft" };

describe("parsePostForm", () => {
  it("requires a title", () => {
    const r = parsePostForm(fd({ ...valid, title: " " }), { mode: "create" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.title).toBeTruthy();
  });
  it("rejects an unknown category and status", () => {
    expect(
      parsePostForm(fd({ ...valid, category: "x" }), { mode: "create" }).ok
    ).toBe(false);
    expect(
      parsePostForm(fd({ ...valid, status: "x" }), { mode: "create" }).ok
    ).toBe(false);
  });
  it("derives slug from title on create", () => {
    const r = parsePostForm(fd({ ...valid, title: "My First Post" }), {
      mode: "create",
    });
    expect(r.ok && r.value.slug).toBe("my-first-post");
  });
  it("splits tags by newline and trims/nulls text", () => {
    const r = parsePostForm(
      fd({ ...valid, tags: "kbeauty\n\nseoul\n", subtitle: "  " }),
      { mode: "create" }
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.tags).toEqual(["kbeauty", "seoul"]);
      expect(r.value.subtitle).toBeNull();
    }
  });
  it("rejects a non-http featuredImage", () => {
    expect(
      parsePostForm(fd({ ...valid, featuredImage: "ftp://x" }), {
        mode: "create",
      }).ok
    ).toBe(false);
  });
  it("passes publishedAt through unchanged", () => {
    const r = parsePostForm(
      fd({ ...valid, publishedAt: "2026-01-01T00:00:00Z" }),
      { mode: "create" }
    );
    expect(r.ok && r.value.publishedAt).toBe("2026-01-01T00:00:00Z");
  });
});
```

- [ ] **Step 2: Run `npm run test -- admin/posts` → FAIL.**
- [ ] **Step 3: Implement `lib/admin/posts.ts`** (mirror places parser with the deltas above).
- [ ] **Step 4: Run `npm run test -- admin/posts` → parser tests PASS.**

**Service (`services/admin/posts.ts`)** — mirror `services/admin/places.ts`, but:

- `COLUMNS = "id,title,slug,subtitle,excerpt,body,category,tags,featured_image,author,seo_title,meta_description,status,published_at,updated_at"`.
- `AdminPost = Post & { status: string; updatedAt: string }`; `mapAdmin(row) = { ...mapPostRow(row), status: row.status, updatedAt: row.updated_at }`. (Row type = `Parameters<typeof mapPostRow>[0] & { status: string; updated_at: string }`.)
- `listAllPosts()` orders by `updated_at desc` (no status filter).
- `toRow(input,{includeSlug})` → snake_case: title, subtitle, excerpt, body, category, tags, featured_image, author, seo_title, meta_description, status, plus **published_at auto-stamp**: `published_at: input.status === "published" && !input.publishedAt ? new Date().toISOString() : input.publishedAt`. Include `slug` only when `includeSlug`.

- [ ] **Step 5: Write `services/admin/posts.test.ts`** mirroring `services/admin/places.test.ts`: a `toRow` test asserting snake_case mapping + `toRow(input,{includeSlug:false})` omits slug + published_at auto-stamps when status published & no publishedAt; a `listAllPosts` mapping test; a `createPost` returns-id test. Use the same inline-mock style as the places service test.
- [ ] **Step 6: Run `npm run test -- services/admin/posts` → FAIL then implement `services/admin/posts.ts` → PASS.**

**Actions (`app/admin/posts/actions.ts`)** — mirror `app/admin/places/actions.ts` verbatim, but: import posts service + `parsePostForm`; `revalidatePosts()` calls `revalidatePath("/admin/posts")` and `revalidatePath("/", "layout")`; redirects use `/admin/posts?created=1|updated=1|deleted=1`; 23505 → `{ errors: { slug: "That slug already exists." } }`.

- [ ] **Step 7: Write `app/admin/posts/actions.test.ts`** mirroring `app/admin/places/actions.test.ts` (auth redirect for non-admin; validation error no-write; create+redirect). Use `title`/`category`/`status` valid fields.
- [ ] **Step 8: Run `npm run test -- app/admin/posts/actions` → FAIL then implement → PASS.**
- [ ] **Step 9: Commit** `git add lib/admin/posts.ts lib/admin/posts.test.ts services/admin/posts.ts services/admin/posts.test.ts app/admin/posts/actions.ts app/admin/posts/actions.test.ts && git commit -m "feat(admin): posts backend — parser, service, actions"`

---

### Task 3: Posts UI — PostForm + pages

**Files:**

- Create: `components/admin/PostForm.tsx` + `components/admin/PostForm.test.tsx`
- Create: `app/admin/posts/page.tsx`, `app/admin/posts/new/page.tsx`, `app/admin/posts/[id]/page.tsx`

**Interfaces:** `PostForm({ mode, post }: { mode: "create"|"edit"; post?: AdminPost })`.

**Mirror:** `components/admin/PlaceForm.tsx` + `PlaceForm.test.tsx` and the three `app/admin/places/*` pages. Deltas:

- Import `createPostAction`, `updatePostAction`, `deletePostAction`, `FormState` from `@/app/admin/posts/actions`; `AdminPost` from `@/services/admin/posts`; `POST_CATEGORIES`, `POST_STATUSES` from `@/lib/taxonomy`.
- Fields (reuse `components/admin/fields.tsx`): `title` TextField (label "Title"), `slug` TextField readOnly on edit, `subtitle` TextField, `excerpt` TextArea, `category` SelectField (POST_CATEGORIES), `tags` ListField, `featuredImage` UrlField, `author` TextField, `body` TextArea rows={12} (markdown), `seoTitle` TextField, `metaDescription` TextArea, `status` SelectField (POST_STATUSES), plus a hidden input `<input type="hidden" name="publishedAt" defaultValue={post?.publishedAt ?? ""} />`.
- Delete: inline `<form action={deletePostAction.bind(null, post.id)}>` with `confirm()` guard, edit mode only.
- List page: columns Title / Status (`post.status`) / Updated (`post.updatedAt?.slice(0,10)`) / Edit link; "New post" → `/admin/posts/new`; flash from `?created/updated/deleted`; `force-dynamic`.
- new page → `<PostForm mode="create" />`; `[id]` page → `getAdminPostById(params.id)` + `notFound()` + `<PostForm mode="edit" post={post} />`.

- [ ] **Step 1: Write `components/admin/PostForm.test.tsx`** mirroring `PlaceForm.test.tsx` (INCLUDING the `vi.mock("react-dom", ...)` useFormState shim and the `@/app/admin/posts/actions` mock): assert edit mode prefills Title + slug readOnly + delete button present; create mode slug editable + no delete button. Build an `AdminPost` fixture.
- [ ] **Step 2: Run `npm run test -- components/admin/PostForm` → FAIL.**
- [ ] **Step 3: Implement `PostForm.tsx` + the 3 pages.**
- [ ] **Step 4: Run `npm run test -- components/admin/PostForm` → PASS; then `npx tsc --noEmit` → clean.**
- [ ] **Step 5: Commit** `git add components/admin/PostForm.tsx components/admin/PostForm.test.tsx "app/admin/posts/page.tsx" "app/admin/posts/new/page.tsx" "app/admin/posts/[id]/page.tsx" && git commit -m "feat(admin): PostForm + posts list/new/edit pages"`

---

### Task 4: Products backend — parser, service, actions

**Files:**

- Create: `lib/admin/products.ts` + test; `services/admin/products.ts` + test; `app/admin/products/actions.ts` + test.

**Interfaces:**

- `ProductWriteInput = { name: string; brand: string|null; slug: string; category: string|null; description: string|null; price: string|null; image: string|null; affiliateUrl: string|null; whereToBuy: string|null; bestFor: string|null; ingredients: string|null; rating: number|null; disclosureRequired: boolean; isPublished: boolean }`
- `parseProductForm(fd,{mode})`, `AdminProduct = Product & { isPublished: boolean; updatedAt: string }`, service `listAllProducts/getAdminProductById/createProduct/updateProduct/deleteProduct/toRow`, actions `createProductAction/updateProductAction/deleteProductAction`.

**Mirror** the places parser/service/actions with deltas:

- Parser: required `name`; slug from provided slug or `name`; `category` free text (nullable, no enum check); URL check on `image`, `affiliateUrl`; `rating` number 0–5 (like places rating); `disclosureRequired` and `isPublished` checkbox (`=== "on"`). No tags/status/publishedAt.
- Service: `COLUMNS = "id,name,brand,slug,category,description,price,image,affiliate_url,where_to_buy,best_for,ingredients,rating,disclosure_required,is_published,updated_at"`; `mapAdmin(row) = { ...mapProductRow(row), isPublished: row.is_published, updatedAt: row.updated_at }`; `listAllProducts` order by `updated_at desc`; `toRow` snake_case incl. `disclosure_required`, `is_published`, slug only when includeSlug.
- Actions: revalidate `/admin/products` + `revalidatePath("/", "layout")`; flash `/admin/products?created=1|...`; 23505 slug error.

- [ ] **Step 1: Write `lib/admin/products.test.ts`** (required name; slug derive; rating range; empty→null; non-http image rejected; checkbox parsing). → FAIL → implement `lib/admin/products.ts` → PASS. Run `npm run test -- admin/products`.
- [ ] **Step 2: Write `services/admin/products.test.ts`** (toRow snake_case + omit slug on edit; listAllProducts mapping incl isPublished; createProduct returns id). → FAIL → implement `services/admin/products.ts` → PASS.
- [ ] **Step 3: Write `app/admin/products/actions.test.ts`** (auth redirect; validation no-write; create+redirect). → FAIL → implement `app/admin/products/actions.ts` → PASS.
- [ ] **Step 4: Commit** `git add lib/admin/products.* services/admin/products.* app/admin/products/actions.* && git commit -m "feat(admin): products backend — parser, service, actions"`

---

### Task 5: Products UI — ProductForm + pages

**Files:**

- Create: `components/admin/ProductForm.tsx` + test; `app/admin/products/{page,new/page,[id]/page}.tsx`.

**Mirror** `PlaceForm.tsx` + places pages. Deltas:

- Import product actions + `AdminProduct`.
- Fields: `name` TextField (req), `brand` TextField, `slug` TextField readOnly-on-edit, `category` TextField (free text), `description` TextArea, `price` TextField, `image` UrlField, `affiliateUrl` UrlField, `whereToBuy` TextField, `bestFor` TextField, `ingredients` TextArea, `rating` NumberField step="0.1", `disclosureRequired` CheckboxField, `isPublished` CheckboxField.
- Delete inline form (edit only) with confirm.
- List page columns: Name / Brand / Status (isPublished ? Published : Draft) / Updated / Edit; "New product" link; flash banner; force-dynamic. new + [id] pages mirror places.

- [ ] **Step 1: Write `components/admin/ProductForm.test.tsx`** (react-dom useFormState shim + product actions mock; edit prefill + slug readOnly + delete button; create slug editable + no delete). → FAIL.
- [ ] **Step 2: Implement `ProductForm.tsx` + 3 pages.** → `npm run test -- components/admin/ProductForm` PASS; `npx tsc --noEmit` clean.
- [ ] **Step 3: Commit** `git add components/admin/ProductForm.tsx components/admin/ProductForm.test.tsx "app/admin/products/page.tsx" "app/admin/products/new/page.tsx" "app/admin/products/[id]/page.tsx" && git commit -m "feat(admin): ProductForm + products list/new/edit pages"`

---

### Task 6: Admin left-nav + dashboard links + full verification

**Files:**

- Modify: `app/admin/layout.tsx`, `app/admin/page.tsx`

**Interfaces:** none new — wires navigation to the pages built in Tasks 3 & 5 (and existing places).

- [ ] **Step 1: Add left-nav to `app/admin/layout.tsx`.** Keep the existing auth gate (getUser + isAllowedAdmin + signOut header) untouched. Wrap `{children}` beside a left nav:

```tsx
<div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
  <nav aria-label="Admin" className="w-40 shrink-0">
    <ul className="space-y-2 text-sm">
      <li>
        <Link href="/admin" className="text-text-muted hover:text-text">
          Dashboard
        </Link>
      </li>
      <li>
        <Link href="/admin/posts" className="text-text-muted hover:text-text">
          Posts
        </Link>
      </li>
      <li>
        <Link href="/admin/places" className="text-text-muted hover:text-text">
          Places
        </Link>
      </li>
      <li>
        <Link
          href="/admin/products"
          className="text-text-muted hover:text-text"
        >
          Products
        </Link>
      </li>
    </ul>
  </nav>
  <div className="min-w-0 flex-1">{children}</div>
</div>
```

(Add `import Link from "next/link";`. Replace the current `<div className="px-6 py-8">{children}</div>` wrapper.)

- [ ] **Step 2: Update `app/admin/page.tsx` dashboard** to link all three sections:

```tsx
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      <ul className="mt-4 space-y-2">
        <li>
          <Link href="/admin/posts" className="text-accent hover:underline">
            Manage posts →
          </Link>
        </li>
        <li>
          <Link href="/admin/places" className="text-accent hover:underline">
            Manage places →
          </Link>
        </li>
        <li>
          <Link href="/admin/products" className="text-accent hover:underline">
            Manage products →
          </Link>
        </li>
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Full verification.** Run `npx tsc --noEmit` (if only stale `.next/types` errors, `rm -rf .next` then re-run) → clean. Run `npm run test` → full suite PASS. Run `npm run build` → succeeds; `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]` all present.
- [ ] **Step 4: Commit** `git add app/admin/layout.tsx app/admin/page.tsx && git commit -m "feat(admin): left-nav + dashboard links for posts/places/products"`
- [ ] **Step 5: Manual smoke (record as pending — needs live admin session):** log in → Posts → create/edit/delete a post (confirm slug read-only on edit; published post keeps its date on re-save) → Products → create/edit/delete → confirm public pages update after revalidation.

---

## Self-Review

**Spec coverage:** taxonomy consts → T1. Posts parser/service/actions → T2; Posts UI+pages → T3. Products parser/service/actions → T4; Products UI+pages → T5. Left-nav + dashboard → T6. Revalidate `/`+layout → T2/T4 actions. publishedAt round-trip + auto-stamp → T2 parser (pass-through) + service toRow (auto-stamp). Manual smoke → T6 Step 5. ✓

**Placeholder scan:** Field lists, exact types, COLUMNS strings, and mirror-source files are all concrete; "mirror places X" points to stable in-repo files, not future tasks. ✓

**Type consistency:** `PostWriteInput`/`ProductWriteInput` flow parser→service→actions; `AdminPost`/`AdminProduct` defined in services, consumed by forms/pages; `FormState` per-actions-file mirrors places. Action signatures `create*Action(_prev,fd)`, `update*Action(id,_prev,fd)`, `delete*Action(id)` bound in forms — consistent with places. ✓
