# Home & Shared Chrome Editorial Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the A Drop of Seoul homepage and shared chrome (header, footer, cards) into a premium editorial identity — quiet rhode/Kinfolk masthead flowing into structured Monocle/ITG sections.

**Architecture:** Introduce two shared primitives (`Eyebrow`, `TonalFrame`) and a `Reveal` scroll-in wrapper, refactor the four editorial cards onto them, replace the category card grid with a Monocle-style labeled index, and reassemble `app/page.tsx` from new section components. Design tokens and motion are added to `tailwind.config.ts`; no data-layer or route changes.

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 · Vitest + @testing-library/react (jsdom) · next/font (Cormorant Garamond + Inter).

## Global Constraints

- Palette tokens (unchanged): bg `#FAF8F4`, ink `#1C1C1C`, muted `rgba(28,28,28,0.60)`, accent `#B78B62` / hover `#A2774F`, hairline `#E8E2DA`, blush `#E9D6CF`. New: porcelain `#F2EDE5`.
- Fonts: display/headings = Cormorant Garamond (`font-serif`); body/UI/labels = Inter (`font-sans`). Already wired in `app/layout.tsx`.
- Tests use Vitest globals (`describe/it/expect`) + `@testing-library/react`; assert with `.toBeTruthy()` / `getAttribute()` (do NOT use jest-dom matchers — no setup file is configured).
- All motion must be gated by `prefers-reduced-motion: reduce`.
- No changes to `services/*`, route data fetching, or the Supabase schema.
- Every task ends green on the commands it touches; the final task must pass `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- Commit style matches repo: `type(scope): summary`, footer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Work happens on branch `feat/home-editorial-redesign` (already created).

---

## File Structure

**Create:**

- `lib/reading-time.ts` — pure `readingTime(body)` helper.
- `components/editorial/Eyebrow.tsx` — uppercase tracked label.
- `components/editorial/TonalFrame.tsx` — image-or-tonal-placeholder frame.
- `components/editorial/Reveal.tsx` — client scroll-in wrapper.
- `components/editorial/CategoryIndex.tsx` — Monocle-style category rows.
- `components/editorial/FeaturedStory.tsx` — asymmetric featured cover unit.
- Tests colocated: `lib/reading-time.test.ts`, `components/editorial/{Eyebrow,TonalFrame,Reveal,CategoryIndex,FeaturedStory,SiteFooter}.test.tsx`.

**Modify:**

- `tailwind.config.ts` — porcelain color, letterSpacing, transition duration/timing tokens.
- `app/globals.css` — focus-visible, reduced-motion, selection.
- `app/layout.tsx` — `<noscript>` reveal fallback.
- `lib/categories.ts` — `blurb` per category + `categoryLabel(value)`.
- `lib/site.ts` — `HERO_KICKER`, `HERO_LEDE`.
- `components/editorial/{ArticleCard,PlaceCard,ProductCard,Hero,SiteHeader,SiteFooter,NewsletterForm}.tsx` and their tests.
- `app/page.tsx` — reassembled section layout.

**Delete:**

- `components/editorial/CategoryCard.tsx` (replaced by `CategoryIndex`) — after confirming it is imported only by `app/page.tsx`.

---

### Task 1: Design tokens, motion, and global base

**Files:**

- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**

- Consumes: nothing.
- Produces: Tailwind utilities used by every later task — `bg-porcelain`, `tracking-label` (0.2em), `duration-fast|medium|slow`, `ease-editorial`. Fixes the currently-undefined `duration-medium` used in existing cards.

- [ ] **Step 1: Add tokens to `tailwind.config.ts`**

Replace the `theme.extend` block so it reads:

```ts
  theme: {
    extend: {
      colors: {
        bg: "#FAF8F4",
        text: { DEFAULT: "#1C1C1C", muted: "rgba(28,28,28,0.66)" },
        accent: { DEFAULT: "#B78B62", hover: "#A2774F" },
        "soft-gray": "#E8E2DA",
        "muted-pink": "#E9D6CF",
        porcelain: "#F2EDE5",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      borderRadius: { sm: "4px", md: "8px", lg: "16px" },
      maxWidth: { content: "72rem" },
      letterSpacing: { label: "0.2em" },
      transitionDuration: { fast: "200ms", medium: "350ms", slow: "500ms" },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
    },
  },
```

- [ ] **Step 2: Extend `app/globals.css`**

Append inside the file (after the existing `@layer base` block, add a new block):

```css
@layer base {
  ::selection {
    background: #e9d6cf;
    color: #1c1c1c;
  }
  :focus-visible {
    outline: 2px solid #b78b62;
    outline-offset: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Add `<noscript>` reveal fallback to `app/layout.tsx`**

Inside `<html>`, before `<body>`, add a `<head>`-level noscript so scroll-reveal content is visible without JS. Add this element as the first child of the `<body>` return (Next allows `<noscript>` in body):

```tsx
<body className="font-sans antialiased">
  <noscript>
    <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
  </noscript>
  <SiteHeader />
  <div className="min-h-screen">{children}</div>
  <SiteFooter />
</body>
```

- [ ] **Step 4: Verify build tooling accepts the config**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0 (no type or lint errors).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "$(printf 'feat(design): editorial tokens, motion, reduced-motion base\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 2: `readingTime` helper

**Files:**

- Create: `lib/reading-time.ts`
- Test: `lib/reading-time.test.ts`

**Interfaces:**

- Produces: `readingTime(body: string | null | undefined): number | null` — whole minutes at 200 wpm, min 1; `null` when no words.

- [ ] **Step 1: Write the failing test** — `lib/reading-time.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { readingTime } from "./reading-time";

describe("readingTime", () => {
  it("returns null for empty or missing body", () => {
    expect(readingTime(null)).toBe(null);
    expect(readingTime(undefined)).toBe(null);
    expect(readingTime("   ")).toBe(null);
  });
  it("rounds words at 200 wpm with a 1-minute floor", () => {
    expect(readingTime("word ".repeat(100))).toBe(1);
    expect(readingTime("word ".repeat(500))).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/reading-time.test.ts`
Expected: FAIL — cannot import `readingTime`.

- [ ] **Step 3: Write the implementation** — `lib/reading-time.ts`

```ts
export function readingTime(body: string | null | undefined): number | null {
  if (!body) return null;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return null;
  return Math.max(1, Math.round(words / 200));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/reading-time.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/reading-time.ts lib/reading-time.test.ts
git commit -m "$(printf 'feat(lib): readingTime helper (200 wpm, min 1)\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 3: `Eyebrow` primitive

**Files:**

- Create: `components/editorial/Eyebrow.tsx`
- Test: `components/editorial/Eyebrow.test.tsx`

**Interfaces:**

- Produces: `<Eyebrow tone?="accent"|"muted" className?>children</Eyebrow>` — renders a `<p>` with `uppercase tracking-label` and the tone color.

- [ ] **Step 1: Write the failing test** — `components/editorial/Eyebrow.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Eyebrow } from "./Eyebrow";

describe("Eyebrow", () => {
  it("renders label text with uppercase tracking", () => {
    render(<Eyebrow>This Week</Eyebrow>);
    const el = screen.getByText("This Week");
    expect(el.className.includes("uppercase")).toBe(true);
    expect(el.className.includes("tracking-label")).toBe(true);
  });
  it("uses muted tone when requested", () => {
    render(<Eyebrow tone="muted">7 min read</Eyebrow>);
    expect(
      screen.getByText("7 min read").className.includes("text-text-muted")
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/Eyebrow.test.tsx`
Expected: FAIL — cannot import `Eyebrow`.

- [ ] **Step 3: Write the implementation** — `components/editorial/Eyebrow.tsx`

```tsx
export function Eyebrow({
  children,
  tone = "accent",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "accent" | "muted";
  className?: string;
}) {
  const color = tone === "accent" ? "text-accent" : "text-text-muted";
  return (
    <p
      className={`text-[11px] font-medium uppercase tracking-label ${color} ${className}`}
    >
      {children}
    </p>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/Eyebrow.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/Eyebrow.tsx components/editorial/Eyebrow.test.tsx
git commit -m "$(printf 'feat(editorial): Eyebrow label primitive\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 4: `TonalFrame` primitive

**Files:**

- Create: `components/editorial/TonalFrame.tsx`
- Test: `components/editorial/TonalFrame.test.tsx`

**Interfaces:**

- Consumes: `next/image`.
- Produces: `<TonalFrame src?={string|null} alt={string} label?={string} ratio?={string} sizes?={string} priority?={boolean} className?={string} />`. Renders `next/image` (object-cover, hover zoom via ancestor `group`) when `src` is truthy; otherwise a blush→porcelain→hairline gradient with grain texture and an optional corner `label`. Default `ratio="aspect-[3/2]"`.

- [ ] **Step 1: Write the failing test** — `components/editorial/TonalFrame.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TonalFrame } from "./TonalFrame";

describe("TonalFrame", () => {
  it("renders a placeholder label when no src is given", () => {
    render(<TonalFrame alt="Head spa" label="Seongsu" />);
    expect(screen.getByText("Seongsu")).toBeTruthy();
    expect(screen.queryByRole("img")).toBe(null);
  });
  it("renders an image with alt text when src is given", () => {
    render(
      <TonalFrame src="/x.jpg" alt="Head spa" sizes="100vw" label="Seongsu" />
    );
    expect(screen.getByAltText("Head spa")).toBeTruthy();
    expect(screen.queryByText("Seongsu")).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/TonalFrame.test.tsx`
Expected: FAIL — cannot import `TonalFrame`.

- [ ] **Step 3: Write the implementation** — `components/editorial/TonalFrame.tsx`

```tsx
import Image from "next/image";

const PLACEHOLDER_BG =
  "radial-gradient(120% 120% at 70% 15%, #E9D6CF 0%, rgba(233,214,207,0) 55%), linear-gradient(155deg, #F2EDE5 0%, #E8E2DA 100%)";
const GRAIN = "radial-gradient(rgba(28,28,28,0.05) 0.5px, transparent 0.6px)";

export function TonalFrame({
  src,
  alt,
  label,
  ratio = "aspect-[3/2]",
  sizes,
  priority,
  className = "",
}: {
  src?: string | null;
  alt: string;
  label?: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm ${ratio} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.04]"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: PLACEHOLDER_BG }}
        >
          <div
            className="absolute inset-0 opacity-50"
            style={{ backgroundImage: GRAIN, backgroundSize: "4px 4px" }}
          />
          {label && (
            <span
              className="absolute bottom-3.5 left-4 text-[10.5px] uppercase tracking-label"
              style={{ color: "rgba(28,28,28,0.34)" }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/TonalFrame.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/TonalFrame.tsx components/editorial/TonalFrame.test.tsx
git commit -m "$(printf 'feat(editorial): TonalFrame image-or-placeholder primitive\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 5: `Reveal` scroll-in wrapper

**Files:**

- Create: `components/editorial/Reveal.tsx`
- Test: `components/editorial/Reveal.test.tsx`

**Interfaces:**

- Produces: client component `<Reveal className?>children</Reveal>`. Renders children in a `<div data-reveal>` that starts translated/faded and reveals on first intersection. Falls back to visible immediately when `IntersectionObserver` is unavailable or reduced-motion is set. Children are always present in the DOM (crawlable); the `<noscript>` rule from Task 1 forces visibility without JS.

- [ ] **Step 1: Write the failing test** — `components/editorial/Reveal.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "./Reveal";

describe("Reveal", () => {
  it("renders its children (visible fallback without IntersectionObserver)", () => {
    render(
      <Reveal>
        <p>Featured Story</p>
      </Reveal>
    );
    expect(screen.getByText("Featured Story")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/Reveal.test.tsx`
Expected: FAIL — cannot import `Reveal`.

- [ ] **Step 3: Write the implementation** — `components/editorial/Reveal.tsx`

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (typeof IntersectionObserver === "undefined" || reduce) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal
      className={`transition-all duration-700 ease-editorial ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/Reveal.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/Reveal.tsx components/editorial/Reveal.test.tsx
git commit -m "$(printf 'feat(editorial): Reveal scroll-in wrapper (reduced-motion + no-JS safe)\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 6: Category blurbs, `categoryLabel`, and hero copy constants

**Files:**

- Modify: `lib/categories.ts`
- Modify: `lib/site.ts`
- Test: `lib/categories.test.ts` (create)

**Interfaces:**

- Produces:
  - `Category` gains `blurb: string`.
  - `categoryLabel(value: string): string` — maps a post's enum value (e.g. `"head_spa"`) to its display label (`"Head Spa"`), falling back to the raw value.
  - `HERO_KICKER: string`, `HERO_LEDE: string` in `lib/site.ts`.

- [ ] **Step 1: Write the failing test** — `lib/categories.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { CATEGORIES, categoryLabel } from "./categories";

describe("categories", () => {
  it("gives every category a non-empty blurb", () => {
    expect(CATEGORIES.every((c) => c.blurb.length > 0)).toBe(true);
  });
  it("maps enum values to labels", () => {
    expect(categoryLabel("head_spa")).toBe("Head Spa");
    expect(categoryLabel("beauty")).toBe("Beauty");
    expect(categoryLabel("unknown")).toBe("unknown");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/categories.test.ts`
Expected: FAIL — `categoryLabel` not exported / `blurb` missing.

- [ ] **Step 3: Update `lib/categories.ts`**

Replace the type and array, and append the helper:

```ts
export type Category = {
  slug: string;
  label: string;
  enumValue: string;
  blurb: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "beauty",
    label: "Beauty",
    enumValue: "beauty",
    blurb: "K-beauty routines, serums, and the science of glass skin",
  },
  {
    slug: "hair",
    label: "Hair",
    enumValue: "hair",
    blurb: "Salons, color, and treatments worth the flight",
  },
  {
    slug: "head-spa",
    label: "Head Spa",
    enumValue: "head_spa",
    blurb: "The slow ritual of Korean scalp care",
  },
  {
    slug: "wellness",
    label: "Wellness",
    enumValue: "wellness",
    blurb: "Bathhouses, tea, and the quieter side of Seoul",
  },
  {
    slug: "guides",
    label: "Guides",
    enumValue: "guides",
    blurb: "Neighborhood-by-neighborhood, for first-timers and regulars",
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.enumValue === value)?.label ?? value;
}
```

- [ ] **Step 4: Add hero copy to `lib/site.ts`**

Append:

```ts
export const HERO_KICKER = "Seoul · Beauty & Ritual";
export const HERO_LEDE =
  "An English-language guide to Korean beauty, hair rituals, head spas, and the places worth knowing — for the curious, wherever you are.";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/categories.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/categories.ts lib/categories.test.ts lib/site.ts
git commit -m "$(printf 'feat(lib): category blurbs, categoryLabel, hero copy constants\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 7: Refactor `ArticleCard`

**Files:**

- Modify: `components/editorial/ArticleCard.tsx`
- Modify: `components/editorial/ArticleCard.test.tsx`

**Interfaces:**

- Consumes: `TonalFrame`, `categoryLabel`, `readingTime`, `Post`.
- Produces: unchanged `<ArticleCard post={Post} />` signature.

- [ ] **Step 1: Update the test** — `components/editorial/ArticleCard.test.tsx`

Replace the `describe` block (keep the `post` fixture above it) with:

```tsx
describe("ArticleCard", () => {
  it("links to the article and shows category, title + excerpt", () => {
    render(<ArticleCard post={post} />);
    const link = screen.getByRole("link", { name: /Seoul Head Spa Ritual/ });
    expect(link.getAttribute("href")).toBe("/articles/seoul-head-spa-ritual");
    expect(screen.getByText("Head Spa")).toBeTruthy();
    expect(screen.getByText(/slow world of scalp care/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/ArticleCard.test.tsx`
Expected: FAIL — no "Head Spa" text yet.

- [ ] **Step 3: Rewrite `components/editorial/ArticleCard.tsx`**

```tsx
import Link from "next/link";
import type { Post } from "@/services/types";
import { categoryLabel } from "@/lib/categories";
import { readingTime } from "@/lib/reading-time";
import { TonalFrame } from "./TonalFrame";

export function ArticleCard({ post }: { post: Post }) {
  const minutes = readingTime(post.body);
  return (
    <Link href={`/articles/${post.slug}`} className="group block">
      <TonalFrame
        src={post.featuredImage}
        alt={post.title}
        label={categoryLabel(post.category)}
        ratio="aspect-[3/2]"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div className="mt-4 flex items-center gap-2.5 text-[11px] uppercase tracking-label text-text-muted">
        <span>{categoryLabel(post.category)}</span>
        {minutes && (
          <>
            <span className="h-[3px] w-[3px] rounded-full bg-text/40" />
            <span>{minutes} min</span>
          </>
        )}
      </div>
      <h3 className="mt-2 font-serif text-2xl leading-snug transition-colors duration-medium ease-editorial group-hover:text-accent">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-2 text-sm text-text-muted line-clamp-2">
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/ArticleCard.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/ArticleCard.tsx components/editorial/ArticleCard.test.tsx
git commit -m "$(printf 'feat(editorial): ArticleCard on TonalFrame with category/read-time meta\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 8: Refactor `PlaceCard`

**Files:**

- Modify: `components/editorial/PlaceCard.tsx`
- Modify: `components/editorial/PlaceCard.test.tsx`

**Interfaces:**

- Consumes: `TonalFrame`, `Place`.
- Produces: unchanged `<PlaceCard place={Place} />` signature.

- [ ] **Step 1: Rewrite the test** — `components/editorial/PlaceCard.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceCard } from "./PlaceCard";
import type { Place } from "@/services/types";

const place = {
  id: "1",
  name: "Sool Loft Head Spa",
  slug: "sool-loft-head-spa",
  category: "head_spa",
  area: "Seongsu",
  shortDescription: "A minimalist scalp-care studio.",
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
} as Place;

describe("PlaceCard", () => {
  it("links to the place and shows name, area, description", () => {
    render(<PlaceCard place={place} />);
    const link = screen.getByRole("link", { name: /Sool Loft Head Spa/ });
    expect(link.getAttribute("href")).toBe("/places/sool-loft-head-spa");
    expect(screen.getByText("Seongsu")).toBeTruthy();
    expect(screen.getByText(/minimalist scalp-care studio/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/PlaceCard.test.tsx`
Expected: FAIL — component still uses old markup (may pass name/desc but check runs against new import expectations; if it passes, still proceed to rewrite for consistency). If PASS, continue — Step 3 keeps behavior and the test stays green.

- [ ] **Step 3: Rewrite `components/editorial/PlaceCard.tsx`**

```tsx
import Link from "next/link";
import type { Place } from "@/services/types";
import { TonalFrame } from "./TonalFrame";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <Link href={`/places/${place.slug}`} className="group block">
      <TonalFrame
        src={place.images[0]}
        alt={place.name}
        label={place.area ?? undefined}
        ratio="aspect-[4/5]"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl transition-colors duration-medium ease-editorial group-hover:text-accent">
          {place.name}
        </h3>
        {place.area && (
          <span className="text-[11px] uppercase tracking-label text-accent">
            {place.area}
          </span>
        )}
      </div>
      {place.shortDescription && (
        <p className="mt-2 text-sm text-text-muted line-clamp-2">
          {place.shortDescription}
        </p>
      )}
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/PlaceCard.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/PlaceCard.tsx components/editorial/PlaceCard.test.tsx
git commit -m "$(printf 'feat(editorial): PlaceCard on TonalFrame, area eyebrow\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 9: Refactor `ProductCard`

**Files:**

- Modify: `components/editorial/ProductCard.tsx`
- Modify: `components/editorial/ProductCard.test.tsx`

**Interfaces:**

- Consumes: `TonalFrame`, `Product`.
- Produces: unchanged `<ProductCard product={Product} />` signature. Border/white-box removed; brand as an inline eyebrow label, tabular price, quiet Shop link, affiliate disclosure preserved.

- [ ] **Step 1: Rewrite the test** — `components/editorial/ProductCard.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/services/types";

const product = {
  id: "1",
  name: "Rice Toner",
  brand: "Beauty of Joseon",
  slug: "boj-rice-toner",
  category: "toner",
  description: "A milky, brightening toner.",
  price: "$17",
  image: null,
  affiliateUrl: "https://example.com/buy",
  whereToBuy: null,
  bestFor: "dull skin",
  ingredients: null,
  rating: null,
  disclosureRequired: true,
} as Product;

describe("ProductCard", () => {
  it("shows brand, name, price, and an affiliate shop link", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText("Beauty of Joseon")).toBeTruthy();
    expect(screen.getByText("Rice Toner")).toBeTruthy();
    expect(screen.getByText("$17")).toBeTruthy();
    const shop = screen.getByRole("link", { name: /Shop/ });
    expect(shop.getAttribute("href")).toBe("https://example.com/buy");
  });
  it("shows the affiliate disclosure when required", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText(/affiliate links/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/ProductCard.test.tsx`
Expected: FAIL — `Eyebrow`/`TonalFrame` not yet imported into the component (or assertions on new structure). Proceed regardless.

- [ ] **Step 3: Rewrite `components/editorial/ProductCard.tsx`**

```tsx
import type { Product } from "@/services/types";
import { TonalFrame } from "./TonalFrame";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group">
      <TonalFrame
        src={product.image}
        alt={product.name}
        label={product.category ?? undefined}
        ratio="aspect-square"
        sizes="(max-width: 768px) 50vw, 25vw"
      />
      {product.brand && (
        <p className="mt-3.5 text-[10.5px] uppercase tracking-label text-text-muted">
          {product.brand}
        </p>
      )}
      <h3 className="mt-1 font-serif text-lg leading-tight">{product.name}</h3>
      <div className="mt-2 flex items-center justify-between">
        {product.price && (
          <span className="text-sm tabular-nums">{product.price}</span>
        )}
        {product.affiliateUrl && (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-[11px] uppercase tracking-label text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
          >
            Shop →
          </a>
        )}
      </div>
      {product.disclosureRequired && (
        <p className="mt-2 text-[11px] text-text-muted">
          Contains affiliate links. We may earn a commission.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/ProductCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/ProductCard.tsx components/editorial/ProductCard.test.tsx
git commit -m "$(printf 'feat(editorial): ProductCard on TonalFrame, brand eyebrow, tabular price\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 10: `CategoryIndex` (replace `CategoryCard`)

**Files:**

- Create: `components/editorial/CategoryIndex.tsx`
- Test: `components/editorial/CategoryIndex.test.tsx`
- Delete: `components/editorial/CategoryCard.tsx` (after confirming usage)

**Interfaces:**

- Consumes: `CATEGORIES` (with `blurb`).
- Produces: `<CategoryIndex />` — a hairline-separated list; each row links to `/${slug}`, shows the serif label + blurb, and reveals an "Enter →" affordance on hover.

- [ ] **Step 1: Confirm `CategoryCard` is only used by the home page**

Run: `grep -rn "CategoryCard" app components lib`
Expected: matches only in `app/page.tsx` (import + usage) and `components/editorial/CategoryCard.tsx` itself. If any other file imports it, stop and update those too before deleting.

- [ ] **Step 2: Write the failing test** — `components/editorial/CategoryIndex.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryIndex } from "./CategoryIndex";

describe("CategoryIndex", () => {
  it("renders a linked row per category", () => {
    render(<CategoryIndex />);
    const beauty = screen.getByRole("link", { name: /Beauty/ });
    expect(beauty.getAttribute("href")).toBe("/beauty");
    const headSpa = screen.getByRole("link", { name: /Head Spa/ });
    expect(headSpa.getAttribute("href")).toBe("/head-spa");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/editorial/CategoryIndex.test.tsx`
Expected: FAIL — cannot import `CategoryIndex`.

- [ ] **Step 4: Write `components/editorial/CategoryIndex.tsx`**

```tsx
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function CategoryIndex() {
  return (
    <div className="border-t border-soft-gray">
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/${c.slug}`}
          className="group grid grid-cols-[1fr_auto] items-baseline gap-6 border-b border-soft-gray py-6 transition-[padding] duration-medium ease-editorial hover:pl-4 md:grid-cols-[auto_1fr_auto]"
        >
          <span className="font-serif text-3xl leading-none transition-colors duration-medium ease-editorial group-hover:text-accent md:text-4xl">
            {c.label}
          </span>
          <span className="hidden text-sm text-text-muted md:block">
            {c.blurb}
          </span>
          <span className="translate-x-[-8px] text-[11px] uppercase tracking-label text-text-muted opacity-0 transition-all duration-medium ease-editorial group-hover:translate-x-0 group-hover:opacity-100">
            Enter →
          </span>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/editorial/CategoryIndex.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Delete `CategoryCard` and remove its import**

Delete the file and drop its `import` line from `app/page.tsx` (the category grid is replaced in Task 16; removing the import now would break the build, so DEFER the import removal — instead, temporarily keep `app/page.tsx` untouched and delete the component only after Task 16). To keep this task self-contained and the build green, **do not delete yet** — mark the deletion as part of Task 16. Skip file deletion here.

Run: `npx vitest run` (full suite)
Expected: PASS (all tests so far).

- [ ] **Step 7: Commit**

```bash
git add components/editorial/CategoryIndex.tsx components/editorial/CategoryIndex.test.tsx
git commit -m "$(printf 'feat(editorial): CategoryIndex Monocle-style labeled list\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 11: `FeaturedStory` component

**Files:**

- Create: `components/editorial/FeaturedStory.tsx`
- Test: `components/editorial/FeaturedStory.test.tsx`

**Interfaces:**

- Consumes: `TonalFrame`, `categoryLabel`, `readingTime`, `Post`.
- Produces: `<FeaturedStory post={Post} />` — asymmetric two-column cover unit; portrait frame + tag/read-time/serif headline/excerpt/quiet read link to `/articles/${slug}`.

- [ ] **Step 1: Write the failing test** — `components/editorial/FeaturedStory.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedStory } from "./FeaturedStory";
import type { Post } from "@/services/types";

const post = {
  id: "1",
  title: "The Seoul Head Spa Ritual",
  slug: "seoul-head-spa-ritual",
  subtitle: null,
  excerpt: "Inside the slow world of scalp care.",
  body: null,
  category: "head_spa",
  tags: [],
  featuredImage: null,
  author: "Team",
  seoTitle: null,
  metaDescription: null,
  publishedAt: "2026-01-01T00:00:00Z",
} as Post;

describe("FeaturedStory", () => {
  it("shows the category tag, title, excerpt, and a read link", () => {
    render(<FeaturedStory post={post} />);
    expect(screen.getByText("Head Spa")).toBeTruthy();
    expect(screen.getByText(/Seoul Head Spa Ritual/)).toBeTruthy();
    const read = screen.getByRole("link", { name: /Read the story/ });
    expect(read.getAttribute("href")).toBe("/articles/seoul-head-spa-ritual");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/FeaturedStory.test.tsx`
Expected: FAIL — cannot import `FeaturedStory`.

- [ ] **Step 3: Write `components/editorial/FeaturedStory.tsx`**

```tsx
import Link from "next/link";
import type { Post } from "@/services/types";
import { categoryLabel } from "@/lib/categories";
import { readingTime } from "@/lib/reading-time";
import { TonalFrame } from "./TonalFrame";

export function FeaturedStory({ post }: { post: Post }) {
  const minutes = readingTime(post.body);
  return (
    <article className="group grid items-center gap-8 md:grid-cols-[1.15fr_1fr] md:gap-16">
      <Link
        href={`/articles/${post.slug}`}
        className="block"
        aria-hidden
        tabIndex={-1}
      >
        <TonalFrame
          src={post.featuredImage}
          alt={post.title}
          label={categoryLabel(post.category)}
          ratio="aspect-[5/6]"
          sizes="(max-width: 768px) 100vw, 55vw"
          priority
        />
      </Link>
      <div>
        <div className="mb-4 flex items-center gap-3.5">
          <span className="rounded-full border border-soft-gray px-3 py-1.5 text-[11px] uppercase tracking-label">
            {categoryLabel(post.category)}
          </span>
          {minutes && (
            <span className="text-[11px] uppercase tracking-label text-text-muted">
              {minutes} min read
            </span>
          )}
        </div>
        <h3 className="font-serif text-4xl leading-[1.06] tracking-tight md:text-5xl">
          <Link
            href={`/articles/${post.slug}`}
            className="transition-colors duration-medium ease-editorial group-hover:text-accent"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="mt-4 max-w-[42ch] text-base text-text-muted">
            {post.excerpt}
          </p>
        )}
        <Link
          href={`/articles/${post.slug}`}
          className="mt-6 inline-block border-b border-transparent pb-1 text-[12.5px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
        >
          Read the story →
        </Link>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/FeaturedStory.test.tsx`
Expected: PASS (1 test). Note: multiple links share the slug href; the test queries by accessible name so it is unambiguous.

- [ ] **Step 5: Commit**

```bash
git add components/editorial/FeaturedStory.tsx components/editorial/FeaturedStory.test.tsx
git commit -m "$(printf 'feat(editorial): FeaturedStory asymmetric cover unit\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 12: Masthead `Hero`

**Files:**

- Modify: `components/editorial/Hero.tsx`

**Interfaces:**

- Consumes: `HERO_KICKER`, `HERO_LEDE` from `lib/site`; `Eyebrow`.
- Produces: unchanged `<Hero />` (no props). Quiet centered masthead: kicker, large serif statement with one italic accent phrase, lede, one pill CTA + one quiet link, scroll cue.

- [ ] **Step 1: Rewrite `components/editorial/Hero.tsx`**

```tsx
import Link from "next/link";
import { HERO_KICKER, HERO_LEDE } from "@/lib/site";
import { Eyebrow } from "./Eyebrow";

export function Hero() {
  return (
    <section className="mx-auto max-w-content px-6 py-24 text-center md:py-36">
      <Eyebrow className="mb-7">{HERO_KICKER}</Eyebrow>
      <h1 className="mx-auto max-w-[15ch] text-balance font-serif text-5xl leading-[1.02] tracking-tight md:text-7xl">
        The city, distilled — <em className="italic text-accent">a drop</em> of
        Seoul at a time.
      </h1>
      <p className="mx-auto mt-8 max-w-[46ch] text-lg leading-relaxed text-text-muted">
        {HERO_LEDE}
      </p>
      <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/articles"
          className="rounded-full border border-text px-7 py-3.5 text-[12.5px] uppercase tracking-label transition-colors duration-medium ease-editorial hover:bg-text hover:text-bg"
        >
          Explore Guides
        </Link>
        <Link
          href="/places"
          className="border-b border-transparent pb-1 text-[12.5px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
        >
          The Seoul Directory →
        </Link>
      </div>
      <p className="mt-16 text-[11px] uppercase tracking-label text-text-muted/60">
        Scroll ↓
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck + existing tests**

Run: `npm run typecheck && npx vitest run`
Expected: typecheck exits 0; all tests pass (Hero has no test; nothing references removed `TAGLINE`/`SITE_NAME` from Hero).

- [ ] **Step 3: Commit**

```bash
git add components/editorial/Hero.tsx
git commit -m "$(printf 'feat(editorial): quiet masthead hero\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 13: `SiteHeader` + mobile menu

**Files:**

- Modify: `components/editorial/SiteHeader.tsx`
- Modify: `components/editorial/SiteHeader.test.tsx`

**Interfaces:**

- Consumes: `NAV_ITEMS`, `SITE_NAME`.
- Produces: unchanged `<SiteHeader />`. Now a client component. Desktop nav (`aria-label="Primary"`) stays; a mobile toggle button (`aria-expanded`) opens a `<nav aria-label="Mobile">` panel rendered only when open.

- [ ] **Step 1: Update the test** — `components/editorial/SiteHeader.test.tsx`

Replace the whole file:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("renders the wordmark linking home", () => {
    render(<SiteHeader />);
    const home = screen.getByRole("link", { name: "A Drop of Seoul" });
    expect(home.getAttribute("href")).toBe("/");
  });
  it("renders every primary nav link", () => {
    render(<SiteHeader />);
    for (const label of [
      "Beauty",
      "Hair",
      "Places",
      "Head Spa",
      "Guides",
      "Picks",
      "About",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }
  });
  it("toggles the mobile menu panel", () => {
    render(<SiteHeader />);
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBe(null);
    const button = screen.getByRole("button", { name: /menu/i });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeTruthy();
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });
});
```

Note: when the mobile menu is open, nav labels appear twice; the "every primary nav link" test runs on the default (closed) render, so links remain unique there.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/SiteHeader.test.tsx`
Expected: FAIL — no menu button / mobile nav yet.

- [ ] **Step 3: Rewrite `components/editorial/SiteHeader.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => i.label !== "Home");

  return (
    <header className="sticky top-0 z-40 border-b border-soft-gray bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="mx-auto flex h-[66px] max-w-content items-center justify-between px-6">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="hidden gap-7 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-xs uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-medium after:ease-editorial hover:text-text hover:after:scale-x-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="text-xs uppercase tracking-label text-text-muted md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav
          aria-label="Mobile"
          className="border-t border-soft-gray px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-2 font-serif text-xl transition-colors duration-medium ease-editorial hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/SiteHeader.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/SiteHeader.tsx components/editorial/SiteHeader.test.tsx
git commit -m "$(printf 'feat(editorial): SiteHeader breathing room + mobile menu\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 14: `SiteFooter`

**Files:**

- Modify: `components/editorial/SiteFooter.tsx`
- Test: `components/editorial/SiteFooter.test.tsx` (create)

**Interfaces:**

- Consumes: `SITE_NAME`, `TAGLINE`.
- Produces: unchanged `<SiteFooter />`. Multi-column editorial footer with two curated link columns + a base row.

- [ ] **Step 1: Write the failing test** — `components/editorial/SiteFooter.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("renders the wordmark linking home", () => {
    render(<SiteFooter />);
    const home = screen.getByRole("link", { name: "A Drop of Seoul" });
    expect(home.getAttribute("href")).toBe("/");
  });
  it("renders curated column links and copyright", () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole("link", { name: "Beauty" }).getAttribute("href")
    ).toBe("/beauty");
    expect(
      screen.getByRole("link", { name: "Places" }).getAttribute("href")
    ).toBe("/places");
    expect(screen.getByText(/All rights reserved/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editorial/SiteFooter.test.tsx`
Expected: FAIL — wordmark is not currently a link to `/`.

- [ ] **Step 3: Rewrite `components/editorial/SiteFooter.tsx`**

```tsx
import Link from "next/link";
import { SITE_NAME, TAGLINE } from "@/lib/site";

const EXPLORE = [
  { label: "Beauty", href: "/beauty" },
  { label: "Hair", href: "/hair" },
  { label: "Head Spa", href: "/head-spa" },
  { label: "Wellness", href: "/wellness" },
  { label: "Guides", href: "/guides" },
];

const GUIDE = [
  { label: "Places", href: "/places" },
  { label: "Picks", href: "/picks" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-soft-gray bg-porcelain">
      <div className="mx-auto max-w-content px-6">
        <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-serif text-2xl">
              {SITE_NAME}
            </Link>
            <p className="mt-3.5 max-w-[34ch] text-sm text-text-muted">
              {TAGLINE}
            </p>
          </div>
          <FooterColumn title="Explore" items={EXPLORE} />
          <FooterColumn title="The Guide" items={GUIDE} />
        </div>
        <div className="flex flex-wrap justify-between gap-2.5 border-t border-soft-gray py-6 text-xs text-text-muted">
          <span>© {SITE_NAME}. All rights reserved.</span>
          <span>Seoul · Worldwide</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-label text-text-muted">
        {title}
      </h4>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editorial/SiteFooter.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/editorial/SiteFooter.tsx components/editorial/SiteFooter.test.tsx
git commit -m "$(printf 'feat(editorial): multi-column editorial SiteFooter\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 15: Restyle `NewsletterForm`

**Files:**

- Modify: `components/editorial/NewsletterForm.tsx`

**Interfaces:**

- Consumes: existing `subscribeToNewsletter` server action + `useFormState`/`useFormStatus` (unchanged wiring).
- Produces: unchanged `<NewsletterForm />`. Underline-style inline input + quiet Subscribe button; status message logic preserved.

- [ ] **Step 1: Rewrite the markup in `components/editorial/NewsletterForm.tsx`**

Keep the `"use client"`, imports, `initial`, `useFormState`/`useFormStatus` exactly as they are. Replace only the two returned JSX trees:

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-[12px] uppercase tracking-label text-text transition-colors duration-medium ease-editorial hover:text-accent disabled:opacity-60"
    >
      {pending ? "Subscribing…" : "Subscribe"}
    </button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useFormState(subscribeToNewsletter, initial);
  return (
    <form action={formAction} className="mx-auto mt-9 max-w-[460px]">
      <div className="flex items-center gap-3 border-b border-text pb-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full bg-transparent px-0.5 py-1.5 text-[15px] outline-none placeholder:text-text-muted/60"
        />
        <SubmitButton />
      </div>
      {state.message && (
        <p
          role="status"
          className={`mt-3 text-sm ${state.ok ? "text-accent" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Verify typecheck + full suite**

Run: `npm run typecheck && npx vitest run`
Expected: typecheck exits 0; all existing tests pass (form wiring unchanged).

- [ ] **Step 3: Commit**

```bash
git add components/editorial/NewsletterForm.tsx
git commit -m "$(printf 'feat(editorial): underline-style NewsletterForm\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 16: Reassemble the home page + final verification

**Files:**

- Modify: `app/page.tsx`
- Delete: `components/editorial/CategoryCard.tsx`

**Interfaces:**

- Consumes: `Hero`, `FeaturedStory`, `SectionHeading`, `CategoryIndex`, `ArticleCard`, `PlaceCard`, `ProductCard`, `NewsletterForm`, `Reveal`, `Eyebrow`; the existing `listPublishedPosts`/`listPlaces`/`listProducts` services (unchanged).

- [ ] **Step 1: Rewrite `app/page.tsx`**

```tsx
import { listPublishedPosts } from "@/services/posts";
import { listPlaces } from "@/services/places";
import { listProducts } from "@/services/products";
import { Hero } from "@/components/editorial/Hero";
import { FeaturedStory } from "@/components/editorial/FeaturedStory";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { CategoryIndex } from "@/components/editorial/CategoryIndex";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import { ProductCard } from "@/components/editorial/ProductCard";
import { NewsletterForm } from "@/components/editorial/NewsletterForm";
import { Reveal } from "@/components/editorial/Reveal";
import { Eyebrow } from "@/components/editorial/Eyebrow";

export default async function HomePage() {
  const [posts, places, products] = await Promise.all([
    listPublishedPosts({ limit: 7 }),
    listPlaces({ limit: 3 }),
    listProducts({ limit: 4 }),
  ]);
  const [featured, ...latest] = posts;

  return (
    <main>
      <Hero />

      {featured && (
        <Reveal>
          <section className="mx-auto max-w-content px-6 py-14 md:py-24">
            <SectionHeading title="Featured Story" eyebrow="This Week" />
            <FeaturedStory post={featured} />
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className="mx-auto max-w-content px-6 py-14 md:py-24">
          <SectionHeading
            title="Find your way in"
            eyebrow="Explore"
            href="/articles"
          />
          <CategoryIndex />
        </section>
      </Reveal>

      {latest.length > 0 && (
        <Reveal>
          <section className="mx-auto max-w-content px-6 py-14 md:py-24">
            <SectionHeading
              title="Latest Stories"
              eyebrow="Journal"
              href="/articles"
            />
            <div className="grid gap-8 md:grid-cols-3">
              {latest.map((p) => (
                <ArticleCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {places.length > 0 && (
        <Reveal>
          <section className="bg-porcelain/60">
            <div className="mx-auto max-w-content px-6 py-14 md:py-24">
              <SectionHeading
                title="The Seoul Directory"
                eyebrow="On the map"
                href="/places"
              />
              <p className="-mt-2 mb-10 max-w-[52ch] text-text-muted">
                Places worth knowing — vetted studios, salons, and spaces with
                English-speaking staff and a calm room.
              </p>
              <div className="grid gap-8 md:grid-cols-3">
                {places.map((pl) => (
                  <PlaceCard key={pl.id} place={pl} />
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {products.length > 0 && (
        <Reveal>
          <section className="mx-auto max-w-content px-6 py-14 md:py-24">
            <SectionHeading
              title="Weekly Picks"
              eyebrow="The Shelf"
              href="/picks"
            />
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {products.map((pr) => (
                <ProductCard key={pr.id} product={pr} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      <section className="mt-10 border-t border-soft-gray">
        <div className="mx-auto max-w-content px-6 py-20 text-center md:py-28">
          <Eyebrow className="mb-5">The List</Eyebrow>
          <h2 className="font-serif text-4xl leading-tight md:text-5xl">
            Seoul, <em className="italic text-accent">a drop</em> at a time.
          </h2>
          <p className="mx-auto mt-4 max-w-[40ch] text-text-muted">
            New stories, places, and picks — a few considered emails a month. No
            noise.
          </p>
          <NewsletterForm />
          <p className="mt-5 text-[11px] text-text-muted/60">
            Join readers in 40+ countries. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Delete the obsolete `CategoryCard`**

Run: `git rm components/editorial/CategoryCard.tsx`
Then confirm nothing else imports it:
Run: `grep -rn "CategoryCard" app components lib`
Expected: no matches.

- [ ] **Step 3: Full verification**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: all four exit 0. `next build` completes with the home route rendered.

- [ ] **Step 4: Manual visual check (dev server)**

Run: `npm run dev` and open `http://localhost:3000`.
Expected: quiet masthead → featured cover → category index (hover reveals "Enter →") → latest grid → porcelain directory band → picks strip → newsletter band → multi-column footer. Tonal placeholders show where images are absent. Resize below `md`: nav collapses to a working Menu toggle. Then stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "$(printf 'feat(home): reassemble editorial homepage + retire CategoryCard\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Self-Review

**Spec coverage:**

- Design tokens / porcelain / motion / reduced-motion → Task 1. ✓
- Tonal placeholder strategy → Task 4 (`TonalFrame`), consumed by all cards + featured. ✓
- Eyebrow label signature → Task 3, used across cards/sections. ✓
- Masthead hero → Task 12. ✓
- Featured cover unit → Task 11. ✓
- Monocle category index (replacing cards) → Task 10 + Task 16 deletion. ✓
- Latest editorial grid → Task 16 (uses Task 7 `ArticleCard`). ✓
- Seoul Directory porcelain band → Task 16 (uses Task 8 `PlaceCard`). ✓
- Weekly Picks strip → Task 16 (uses Task 9 `ProductCard`). ✓
- Quiet newsletter band → Task 16 + Task 15 restyle. ✓
- SiteHeader + mobile menu → Task 13. ✓
- Multi-column footer → Task 14. ✓
- Card unification → Tasks 7–9. ✓
- Reading-time meta → Task 2. ✓
- Testing (existing tests green + new units) → each task; final gate Task 16. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to"—every code step contains full source. ✓

**Type consistency:** `readingTime(body)`, `categoryLabel(value)`, `Eyebrow{tone}`, `TonalFrame{src,alt,label,ratio,sizes,priority}` are referenced identically in every consuming task. Card/component signatures are unchanged from current usage in `app/page.tsx`. ✓

**Note on `Eyebrow` usage:** Cards render their own inline meta rows (spans with a dot separator) rather than composing `Eyebrow`, because those rows need inline layout; `Eyebrow` (a `<p>`) is used for section kickers and standalone labels. This is intentional and consistent across Tasks 7–11.
