# Place Dynamic OG Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every place detail page gets a share-preview image: the place's real photo when one exists, otherwise a generated 1200×630 brand card (place name, category, area, rating) — so WhatsApp/Facebook/Telegram/LINE/X previews and Pinterest pins are never imageless.

**Architecture:** A pure helper `lib/og.ts` decides the image URL (absolute real photo → use it; empty/relative → generated route). A route handler `app/places/[slug]/og/route.tsx` renders the brand card with `ImageResponse` from `next/og` (built into Next 14 — no new dependency). The detail page's `generateMetadata` and the `ShareButtons` `imageUrl` prop both consume the helper. We deliberately do NOT use the `opengraph-image.tsx` file convention: file-based metadata overrides `generateMetadata`, which would permanently shadow real photos added later.

**Tech Stack:** Next.js 14 route handler + `next/og` ImageResponse (satori), Vitest for the pure helper.

## Global Constraints

- No new npm dependencies (`next/og` ships with Next 14).
- English-only text in the generated card — satori's default bundled font has no Korean glyphs, so `name_kr` must NOT appear (it would render as tofu). No emoji / `★` glyphs either, same reason.
- Brand tokens (from `tailwind.config.ts`, use these exact values as inline styles — Tailwind classes don't work in satori): bg `#F2EDE5` (porcelain), text `#1C1C1C`, muted `rgba(28,28,28,0.66)`, accent `#B78B62`, letterSpacing `0.2em` for the eyebrow.
- Satori layout rule: every element with more than one child needs explicit `display: "flex"`.
- Real photo wins: `place.images[0]` is used only when it is an absolute `http(s)://` URL; empty or relative values fall back to the generated card (a relative URL handed to scrapers or Pinterest's `media=` param is a broken image).
- Branch: `feat/place-share` (commits append to open PR #13). Verify `git branch --show-current` prints `feat/place-share` before every commit — a concurrent session sometimes switches branches on this checkout.
- Test commands: `npx vitest run <file>`; full gate `npm test && npm run typecheck`.
- Do NOT unit-test the route handler (ImageResponse/WASM doesn't load under vitest jsdom) — it is verified by build + live curl in Task 3.

---

### Task 1: OG helper library (`lib/og.ts`)

**Files:**

- Create: `lib/og.ts`
- Test: `lib/og.test.ts`

**Interfaces:**

- Produces: `placeShareImage(place: Pick<Place, "slug" | "images">): string` — absolute first image if it starts with `http://`/`https://`, else `` `${SITE_URL}/places/${place.slug}/og` ``.
- Produces: `placeOgSubtitle(place: Pick<Place, "category" | "area">): string` — `"<category label> · <area>"`, omitting missing parts; unknown category falls back to `category.replace(/_/g, " ")`.

- [ ] **Step 1: Write the failing test**

Create `lib/og.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { placeShareImage, placeOgSubtitle } from "./og";
import { SITE_URL } from "./site";
import type { Place } from "@/services/types";

const cat = (v: string) => v as Place["category"];

describe("placeShareImage", () => {
  it("returns the first image when it is an absolute URL", () => {
    expect(
      placeShareImage({ slug: "soo", images: ["https://img.example/a.jpg"] })
    ).toBe("https://img.example/a.jpg");
  });

  it("falls back to the generated og route when images are empty", () => {
    expect(placeShareImage({ slug: "soo", images: [] })).toBe(
      `${SITE_URL}/places/soo/og`
    );
  });

  it("falls back when the first image is a relative path", () => {
    expect(placeShareImage({ slug: "soo", images: ["/uploads/a.jpg"] })).toBe(
      `${SITE_URL}/places/soo/og`
    );
  });
});

describe("placeOgSubtitle", () => {
  it("joins category label and area", () => {
    expect(
      placeOgSubtitle({ category: cat("head_spa"), area: "Seongsu" })
    ).toBe("Head Spa · Seongsu");
  });

  it("omits area when missing", () => {
    expect(placeOgSubtitle({ category: cat("head_spa"), area: null })).toBe(
      "Head Spa"
    );
  });

  it("humanizes an unknown category", () => {
    expect(placeOgSubtitle({ category: cat("mystery_kind"), area: null })).toBe(
      "mystery kind"
    );
  });
});
```

Note: if `PLACE_TYPE_LABELS["head_spa"]` is not exactly `"Head Spa"`, check `lib/taxonomy.ts` and use the actual label in the assertion — the test asserts the real taxonomy value, not an invented one.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/og.test.ts`
Expected: FAIL — cannot resolve `./og`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/og.ts`:

```ts
import { SITE_URL } from "@/lib/site";
import { PLACE_TYPE_LABELS } from "@/lib/taxonomy";
import type { Place } from "@/services/types";

// The share/preview image for a place: the real photo when the place has an
// absolute one, otherwise the generated brand card. Relative admin-entered
// paths fall back to the card too — a relative URL handed to link scrapers
// or Pinterest's media= param is a broken image.
export function placeShareImage(place: Pick<Place, "slug" | "images">): string {
  const first = place.images[0];
  if (first && /^https?:\/\//.test(first)) return first;
  return `${SITE_URL}/places/${place.slug}/og`;
}

export function placeOgSubtitle(
  place: Pick<Place, "category" | "area">
): string {
  const label =
    PLACE_TYPE_LABELS[place.category] ?? place.category.replace(/_/g, " ");
  return [label, place.area].filter(Boolean).join(" · ");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/og.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/og.ts lib/og.test.ts
git commit -m "feat(og): place share-image helper — real photo or generated card"
```

---

### Task 2: OG card route (`app/places/[slug]/og/route.tsx`)

**Files:**

- Create: `app/places/[slug]/og/route.tsx`

**Interfaces:**

- Consumes: `getPlaceBySlug` from `@/services/places`, `placeOgSubtitle` from `@/lib/og` (Task 1).
- Produces: `GET /places/<slug>/og` → 1200×630 PNG (`ImageResponse`), 404 plain Response for unknown slugs.

- [ ] **Step 1: Write the route handler**

Create `app/places/[slug]/og/route.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { getPlaceBySlug } from "@/services/places";
import { placeOgSubtitle } from "@/lib/og";

export const dynamic = "force-dynamic";

// Generated share card for places without a real photo. English text only:
// satori's bundled font has no Korean glyphs (name_kr would render as tofu),
// and no emoji/star glyphs — rating is shown as plain "N.N / 5".
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) return new Response("Not found", { status: 404 });

  const subtitle = placeOgSubtitle(place);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#F2EDE5",
        padding: "72px 80px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 26,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#B78B62",
          }}
        >
          A Drop of Seoul · Seoul Directory
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: place.name.length > 26 ? 64 : 84,
            fontWeight: 700,
            color: "#1C1C1C",
            lineHeight: 1.05,
          }}
        >
          {place.name}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              color: "rgba(28,28,28,0.66)",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "2px solid #B78B62",
          paddingTop: 28,
        }}
      >
        <div style={{ fontSize: 28, color: "rgba(28,28,28,0.66)" }}>
          adropofseoul — Korean beauty & places worth knowing
        </div>
        {place.rating != null && (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              color: "#1C1C1C",
            }}
          >
            {place.rating.toFixed(1)} / 5
          </div>
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
```

- [ ] **Step 2: Typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: tsc clean; build succeeds and the route list includes `/places/[slug]/og` as a dynamic (ƒ) route.

- [ ] **Step 3: Live render check**

Start `npm run dev` in the background. Pick a published slug (fetch `http://localhost:3000/places` and extract a `/places/<slug>` href), then:

```bash
curl -s -o /tmp/place-og.png -w "%{http_code} %{content_type}\n" http://localhost:3000/places/<slug>/og
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/places/definitely-not-a-slug/og
```

Expected: first prints `200 image/png` and `/tmp/place-og.png` is a valid PNG (`file /tmp/place-og.png` says PNG, 1200 x 630); second prints `404`. Kill the dev server when done. If pages 500, the Supabase free-tier DB is paused — report as a concern and rely on typecheck+build.

- [ ] **Step 4: Commit**

```bash
git add "app/places/[slug]/og/route.tsx"
git commit -m "feat(og): generated 1200x630 brand card route for places"
```

---

### Task 3: Wire previews to the helper

**Files:**

- Modify: `app/places/[slug]/page.tsx` (`generateMetadata` and the `<ShareButtons>` call)

**Interfaces:**

- Consumes: `placeShareImage` from `@/lib/og` (Task 1).

- [ ] **Step 1: Update generateMetadata**

In `app/places/[slug]/page.tsx`, add the import:

```tsx
import { placeShareImage } from "@/lib/og";
```

Replace the `openGraph` block in `generateMetadata` (currently `images: place.images[0] ? [place.images[0]] : undefined`) and add a `twitter` block, so the returned metadata is:

```tsx
return {
  title: place.name,
  description: place.shortDescription ?? undefined,
  alternates: { canonical: canonical(`/places/${place.slug}`) },
  openGraph: {
    title: place.name,
    description: place.shortDescription ?? undefined,
    images: [placeShareImage(place)],
  },
  twitter: {
    card: "summary_large_image",
    images: [placeShareImage(place)],
  },
};
```

(Without the `twitter` block, X inherits the root layout's generic `/og.png` instead of the place card.)

- [ ] **Step 2: Update the ShareButtons call**

In the same file, change the `imageUrl` prop:

```tsx
<ShareButtons
  path={`/places/${place.slug}`}
  title={`${place.name} — A Drop of Seoul`}
  imageUrl={placeShareImage(place)}
/>
```

- [ ] **Step 3: Full gate**

Run: `npm test && npm run typecheck`
Expected: all tests pass, tsc clean.

- [ ] **Step 4: Live meta check**

With `npm run dev` running, fetch a published place detail page and confirm the tags:

```bash
curl -s http://localhost:3000/places/<slug> | grep -o '<meta property="og:image"[^>]*>'
curl -s http://localhost:3000/places/<slug> | grep -o '<meta name="twitter:image"[^>]*>'
```

Expected: both point at `.../places/<slug>/og` (places have no real images yet). Kill the dev server when done. If the DB is paused, report and rely on the test suite.

- [ ] **Step 5: Commit**

```bash
git add "app/places/[slug]/page.tsx"
git commit -m "feat(og): place previews use real photo or generated card (og + twitter + pinterest)"
```
