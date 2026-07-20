# Admin Posts + Products Editor (port onto current main) — Design

**Date:** 2026-07-20
**Status:** Approved (design)
**Branch:** feat/admin-posts-products (off current main)

## Problem

A full admin CMS (Posts + Places + Products CRUD, left-nav, dashboard) was built on
the branch `feat/admin-cms-crud`, but it was **never merged to main** and diverged
from an old point (merge-base `1198803`, last commit 2026-07-17) — before the Klook
Places directory rework that now lives on main. Merging it wholesale would regress the
current places directory. Meanwhile main only has: the admin auth shell (login/layout),
and the new **places** editor (added this session). There is no Posts (blog) or Products
editor on main, so the user cannot edit blog posts from the live admin.

Goal: restore the **Posts** and **Products** editors by porting them onto current main,
in the same style as the current `places` editor, without touching the places work.

## Key facts (verified)

- **Zero schema drift.** The old Posts/Products forms write columns that all still exist
  on current `posts`/`products` tables with identical names/types. Enums unchanged:
  `post_status = (draft, published)`, `post_category = (beauty, hair, head_spa, places,
wellness, products, guides)`. So this is a **restyle-to-current-pattern** job, not a
  schema reconciliation.
- Both old and current code use `useFormState` from `react-dom` (React 18 / Next 14) — no
  React 19 APIs.
- Current read layers (`services/posts.ts`, `services/products.ts`) are read-only and
  their `Post`/`Product` types omit admin-only columns (`status`, `updatedAt`,
  `isPublished`). The admin services need their own row types/mappers.
- Public posts render on many routes (home, /articles, /articles/[slug], /beauty/_,
  /wellness, /around-seoul/_); products on /beauty/picks, /ingredients/[slug], home. So
  content writes revalidate broadly with `revalidatePath("/", "layout")`.

## The pattern to mirror (current places editor)

Each entity mirrors the places editor exactly:

- `lib/admin/<entity>.ts` — pure `parse<Entity>Form(fd, {mode})` → `ParseResult` (`{ok,value}` | `{ok,errors}`), validation inlined, slug via `slugify` (create-only), `str/nullable/lines` helpers.
- `services/admin/<entity>.ts` — `Admin<Entity>` type, `COLUMNS`, `toRow(input,{includeSlug})`, `listAll*`, `get*ById`, `create*` (returns `{id}`), `update*` (omits slug), `delete*`; throw-on-error.
- `app/admin/<entity>/actions.ts` — `FormState = {ok,errors?,formError?}`, local `requireAdmin()` (redirects to `/admin/login`), `create*Action(_prev,fd)`, `update*Action(id,_prev,fd)`, `delete*Action(id)`; 23505 → slug error; flash query params; revalidate.
- `components/admin/<Entity>Form.tsx` — `useFormState`, mode prop, reuse `components/admin/fields.tsx`, inline delete `<form>` with `confirm()`.
- `app/admin/<entity>/{page,new,[id]}` — list (force-dynamic, flash banner), new, edit (`notFound()` if missing).

## Scope

### Shared

- `lib/taxonomy.ts`: add `POST_CATEGORIES: {value,label}[]` (7 post_category values) and
  `POST_STATUSES: {value,label}[]` (draft, published).
- `app/admin/layout.tsx`: add a left-nav (Dashboard · Posts · Places · Products), keeping
  the existing auth gate + sign-out header.
- `app/admin/page.tsx`: dashboard links to Posts / Places / Products (no counts — deferred).

### Posts

- Fields: `title` (req), `slug` (create-derived from title / read-only on edit), `subtitle`,
  `excerpt` (textarea), `category` (select ← POST_CATEGORIES), `tags` (ListField, newline →
  string[]), `featuredImage` (url), `author`, `body` (markdown textarea), `seoTitle`,
  `metaDescription` (textarea), `status` (select ← POST_STATUSES), and `publishedAt`
  round-trip (hidden; preserved so re-saving a published post never re-stamps it).
- `AdminPost = Post & { status: string; updatedAt: string }` (Post lacks these).
- `toRow`: auto-stamp `published_at = new Date().toISOString()` when `status === "published"
&& !publishedAt` (port from old branch); else pass through `publishedAt`.
- Note: `new Date()` is used at request time inside the service (server action runtime) — this
  is normal Next server code, unrelated to the workflow-script constraint.
- Revalidate: `/admin/posts` + `revalidatePath("/", "layout")`.

### Products

- Fields: `name` (req), `brand`, `slug` (create-derived / read-only on edit), `category`
  (free text), `description` (textarea), `price` (text), `image` (url), `affiliateUrl` (url),
  `whereToBuy`, `bestFor`, `ingredients` (textarea), `rating` (number 0–5), `disclosureRequired`
  (checkbox), `isPublished` (checkbox).
- `AdminProduct = Product & { isPublished: boolean; updatedAt: string }`.
- Revalidate: `/admin/products` + `revalidatePath("/", "layout")`.

## Out of scope (YAGNI)

- Merging `feat/admin-cms-crud` wholesale (would regress places; it's pre-Klook).
- Dashboard counts / recent-activity; candidate-review UI, writing agents, booking (those
  live on other old branches and are separate initiatives).
- Uncovered columns (`gallery_images`, `related_places`, `related_products`, social captions
  for posts) — left at DB defaults, matching how the old form worked.
- New public routes; image upload (URLs only).

## Testing

- Unit (TDD): `parsePostForm` / `parseProductForm` — required field, enum validation
  (post category/status), slug derive-on-create/keep-on-edit, empty→null, rating range,
  tags newline split, publishedAt round-trip + auto-stamp logic (test the pure decision if
  extracted, else the service `toRow`).
- Auth: post/product actions redirect when not allow-listed; validation error → no write.
- Component: PostForm/ProductForm render fields; slug read-only on edit; delete only on edit.
- Manual smoke (needs live admin session): create/edit/delete a post and a product;
  confirm public pages reflect after revalidation.

## Files

Add: `lib/admin/posts.ts`(+test), `services/admin/posts.ts`(+test), `app/admin/posts/actions.ts`(+test),
`components/admin/PostForm.tsx`(+test), `app/admin/posts/{page,new/page,[id]/page}.tsx`;
same set for products; taxonomy consts.
Modify: `lib/taxonomy.ts`, `app/admin/layout.tsx`, `app/admin/page.tsx`.
