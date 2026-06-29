# A Drop of Seoul — Admin CMS (CRUD Core) Design Spec — Plan 3

> Elaborates §5 of the MVP design spec (`2026-06-29-adropofseoul-mvp-design.md`).
> This is the **CRUD core** slice of the Admin CMS. Media Library, admin en/ko
> i18n, and the Settings page are deferred to Plan 4.

## 1. Goal

Give the allowlisted editor a working CMS to **create, edit, publish, and
delete** Posts, Places, and Products, plus a Dashboard summarizing content
state — all built on the existing `/admin` auth shell and the Plan 1 schema.
No new runtime dependencies; same Server Component + Server Action grain as
Plans 1–2.

The architecture must also be **forward-compatible with a future V2 "AI
Editorial OS"** (§7) so those features land as additive changes, not rewrites.

## 2. Scope

**In scope (Plan 3):**

- Admin service layer (separate module) with full CRUD for posts/places/products.
- Pure input validators + slug suggestion/uniqueness handling.
- Dashboard: per-entity draft/published counts + recent-activity list.
- List pages, create pages, edit pages for all three entities.
- Admin left-nav added to the existing `/admin` layout.
- Reusable admin form-field primitives (incl. markdown editor with live preview).
- Hard delete with a confirmation dialog.
- URL-based images; `images.unoptimized = true` in `next.config.js`.
- Data-driven status/workflow handling (the V2 seam — see §7).

**Out of scope (→ Plan 4):**

- Media Library (Supabase Storage `media` bucket, drag-drop upload, alt text,
  folder/search, pick-as-featured/gallery).
- Admin en/ko i18n dictionary toggle.
- Settings page.
- Surfacing P2-deferred fields in forms: social caption columns
  (`instagram_caption`, `threads_post`, `x_post`, `pinterest_title`,
  `pinterest_description`), and the `related_places` / `related_products`
  relation pickers. (Columns exist in the schema; the CMS leaves them untouched.)

## 3. Confirmed Decisions (from brainstorm)

- **Slice:** CRUD core first; Media/i18n/Settings → Plan 4.
- **Images:** pasted URL fields now; `images.unoptimized = true` (one-line
  revert when Media Library + Storage host allow-listing lands in Plan 4).
- **Delete:** hard delete, guarded by a confirmation dialog. "Hide but keep" is
  already served by `draft` status / `is_published = false`.
- **Approach:** Server Actions for writes; Server Components read through a new
  admin service layer; hand-rolled pure validators (matching `lib/validation.ts`
  - `lib/slug.ts`); reusable form primitives. No `react-hook-form`/`zod`/API
    routes.

## 4. Architecture

### 4.1 Admin service layer — `services/admin/{posts,places,products}.ts`

Kept **separate** from the public read services (`services/posts.ts`, etc.) so a
public page can never accidentally query drafts. Each module exposes:

- `listAll(): Promise<T[]>` — all rows incl. drafts/unpublished, newest-updated
  first. Bounded with an explicit high limit (e.g. 500).
- `getById(id: string): Promise<T | null>` — any status (for the edit form).
- `create(input: TInput): Promise<{ id } | { error }>`
- `update(id, input): Promise<{ ok } | { error }>`
- `delete(id): Promise<{ ok } | { error }>`

These use the **server** Supabase client (`@/lib/supabase/server`). Row-shape
mapping reuses/extends the existing `mapPostRow`-style mappers. `create`/`update`
map a typed camelCase `input` → snake_case row via a single `toRow(input)`
function per entity, so **adding a future field is a mechanical edit** to the
input type + `toRow` + form (the V2 seam, §7).

**Security note:** the write RLS policies are `for all to authenticated`
(any authenticated session passes). The real gate is the **app-layer email
allowlist** (`isAllowedAdmin` in the `/admin` layout + middleware). This is
acceptable because Supabase email signups are disabled and only the seeded
admin exists; documented here so it is a conscious choice, revisited if
non-admin auth is ever introduced.

### 4.2 Validation + slug — `lib/admin/validate.ts`

Pure functions, unit-tested (TDD), mirroring `isValidEmail`:

- `validatePost(input) / validatePlace(input) / validateProduct(input)
→ Record<string, string>` (empty = valid). Checks: required fields
  (title/name, slug, category), URL-shaped fields when present, rating range
  for products, etc.
- Slug: reuse `lib/slug.ts#slugify` to auto-suggest from title/name on the
  client. DB `unique` constraint is the source of truth; a `23505` from
  create/update is surfaced as an inline slug field error
  ("That slug is already taken").

### 4.3 Status / workflow — `lib/admin/workflow.ts` (V2 seam)

A **data-driven** status config rather than hardcoded `=== "published"` checks
scattered across the code:

- `POST_STATUSES` derived from the current DB enum (`draft`, `published`), with
  helpers `isLive(status)` and `statusLabel(status)`.
- Places/products keep their `is_published` boolean, wrapped by the same
  `isLive`/label helpers so the UI is uniform.

This isolates the single place that must change when V2 extends the editorial
workflow (see §7).

### 4.4 Routes (under the gated `/admin` shell)

```
app/admin/
  layout.tsx                 # MODIFY: add left-nav (Dashboard·Posts·Places·Products)
  page.tsx                   # REPLACE: real Dashboard
  posts/
    page.tsx                 # list table
    new/page.tsx             # create form
    [id]/page.tsx            # edit form
  places/  (same shape)
  products/  (same shape)
  actions/
    posts.ts  places.ts  products.ts   # "use server" create/update/delete
```

- **Dashboard:** for each entity, count of draft vs published (+ total) and a
  "recently updated" list (latest ~5 across entities, linking to their edit
  page). Count queries use Supabase `head: true, count: "exact"`.
- **List page:** table of name/title · status badge · updated date ·
  Edit / Delete. Empty + loading states.
- **Create/Edit:** the entity form (§4.5). Edit page `notFound()`s on unknown id.
- Server actions live in `app/admin/actions/*` and call the admin service layer,
  then `revalidatePath` + `redirect` to the list on success, or return field
  errors for inline display.

### 4.5 Form components — `components/admin/`

Reusable primitives (tested with Testing Library):

- `TextField`, `TextAreaField`, `SelectField`, `TagsField` (comma/enter chips),
  `UrlField`, `MarkdownField` (textarea + live preview reusing public `<Prose>`),
  `StatusField` (driven by `workflow.ts`).
- `SubmitButton` — disabled + spinner while pending (no double-submit, ENG-R7).
- `DeleteButton` — opens a confirm dialog; only then fires the delete action.
- `FormError` / inline `aria-invalid` field errors (a11y, ENG/DSN form rules).

Three entity forms (`PostForm`, `PlaceForm`, `ProductForm`) compose these.
Fields exposed = all schema columns for the entity **except** the §2 deferred
set. Images are `UrlField`s. Forms use `useFormState` against their server action
so validation errors render inline and survive a failed submit.

### 4.6 Config — `next.config.js`

Add `images: { unoptimized: true }`. Documented as a temporary measure tied to
the Plan 4 Media Library (revert + add Storage `remotePatterns` then).

## 5. Data model touchpoints

No schema migration in Plan 3 — all needed columns exist (Plan 1, migration
0001). Per entity, the CMS reads/writes:

- **posts:** title, slug, subtitle, excerpt, body (markdown), category
  (`post_category`), tags, featured_image (URL), author, seo_title,
  meta_description, status (`post_status`), published_at. _Untouched:_
  gallery_images, related_*, social caption fields.
- **places:** name, slug, category (`place_category`), area, address,
  short_description, long_description, why_we_like_it, best_for, price_range,
  instagram_url, naver_map_url, google_map_url, booking_url, contact_email,
  contact_phone, languages, is_published, notes. _Untouched:_ images (jsonb),
  partnership_status (P2 CRM).
- **products:** name, brand, slug, category, description, price, image (URL),
  affiliate_url, where_to_buy, best_for, ingredients, rating, disclosure_required,
  is_published.

`published_at` is set automatically when a post first transitions to
`published` and left as-is otherwise.

## 6. Testing strategy

- **Unit (TDD):** validators (`lib/admin/validate.ts`), `workflow.ts` helpers.
- **Component (Testing Library):** MarkdownField preview renders sanitized
  markdown; SubmitButton disables on pending; DeleteButton requires confirm;
  FormError renders inline messages; StatusField reflects config.
- **Build:** `npm run typecheck && npm run build` green.
- **Live smoke (deferred checkpoint, like Plan 2):** against the deployed
  Supabase — create a draft post, publish it, confirm it appears on the public
  site, edit it, delete it; repeat lightly for place/product. Documented as a
  manual checklist; not automated (no E2E harness in this MVP).

## 7. Forward-compatibility: V2 AI Editorial OS

Plan 3 does **not** build these, but its architecture must let them land
additively. The seams:

| V2 capability                                                                                                | Seam in Plan 3                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Editorial workflow statuses** (idea→brief→research→draft→AI review→editor review→ready→published→archived) | All status logic flows through `lib/admin/workflow.ts` + `StatusField`. V2 extends the status set there and adds enum values via an **additive** `ALTER TYPE post_status ADD VALUE` migration. No scattered string checks to hunt down. |
| **Content brief fields** (angle, target keyword, audience, outline)                                          | New columns land via additive migration; surfaced by adding to the entity input type + `toRow` + a new form section. The form is built from composable primitives + sections, so a "Brief" section slots in.                            |
| **Research workspace fields** (sources, notes, quotes)                                                       | Same additive-field path; likely a `jsonb` column or companion `post_research` table. The admin service `getById`/`update` already pass a typed input object end-to-end.                                                                |
| **AI review placeholders** (scores, suggestions, status)                                                     | The edit page uses a **two-column layout** reserving a right-hand panel region; V2 mounts an "AI Review" panel there. Stored fields follow the additive-column path.                                                                    |
| **Internal link suggestions**                                                                                | Consumes the admin `listAll()` (already returns all posts incl. drafts) to compute candidates; rendered in the reserved edit-page panel.                                                                                                |
| **Social repurposing fields**                                                                                | The social caption columns already exist (`instagram_caption`, etc.); Plan 3 leaves them in the schema untouched, V2 adds a "Repurpose" form section reading/writing them — no migration needed.                                        |
| **Review checklist fields**                                                                                  | Additive `jsonb`/columns + a checklist section composed from the same primitives.                                                                                                                                                       |

**Design rules that keep these cheap:**

1. Status is never compared to a literal outside `workflow.ts`.
2. Entity create/update go through one typed `input → toRow` mapper — adding a
   field touches the type, the mapper, and the form; nothing structural.
3. The edit page is laid out as `main form + reserved side panel` from day one
   (the panel is empty/omitted in Plan 3 but the layout exists).
4. Admin services already expose drafts/all-rows, which V2 link-suggestion and
   workflow views need.

Plan 3 adds **no speculative columns or tables** (YAGNI); it only guarantees the
_shape_ of the code makes V2 additive.

## 8. Definition of Done (Plan 3)

- `services/admin/{posts,places,products}.ts` with `listAll/getById/create/update/delete`.
- `lib/admin/validate.ts` + `lib/admin/workflow.ts`, unit-tested.
- `/admin` Dashboard (counts + recent activity); list/new/edit routes for all
  three entities; admin left-nav in the layout.
- Reusable `components/admin/*` primitives incl. markdown live preview; entity
  forms composing them; inline validation; no double-submit; hard delete +
  confirm.
- `images.unoptimized = true`.
- `npm run test`, `npm run typecheck`, `npm run build` green.
- V2 seams in place per §7 (workflow config, single `toRow` mapper, reserved
  edit-page side-panel layout).
- Live smoke checklist (§6) documented for the post-merge provisioning pass.

**Next:** Plan 4 — Media Library (Storage) + admin en/ko i18n + Settings.
