# Admin Places Editor (CRUD) — Design

**Date:** 2026-07-20
**Status:** Approved (design)
**Branch:** (new, off main)

## Problem

Place directory entries (the Seoul directory, `places` table in Supabase) can only
be changed today by editing JSON data files and re-running `scripts/seed-places.mjs`,
or by editing the Supabase table directly. There is no admin UI. The admin area is a
login + auth shell with a placeholder dashboard (`app/admin/page.tsx` literally says
"Posts, Places, Products, and Media management arrive in the CMS plan").

The user needs to edit place info (e.g. Korean business name `name_kr`, `naver_map_url`,
descriptions) — and also create and delete entries — from an admin page.

## Scope

Full CRUD for **places only** (not Posts/Products):

- **List** all places (including unpublished).
- **Create** a new place.
- **Edit** an existing place.
- **Delete** a place (with confirmation).
- **Publish toggle** (`is_published`) as an editable field.

**slug behavior:** auto-generated from `name` via `slugify` (`lib/slug.ts`) on the
create form (prefilled, admin may adjust before saving); **read-only on edit** (changing
a published slug breaks URLs/SEO).

Out of scope (YAGNI): Posts/Products CMS; image file upload to Supabase Storage
(images edited as a URL list instead); `contact_email`, `contact_phone`,
`partnership_status`, `notes` fields (not surfaced on the site; easy to add later);
a media library; admin i18n/settings.

## Key facts (verified in code)

- **Auth / RLS:** `places_admin_all` RLS policy is `for all to authenticated using(true)
with check(true)` (`supabase/migrations/0002_rls.sql`). The session-aware server client
  (`lib/supabase/server.ts`, anon key + user cookies) can therefore read/write places
  once an admin is logged in. **No service-role key needed.** The real access gate is the
  app-level email allowlist `isAllowedAdmin` (`lib/auth.ts`) enforced by `middleware.ts`
  - `app/admin/layout.tsx`.
- **Schema (`places`):** `id, name, slug (unique), category (place_category enum), area,
address, short_description, long_description, why_we_like_it, best_for, price_range,
instagram_url, naver_map_url, google_map_url, booking_url, languages (text[]),
images (jsonb array), is_published, created_at, updated_at` — plus added-later columns
  `name_kr, entry_type (place_entry_type enum), rating (numeric(3,1)), review_count,
website_url, service_detail`.
- **Enums for selects:** categories from `PLACE_TYPE_LABELS` (14 values, `lib/taxonomy.ts`);
  entry kinds from `PLACE_ENTRY_KINDS` (`place` | `experience`).
- **Existing read layer** (`services/places.ts`) filters `is_published = true` and omits
  `is_published` from its `Place` type — so the admin needs its own service/type.

## Architecture

Small units, each with one responsibility, layered on the existing admin auth shell.

### 1. Admin place service — `services/admin/places.ts`

Session-aware (`createClient()`). Reads/writes without the `is_published` filter.

- `type AdminPlace = Place & { id: string; isPublished: boolean }`
- `listAllPlaces(): Promise<AdminPlace[]>` — all rows, `order("name")`.
- `getAdminPlaceById(id: string): Promise<AdminPlace | null>`
- `createPlace(input: PlaceWriteInput): Promise<{ id: string }>`
- `updatePlace(id: string, input: PlaceWriteInput): Promise<void>`
- `deletePlace(id: string): Promise<void>`

Reuses `mapPlaceRow` shape; extends columns to include `id, is_published`. Maps
`images` (jsonb) as a JS array and `languages` as `text[]` on write.

### 2. Pure validation / normalization — `lib/admin/places.ts`

No I/O, fully unit-testable.

- `type PlaceWriteInput = { name, nameKr, slug, category, entryType, area, address,
serviceDetail, shortDescription, longDescription, whyWeLikeIt, bestFor, priceRange,
rating, reviewCount, websiteUrl, instagramUrl, naverMapUrl, googleMapUrl, bookingUrl,
languages: string[], images: string[], isPublished: boolean }`
- `parsePlaceForm(formData: FormData, opts: { mode: "create" | "edit"; currentSlug?: string }):
{ ok: true; value: PlaceWriteInput } | { ok: false; errors: Record<string,string> }`
  - Trims strings; empty → `null` for nullable text fields.
  - `name` required.
  - `category` must be a key of `PLACE_TYPE_LABELS`; `entryType` ∈ `place|experience`.
  - `rating`: optional; if present, a number 0–5 (numeric(3,1)); else null.
  - `reviewCount`: optional non-negative integer; else null.
  - URL fields: if non-empty, must start with `http://` or `https://`.
  - `languages`, `images`: split a textarea on newlines, trim, drop blanks.
  - slug: on `create`, derive from `name` via `slugify` if the slug field is blank,
    else `slugify` the provided slug; must be non-empty after slugify. On `edit`, ignore
    any submitted slug and keep `currentSlug` (slug is read-only).

### 3. Server actions — `app/admin/places/actions.ts` (`"use server"`)

Each action re-verifies the caller is an allowed admin (defense in depth — actions can
be invoked directly, not only through the gated UI):

- helper `requireAdmin()`: `supabase.auth.getUser()` → `isAllowedAdmin(user.email)`;
  redirect to `/admin/login` if not.
- `createPlaceAction(formData)` → requireAdmin → `parsePlaceForm(create)` →
  `createPlace` → `revalidate` → `redirect("/admin/places?created=1")`.
- `updatePlaceAction(id, formData)` → requireAdmin → `parsePlaceForm(edit, currentSlug)`
  → `updatePlace` → `revalidate` → `redirect("/admin/places?updated=1")`.
- `deletePlaceAction(id)` → requireAdmin → `deletePlace` → `revalidate` →
  `redirect("/admin/places?deleted=1")`.
- On validation failure, re-render the form with errors (return errors; the form is a
  client component reading an action result via `useActionState`, or a simpler
  error-via-searchParam approach — see Form below).
- Handle slug unique-constraint violation (Postgres 23505) on create with a friendly
  "slug already exists" error rather than a 500.
- `revalidate`: `revalidatePath("/admin/places")`, `revalidatePath("/places")`,
  and `revalidatePath("/places/[slug]", "page")`.

### 4. Admin form primitives — `components/admin/fields.tsx`

Presentational, reused across the form: `TextField`, `TextArea`, `UrlField`,
`SelectField`, `NumberField`, `ListField` (textarea, one value per line, for
languages/images), `CheckboxField`. Each accepts `label, name, defaultValue, error?`.

### 5. PlaceForm — `components/admin/PlaceForm.tsx` (client)

One form for both create and edit (`mode` prop). Uses `useActionState` to bind to the
server action and surface per-field errors. Renders the field set from §2. slug field:
editable input on `create` (prefilled), read-only display on `edit`. Category/entryType
as `SelectField`. `is_published` as `CheckboxField`. Submit + (on edit) a Delete button
that posts `deletePlaceAction` behind a `confirm()`.

### 6. Pages

- `app/admin/places/page.tsx` — server component. Lists `listAllPlaces()`: name (+ name_kr),
  category label, area, published badge, Edit link. "New place" button → `/admin/places/new`.
  Shows a success flash from `?created/updated/deleted`.
- `app/admin/places/new/page.tsx` — renders `<PlaceForm mode="create" />`.
- `app/admin/places/[id]/page.tsx` — loads `getAdminPlaceById(id)`; `notFound()` if missing;
  renders `<PlaceForm mode="edit" place={...} />`.
- `app/admin/page.tsx` — replace the placeholder dashboard body with a link to
  `/admin/places` (and leave room for future Posts/Products links).

## Data-flow

Admin logs in (existing) → `/admin` → Places → list (`listAllPlaces`) → New/Edit form →
submit → server action (`requireAdmin` → `parsePlaceForm` → service write → revalidate →
redirect). Public `/places` + `/places/[slug]` reflect changes after revalidation.

## Error handling

- Validation errors → re-render form with field-level messages, no write.
- Slug collision on create → friendly form error.
- Not-authenticated / not-allowed on an action → redirect to `/admin/login`.
- Missing place on edit → `notFound()`.
- Supabase/network error → surfaced as a form-level error message (no silent success).

## Testing

- **Unit (TDD):** `parsePlaceForm` — required name; enum validation; rating range;
  URL prefix; languages/images newline split; slug derive-on-create vs keep-on-edit;
  empty→null normalization. (`lib/admin/places.test.ts`)
- **Auth:** `requireAdmin` redirects when the session user is absent or not allow-listed;
  passes for an allow-listed user (mock supabase client). (`app/admin/places/actions.test.ts`)
- **Component:** `PlaceForm` renders all fields; slug read-only in edit mode, editable in
  create mode; delete button present only in edit mode. (`components/admin/PlaceForm.test.tsx`)
- **Manual smoke (needs a live session + Supabase):** log in → create a test place →
  see it in `/admin/places` and (if published) `/places` → edit `name_kr`/`naver_map_url`
  → delete it. Documented as a checklist; not automated (RLS write needs a real session).

## Files

Create: `services/admin/places.ts`, `lib/admin/places.ts`, `app/admin/places/actions.ts`,
`app/admin/places/page.tsx`, `app/admin/places/new/page.tsx`, `app/admin/places/[id]/page.tsx`,
`components/admin/fields.tsx`, `components/admin/PlaceForm.tsx`, plus the test files above.
Modify: `app/admin/page.tsx` (dashboard link).
