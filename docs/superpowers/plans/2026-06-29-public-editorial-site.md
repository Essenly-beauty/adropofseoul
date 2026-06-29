# A Drop of Seoul — Public Editorial Site Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public-facing editorial site — site chrome, home page, article listing/detail, category pages, places directory/detail, picks, static pages, newsletter capture, and the full SEO suite — all reading through the Plan 1 `services/` layer.

**Architecture:** Server Components fetch through `services/*` (never Supabase directly). Pure helpers (`lib/categories.ts`, `lib/seo.ts`, `lib/validation.ts`) are unit-tested; presentational components are tested with Testing Library against fixture props; pages compose them. Markdown article bodies render through a sanitized `react-markdown` pipeline. SEO uses Next's Metadata API + JSON-LD script tags. Live-data render verification is deferred to after Supabase provisioning (Plan 1's checkpoint); `next build` succeeds without a live DB because all content routes are dynamic (they read cookies via the server Supabase client).

**Tech Stack:** Next.js 14 App Router · TypeScript · Tailwind (+ `@tailwindcss/typography`) · `react-markdown` + `remark-gfm` + `rehype-sanitize` · Vitest + Testing Library. Builds on Plan 1 (foundation, services, auth).

## Global Constraints

- **Data access:** every read goes through `services/*` (`listPublishedPosts`, `getPostBySlug`, `listPlaces`, `getPlaceBySlug`, `listProducts`, `getProductBySlug`). Components/pages never import Supabase clients for reads. The one write is the newsletter insert.
- **Built service signatures (consume verbatim):**
  - `listPublishedPosts(opts?: { limit?: number; category?: string }): Promise<Post[]>`
  - `getPostBySlug(slug: string): Promise<Post | null>`
  - `listPlaces(opts?: { limit?: number; category?: string }): Promise<Place[]>`
  - `getPlaceBySlug(slug: string): Promise<Place | null>`
  - `listProducts(opts?: { limit?: number }): Promise<Product[]>`
  - `getProductBySlug(slug: string): Promise<Product | null>`
  - Domain types `Post`, `Place`, `Product` in `services/types.ts` (camelCase; see Plan 1). `Post.category` holds the enum value (`beauty|hair|head_spa|places|wellness|products|guides`).
- **Primary nav (exact order/labels):** Home · Beauty · Hair · Places · Head Spa · Guides · Picks · About. No site Search (P2-of-MVP → deferred).
- **Brand tokens (already in tailwind):** `bg` `#FAF8F4`, `text`/`text-muted`, `accent`/`accent-hover` `#B78B62`, `soft-gray` `#E8E2DA`, `muted-pink` `#E9D6CF`. Headings `font-serif` (Cormorant Garamond); body `font-sans` (Inter).
- **Nullable fields render conditionally** (ENG-R5): hide map/booking/affiliate buttons when the URL is null; hide images when absent.
- **404 on missing content** (ENG-R4): unknown/unpublished slugs in detail routes call `notFound()`.
- **Bounded queries** (ENG-R1): always pass an explicit `limit` to list calls in pages.
- **Affiliate disclosure** (spec §12): product cards/detail show a disclosure note when `disclosureRequired` is true.
- **SEO:** dynamic per-route metadata, Open Graph, canonical URLs (base `NEXT_PUBLIC_SITE_URL`), `robots.ts`, dynamic `sitemap.ts`, JSON-LD Article (posts) + LocalBusiness (places), breadcrumbs.
- **Env:** `NEXT_PUBLIC_SITE_URL` (already in `.env.example`) is the canonical/OG base; default to `http://localhost:3000` when unset.
- **Commit trailer:** end every commit message with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **All commands run from** `/Users/jj_whatap/up/adropofseoul`.

---

## File Structure

```
app/
  layout.tsx                 # MODIFY: wrap children in SiteHeader + SiteFooter
  page.tsx                   # REPLACE: real home page
  globals.css                # (unchanged)
  robots.ts                  # NEW
  sitemap.ts                 # NEW
  not-found.tsx              # NEW: branded 404
  articles/
    page.tsx                 # listing
    [slug]/page.tsx          # detail + JSON-LD Article
  [category]/page.tsx        # beauty | hair | head-spa | wellness | guides
  places/
    page.tsx                 # directory
    [slug]/page.tsx          # detail + JSON-LD LocalBusiness
  picks/page.tsx             # products
  about/page.tsx
  contact/page.tsx
  privacy/page.tsx
  actions/newsletter.ts      # newsletter server action
components/editorial/
  SiteHeader.tsx  SiteHeader.test.tsx
  SiteFooter.tsx
  Hero.tsx
  SectionHeading.tsx
  ArticleCard.tsx  ArticleCard.test.tsx
  PlaceCard.tsx    PlaceCard.test.tsx
  ProductCard.tsx  ProductCard.test.tsx
  CategoryCard.tsx
  NewsletterForm.tsx
  Prose.tsx                  # sanitized markdown renderer
  Prose.test.tsx
  JsonLd.tsx                 # <script type="application/ld+json">
lib/
  nav.ts        nav.test.ts        # NAV_ITEMS + category config
  categories.ts categories.test.ts # route-slug <-> enum mapping
  seo.ts        seo.test.ts        # buildMetadata + JSON-LD builders
  validation.ts validation.test.ts # isValidEmail
  site.ts                          # SITE_URL, SITE_NAME, TAGLINE constants
```

---

### Task 1: Navigation config + site chrome (header/footer) + root layout

**Files:**

- Create: `lib/site.ts`, `lib/nav.ts`, `lib/nav.test.ts`, `components/editorial/SiteHeader.tsx`, `components/editorial/SiteHeader.test.tsx`, `components/editorial/SiteFooter.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**

- Produces:
  - `SITE_URL: string`, `SITE_NAME = "A Drop of Seoul"`, `TAGLINE: string` — `lib/site.ts`
  - `NAV_ITEMS: { label: string; href: string }[]` — `lib/nav.ts`
  - `<SiteHeader />`, `<SiteFooter />` — components
- Consumes: nothing from later tasks.

- [ ] **Step 1: Create `lib/site.ts`**

```ts
export const SITE_NAME = "A Drop of Seoul";
export const TAGLINE =
  "A curated guide to Korean beauty, hair rituals, head spas, and places worth knowing.";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
```

- [ ] **Step 2: Write the failing test `lib/nav.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "./nav";

describe("NAV_ITEMS", () => {
  it("lists the primary nav in exact order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Beauty",
      "Hair",
      "Places",
      "Head Spa",
      "Guides",
      "Picks",
      "About",
    ]);
  });
  it("maps Head Spa to the /head-spa route and Places to the directory", () => {
    expect(NAV_ITEMS.find((i) => i.label === "Head Spa")?.href).toBe(
      "/head-spa"
    );
    expect(NAV_ITEMS.find((i) => i.label === "Places")?.href).toBe("/places");
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm run test -- nav`
Expected: FAIL — `./nav` not found.

- [ ] **Step 4: Implement `lib/nav.ts`**

```ts
export type NavItem = { label: string; href: string };

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Beauty", href: "/beauty" },
  { label: "Hair", href: "/hair" },
  { label: "Places", href: "/places" },
  { label: "Head Spa", href: "/head-spa" },
  { label: "Guides", href: "/guides" },
  { label: "Picks", href: "/picks" },
  { label: "About", href: "/about" },
];
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `npm run test -- nav`
Expected: PASS (2 tests).

- [ ] **Step 6: Write the failing test `components/editorial/SiteHeader.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
```

- [ ] **Step 7: Run it to confirm it fails**

Run: `npm run test -- SiteHeader`
Expected: FAIL — `./SiteHeader` not found.

- [ ] **Step 8: Implement `components/editorial/SiteHeader.tsx`**

```tsx
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-soft-gray bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60 sticky top-0 z-40">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="hidden gap-6 md:flex">
          {NAV_ITEMS.filter((i) => i.label !== "Home").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 9: Run it to confirm it passes**

Run: `npm run test -- SiteHeader`
Expected: PASS (2 tests).

- [ ] **Step 10: Implement `components/editorial/SiteFooter.tsx`**

```tsx
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { SITE_NAME, TAGLINE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-soft-gray">
      <div className="mx-auto max-w-content px-6 py-12">
        <p className="font-serif text-xl">{SITE_NAME}</p>
        <p className="mt-2 max-w-md text-sm text-text-muted">{TAGLINE}</p>
        <nav
          aria-label="Footer"
          className="mt-6 flex flex-wrap gap-x-6 gap-y-2"
        >
          {NAV_ITEMS.filter((i) => i.label !== "Home").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-text-muted hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 text-xs text-text-muted">
          © {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 11: Modify `app/layout.tsx` to wrap children in chrome**

Change the `<body>` contents from `{children}` to the chrome wrapper. The new `<body>`:

```tsx
<body className="font-sans antialiased">
  <SiteHeader />
  <div className="min-h-screen">{children}</div>
  <SiteFooter />
</body>
```

Add imports at the top of the file:

```tsx
import { SiteHeader } from "@/components/editorial/SiteHeader";
import { SiteFooter } from "@/components/editorial/SiteFooter";
```

- [ ] **Step 12: Verify, run suite, commit**

Run: `npm run test && npm run typecheck && npm run build`
Expected: all pass; existing 16 tests + nav (2) + SiteHeader (2) = 20.

```bash
git add lib/site.ts lib/nav.ts lib/nav.test.ts components/editorial/SiteHeader.tsx components/editorial/SiteHeader.test.tsx components/editorial/SiteFooter.tsx app/layout.tsx
git commit -m "feat(public): site chrome — header, footer, nav config

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Category mapping + SEO/JSON-LD helpers (pure, TDD)

**Files:**

- Create: `lib/categories.ts`, `lib/categories.test.ts`, `lib/seo.ts`, `lib/seo.test.ts`, `components/editorial/JsonLd.tsx`

**Interfaces:**

- Consumes: `SITE_URL`, `SITE_NAME` from `@/lib/site`; `Post`, `Place` types.
- Produces:
  - `CATEGORIES: { slug: string; label: string; enumValue: string }[]`, `getCategoryBySlug(slug: string): Category | undefined`, `CATEGORY_SLUGS: string[]` — `lib/categories.ts`
  - `canonical(path: string): string`, `articleJsonLd(post: Post): object`, `localBusinessJsonLd(place: Place): object`, `breadcrumbJsonLd(crumbs: {name:string;path:string}[]): object` — `lib/seo.ts`
  - `<JsonLd data={...} />` — component

- [ ] **Step 1: Write `lib/categories.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { getCategoryBySlug, CATEGORY_SLUGS } from "./categories";

describe("categories", () => {
  it("maps the head-spa route slug to the head_spa enum", () => {
    expect(getCategoryBySlug("head-spa")?.enumValue).toBe("head_spa");
  });
  it("maps beauty to itself", () => {
    expect(getCategoryBySlug("beauty")?.enumValue).toBe("beauty");
  });
  it("returns undefined for an unknown slug", () => {
    expect(getCategoryBySlug("nope")).toBeUndefined();
  });
  it("exposes the editorial category slugs (no places/picks)", () => {
    expect(CATEGORY_SLUGS).toEqual([
      "beauty",
      "hair",
      "head-spa",
      "wellness",
      "guides",
    ]);
  });
});
```

- [ ] **Step 2: Run it → FAIL** (`npm run test -- categories`).

- [ ] **Step 3: Implement `lib/categories.ts`**

```ts
export type Category = { slug: string; label: string; enumValue: string };

export const CATEGORIES: Category[] = [
  { slug: "beauty", label: "Beauty", enumValue: "beauty" },
  { slug: "hair", label: "Hair", enumValue: "hair" },
  { slug: "head-spa", label: "Head Spa", enumValue: "head_spa" },
  { slug: "wellness", label: "Wellness", enumValue: "wellness" },
  { slug: "guides", label: "Guides", enumValue: "guides" },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
```

- [ ] **Step 4: Run it → PASS** (4 tests).

- [ ] **Step 5: Write `lib/seo.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  canonical,
  articleJsonLd,
  localBusinessJsonLd,
  breadcrumbJsonLd,
} from "./seo";
import type { Post, Place } from "@/services/types";

const post = {
  title: "Hello",
  slug: "hello",
  excerpt: "x",
  body: "## hi",
  author: "Team",
  publishedAt: "2026-01-01T00:00:00Z",
} as Post;

const place = {
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
  shortDescription: "x",
  address: null,
} as unknown as Place;

describe("canonical", () => {
  it("joins a clean path onto the site base", () => {
    expect(canonical("/articles/hello")).toMatch(/\/articles\/hello$/);
  });
});

describe("articleJsonLd", () => {
  it("builds an Article schema with headline + datePublished", () => {
    const ld = articleJsonLd(post) as Record<string, unknown>;
    expect(ld["@type"]).toBe("Article");
    expect(ld.headline).toBe("Hello");
    expect(ld.datePublished).toBe("2026-01-01T00:00:00Z");
  });
});

describe("localBusinessJsonLd", () => {
  it("builds a LocalBusiness schema with the place name", () => {
    const ld = localBusinessJsonLd(place) as Record<string, unknown>;
    expect(ld["@type"]).toBe("LocalBusiness");
    expect(ld.name).toBe("Sool Loft");
  });
});

describe("breadcrumbJsonLd", () => {
  it("builds an ordered BreadcrumbList", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Articles", path: "/articles" },
    ]) as Record<string, unknown>;
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect((ld.itemListElement as unknown[]).length).toBe(2);
  });
});
```

- [ ] **Step 6: Run it → FAIL** (`npm run test -- seo`).

- [ ] **Step 7: Implement `lib/seo.ts`**

```ts
import { SITE_URL, SITE_NAME } from "@/lib/site";
import type { Post, Place } from "@/services/types";

export function canonical(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function articleJsonLd(post: Post): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    image: post.featuredImage ?? undefined,
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: canonical(`/articles/${post.slug}`),
  };
}

export function localBusinessJsonLd(place: Place): object {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    description: place.shortDescription ?? undefined,
    address: place.area ?? undefined,
    url: canonical(`/places/${place.slug}`),
  };
}

export function breadcrumbJsonLd(
  crumbs: { name: string; path: string }[]
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: canonical(c.path),
    })),
  };
}
```

- [ ] **Step 8: Run it → PASS** (4 tests).

- [ ] **Step 9: Implement `components/editorial/JsonLd.tsx`**

```tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 10: Run suite + commit**

Run: `npm run test && npm run typecheck`
Expected: pass; +8 tests (categories 4, seo 4).

```bash
git add lib/categories.ts lib/categories.test.ts lib/seo.ts lib/seo.test.ts components/editorial/JsonLd.tsx
git commit -m "feat(public): category mapping + SEO/JSON-LD helpers (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Editorial card components + SectionHeading + Hero

**Files:**

- Create: `components/editorial/SectionHeading.tsx`, `components/editorial/Hero.tsx`, `components/editorial/CategoryCard.tsx`, `components/editorial/ArticleCard.tsx`, `components/editorial/ArticleCard.test.tsx`, `components/editorial/PlaceCard.tsx`, `components/editorial/PlaceCard.test.tsx`, `components/editorial/ProductCard.tsx`, `components/editorial/ProductCard.test.tsx`

**Interfaces:**

- Consumes: `Post`, `Place`, `Product` types; `next/image`, `next/link`.
- Produces: `<SectionHeading title eyebrow? href? />`, `<Hero />`, `<CategoryCard category />`, `<ArticleCard post />`, `<PlaceCard place />`, `<ProductCard product />`.

- [ ] **Step 1: Implement `components/editorial/SectionHeading.tsx`**

```tsx
import Link from "next/link";

export function SectionHeading({
  title,
  eyebrow,
  href,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="text-sm text-text-muted hover:text-accent">
          View all →
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/editorial/Hero.tsx`**

```tsx
import Link from "next/link";
import { SITE_NAME, TAGLINE } from "@/lib/site";

export function Hero() {
  return (
    <section className="mx-auto max-w-content px-6 py-20 text-center">
      <h1 className="font-serif text-5xl md:text-7xl">{SITE_NAME}</h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-text-muted">{TAGLINE}</p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/articles"
          className="rounded-md bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover"
        >
          Explore Guides
        </Link>
        <Link
          href="/places"
          className="rounded-md border border-soft-gray px-5 py-2.5 text-sm hover:border-accent"
        >
          Explore Seoul
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Implement `components/editorial/CategoryCard.tsx`**

```tsx
import Link from "next/link";
import type { Category } from "@/lib/categories";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/${category.slug}`}
      className="block rounded-lg border border-soft-gray bg-white p-6 transition-colors hover:border-accent"
    >
      <span className="font-serif text-2xl">{category.label}</span>
    </Link>
  );
}
```

- [ ] **Step 4: Write `components/editorial/ArticleCard.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleCard } from "./ArticleCard";
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

describe("ArticleCard", () => {
  it("links to the article and shows title + excerpt", () => {
    render(<ArticleCard post={post} />);
    const link = screen.getByRole("link", { name: /Seoul Head Spa Ritual/ });
    expect(link.getAttribute("href")).toBe("/articles/seoul-head-spa-ritual");
    expect(screen.getByText(/slow world of scalp care/)).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run it → FAIL** (`npm run test -- ArticleCard`).

- [ ] **Step 6: Implement `components/editorial/ArticleCard.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/services/types";

export function ArticleCard({ post }: { post: Post }) {
  return (
    <Link href={`/articles/${post.slug}`} className="group block">
      {post.featuredImage && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-soft-gray">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-medium group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <h3 className="mt-4 font-serif text-xl group-hover:text-accent">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-1 text-sm text-text-muted line-clamp-2">
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}
```

- [ ] **Step 7: Run it → PASS.**

- [ ] **Step 8: Write `components/editorial/PlaceCard.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceCard } from "./PlaceCard";
import type { Place } from "@/services/types";

const place = {
  id: "1",
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: "Seongsu",
  shortDescription: "A minimalist scalp studio.",
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
  it("links to the place and shows name + area", () => {
    render(<PlaceCard place={place} />);
    const link = screen.getByRole("link", { name: /Sool Loft/ });
    expect(link.getAttribute("href")).toBe("/places/sool-loft");
    expect(screen.getByText("Seongsu")).toBeTruthy();
  });
});
```

- [ ] **Step 9: Run it → FAIL, then implement `components/editorial/PlaceCard.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import type { Place } from "@/services/types";

export function PlaceCard({ place }: { place: Place }) {
  const cover = place.images[0];
  return (
    <Link href={`/places/${place.slug}`} className="group block">
      {cover && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-soft-gray">
          <Image
            src={cover}
            alt={place.name}
            fill
            className="object-cover transition-transform duration-medium group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl group-hover:text-accent">
          {place.name}
        </h3>
        {place.area && (
          <span className="text-xs text-text-muted">{place.area}</span>
        )}
      </div>
      {place.shortDescription && (
        <p className="mt-1 text-sm text-text-muted line-clamp-2">
          {place.shortDescription}
        </p>
      )}
    </Link>
  );
}
```

- [ ] **Step 10: Run it → PASS.**

- [ ] **Step 11: Write `components/editorial/ProductCard.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/services/types";

const base = {
  id: "1",
  name: "Rice Toner",
  brand: "Beauty of Joseon",
  slug: "boj-rice-toner",
  category: "toner",
  description: "A milky toner.",
  price: "$17",
  image: null,
  affiliateUrl: null,
  whereToBuy: null,
  bestFor: null,
  ingredients: null,
  rating: null,
  disclosureRequired: false,
} as Product;

describe("ProductCard", () => {
  it("shows brand, name, and price", () => {
    render(<ProductCard product={base} />);
    expect(screen.getByText("Beauty of Joseon")).toBeTruthy();
    expect(screen.getByText("Rice Toner")).toBeTruthy();
    expect(screen.getByText("$17")).toBeTruthy();
  });
  it("shows a disclosure note only when disclosureRequired", () => {
    const { rerender } = render(<ProductCard product={base} />);
    expect(screen.queryByText(/affiliate/i)).toBeNull();
    rerender(<ProductCard product={{ ...base, disclosureRequired: true }} />);
    expect(screen.getByText(/affiliate/i)).toBeTruthy();
  });
  it("renders an outbound buy link only when affiliateUrl is present", () => {
    const { rerender } = render(<ProductCard product={base} />);
    expect(screen.queryByRole("link", { name: /shop/i })).toBeNull();
    rerender(
      <ProductCard product={{ ...base, affiliateUrl: "https://x.example/p" }} />
    );
    const link = screen.getByRole("link", { name: /shop/i });
    expect(link.getAttribute("href")).toBe("https://x.example/p");
    expect(link.getAttribute("rel")).toContain("nofollow");
  });
});
```

- [ ] **Step 12: Run it → FAIL, then implement `components/editorial/ProductCard.tsx`**

```tsx
import Image from "next/image";
import type { Product } from "@/services/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-lg border border-soft-gray bg-white p-4">
      {product.image && (
        <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-soft-gray">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
      )}
      {product.brand && (
        <p className="text-xs uppercase tracking-wide text-text-muted">
          {product.brand}
        </p>
      )}
      <h3 className="font-serif text-lg">{product.name}</h3>
      <div className="mt-1 flex items-center justify-between">
        {product.price && <span className="text-sm">{product.price}</span>}
        {product.affiliateUrl && (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-sm text-accent hover:text-accent-hover"
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

- [ ] **Step 13: Run it → PASS.**

- [ ] **Step 14: Run suite + commit**

Run: `npm run test && npm run typecheck`
Expected: pass; +5 tests (ArticleCard 1, PlaceCard 1, ProductCard 3).

```bash
git add components/editorial/SectionHeading.tsx components/editorial/Hero.tsx components/editorial/CategoryCard.tsx components/editorial/ArticleCard.tsx components/editorial/ArticleCard.test.tsx components/editorial/PlaceCard.tsx components/editorial/PlaceCard.test.tsx components/editorial/ProductCard.tsx components/editorial/ProductCard.test.tsx
git commit -m "feat(public): editorial cards, hero, section heading

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Sanitized markdown renderer (`Prose`) + typography

**Files:**

- Modify: `package.json` (add deps), `tailwind.config.ts` (add typography plugin)
- Create: `components/editorial/Prose.tsx`, `components/editorial/Prose.test.tsx`

**Interfaces:**

- Produces: `<Prose markdown={string} />` — renders sanitized markdown (GFM) into branded prose; strips embedded HTML/script.

- [ ] **Step 1: Add dependencies**

Run:

```bash
npm install react-markdown@^9 remark-gfm@^4 rehype-sanitize@^6
npm install -D @tailwindcss/typography@^0.5
```

Expected: installs succeed; `package.json` updated.

- [ ] **Step 2: Enable the typography plugin in `tailwind.config.ts`**

Add to the top of the file:

```ts
import typography from "@tailwindcss/typography";
```

Change the `plugins: []` line to:

```ts
  plugins: [typography],
```

- [ ] **Step 3: Write `components/editorial/Prose.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Prose } from "./Prose";

describe("Prose", () => {
  it("renders markdown headings and paragraphs", () => {
    render(<Prose markdown={"## A heading\n\nSome body text."} />);
    expect(screen.getByRole("heading", { name: "A heading" })).toBeTruthy();
    expect(screen.getByText("Some body text.")).toBeTruthy();
  });
  it("does not render embedded raw script tags as executable HTML", () => {
    const { container } = render(
      <Prose markdown={"Hi <script>window.x=1</script> there"} />
    );
    expect(container.querySelector("script")).toBeNull();
  });
});
```

- [ ] **Step 4: Run it → FAIL** (`npm run test -- Prose`).

- [ ] **Step 5: Implement `components/editorial/Prose.tsx`**

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function Prose({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-a:text-accent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
```

> Note: `react-markdown` does not parse raw HTML unless `rehype-raw` is added (it isn't), and `rehype-sanitize` strips anything dangerous — so embedded `<script>` is never rendered. The second test guards this.

- [ ] **Step 6: Run it → PASS.**

- [ ] **Step 7: Run suite + build + commit**

Run: `npm run test && npm run typecheck && npm run build`
Expected: pass; +2 tests.

```bash
git add package.json package-lock.json tailwind.config.ts components/editorial/Prose.tsx components/editorial/Prose.test.tsx
git commit -m "feat(public): sanitized markdown Prose renderer + typography plugin

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Newsletter — email validation (TDD) + server action + form

**Files:**

- Create: `lib/validation.ts`, `lib/validation.test.ts`, `app/actions/newsletter.ts`, `components/editorial/NewsletterForm.tsx`

**Interfaces:**

- Consumes: `createClient` from `@/lib/supabase/server` (the one write path).
- Produces:
  - `isValidEmail(email: string): boolean` — `lib/validation.ts`
  - `subscribeToNewsletter(prevState, formData): Promise<{ ok: boolean; message: string }>` — server action
  - `<NewsletterForm />` — client component using `useFormState`

- [ ] **Step 1: Write `lib/validation.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { isValidEmail } from "./validation";

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
  });
  it("rejects missing @ or domain", () => {
    expect(isValidEmail("ab.com")).toBe(false);
    expect(isValidEmail("a@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
  it("trims surrounding whitespace before judging", () => {
    expect(isValidEmail("  a@b.com  ")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it → FAIL.**

- [ ] **Step 3: Implement `lib/validation.ts`**

```ts
export function isValidEmail(email: string): boolean {
  const value = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
```

- [ ] **Step 4: Run it → PASS** (3 tests).

- [ ] **Step 5: Implement `app/actions/newsletter.ts`**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/validation";

export type NewsletterState = { ok: boolean; message: string };

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isValidEmail(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });
  if (error) {
    // Unique-violation (already subscribed) is a success from the user's view.
    if (error.code === "23505") {
      return { ok: true, message: "You're already on the list — thank you!" };
    }
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  return { ok: true, message: "Thanks for subscribing!" };
}
```

- [ ] **Step 6: Implement `components/editorial/NewsletterForm.tsx`**

```tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  subscribeToNewsletter,
  type NewsletterState,
} from "@/app/actions/newsletter";

const initial: NewsletterState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Subscribing…" : "Subscribe"}
    </button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useFormState(subscribeToNewsletter, initial);
  return (
    <form action={formAction} className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-md border border-soft-gray bg-white px-3 py-2.5 sm:max-w-xs"
        />
        <SubmitButton />
      </div>
      {state.message && (
        <p
          role="status"
          className={`mt-2 text-sm ${state.ok ? "text-accent" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 7: Verify, run suite, commit**

Run: `npm run test && npm run typecheck && npm run build`
Expected: pass; +3 tests.

```bash
git add lib/validation.ts lib/validation.test.ts app/actions/newsletter.ts components/editorial/NewsletterForm.tsx
git commit -m "feat(public): newsletter signup — validation, server action, form

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Home page

**Files:**

- Replace: `app/page.tsx`

**Interfaces:**

- Consumes: `listPublishedPosts`, `listPlaces`, `listProducts`; `Hero`, `SectionHeading`, `ArticleCard`, `PlaceCard`, `ProductCard`, `CategoryCard`, `NewsletterForm`; `CATEGORIES`.

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import { listPublishedPosts } from "@/services/posts";
import { listPlaces } from "@/services/places";
import { listProducts } from "@/services/products";
import { CATEGORIES } from "@/lib/categories";
import { Hero } from "@/components/editorial/Hero";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import { ProductCard } from "@/components/editorial/ProductCard";
import { CategoryCard } from "@/components/editorial/CategoryCard";
import { NewsletterForm } from "@/components/editorial/NewsletterForm";

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
        <section className="mx-auto max-w-content px-6">
          <SectionHeading title="Featured Story" eyebrow="This week" />
          <ArticleCard post={featured} />
        </section>
      )}

      <section className="mx-auto mt-20 max-w-content px-6">
        <SectionHeading title="Explore by Category" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="mx-auto mt-20 max-w-content px-6">
          <SectionHeading title="Latest Stories" href="/articles" />
          <div className="grid gap-8 md:grid-cols-3">
            {latest.map((p) => (
              <ArticleCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {places.length > 0 && (
        <section className="mx-auto mt-20 max-w-content px-6">
          <SectionHeading title="Seoul Directory" href="/places" />
          <div className="grid gap-8 md:grid-cols-3">
            {places.map((pl) => (
              <PlaceCard key={pl.id} place={pl} />
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="mx-auto mt-20 max-w-content px-6">
          <SectionHeading title="Weekly Picks" href="/picks" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((pr) => (
              <ProductCard key={pr.id} product={pr} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-20 max-w-content px-6">
        <div className="rounded-lg bg-muted-pink/40 p-8">
          <h2 className="font-serif text-3xl">Stay in the loop</h2>
          <p className="mt-2 text-text-muted">
            New stories, places, and picks — a few times a month.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify build (no live DB → page is dynamic, queries run at request time)**

Run: `npm run typecheck && npm run build`
Expected: PASS. The home route is dynamic (server Supabase client reads cookies), so the build does not execute the queries.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(public): home page — hero, featured, categories, latest, directory, picks, newsletter

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Articles — listing + detail

**Files:**

- Create: `app/articles/page.tsx`, `app/articles/[slug]/page.tsx`

**Interfaces:**

- Consumes: `listPublishedPosts`, `getPostBySlug`; `ArticleCard`, `SectionHeading`, `Prose`, `JsonLd`; `articleJsonLd`, `breadcrumbJsonLd`, `canonical`.

- [ ] **Step 1: Implement `app/articles/page.tsx`**

```tsx
import type { Metadata } from "next";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Guides and stories on Korean beauty, hair, head spas, and Seoul.",
  alternates: { canonical: canonical("/articles") },
};

export default async function ArticlesPage() {
  const posts = await listPublishedPosts({ limit: 48 });
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Stories" eyebrow="The Journal" />
      {posts.length === 0 ? (
        <p className="text-text-muted">
          No stories published yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {posts.map((p) => (
            <ArticleCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Implement `app/articles/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/services/posts";
import { Prose } from "@/components/editorial/Prose";
import { JsonLd } from "@/components/editorial/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, canonical } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: canonical(`/articles/${post.slug}`) },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Stories", path: "/articles" },
          { name: post.title, path: `/articles/${post.slug}` },
        ])}
      />
      <article>
        <p className="text-xs uppercase tracking-widest text-accent">
          {post.category.replace(/_/g, " ")}
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">{post.title}</h1>
        {post.subtitle && (
          <p className="mt-3 text-xl text-text-muted">{post.subtitle}</p>
        )}
        {post.author && (
          <p className="mt-4 text-sm text-text-muted">By {post.author}</p>
        )}
        <div className="mt-8">
          {post.body ? (
            <Prose markdown={post.body} />
          ) : (
            <p className="text-text-muted">{post.excerpt}</p>
          )}
        </div>
      </article>
    </main>
  );
}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run build`
Expected: PASS.

```bash
git add app/articles
git commit -m "feat(public): article listing + detail (markdown, JSON-LD, 404)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Category pages

**Files:**

- Create: `app/[category]/page.tsx`

**Interfaces:**

- Consumes: `getCategoryBySlug`, `CATEGORY_SLUGS`, `listPublishedPosts`; `ArticleCard`, `SectionHeading`, `canonical`.

> Routing note: static segments (`/articles`, `/places`, `/picks`, `/about`, `/contact`, `/privacy`) take precedence over this dynamic `[category]` segment in Next.js App Router, so this route only resolves the editorial category slugs. Unknown slugs `notFound()`.

- [ ] **Step 1: Implement `app/[category]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, CATEGORY_SLUGS } from "@/lib/categories";
import { listPublishedPosts } from "@/services/posts";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const cat = getCategoryBySlug(params.category);
  if (!cat) return { title: "Not found" };
  return {
    title: cat.label,
    description: `${cat.label} stories from A Drop of Seoul.`,
    alternates: { canonical: canonical(`/${cat.slug}`) },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cat = getCategoryBySlug(params.category);
  if (!cat) notFound();

  const posts = await listPublishedPosts({
    limit: 48,
    category: cat.enumValue,
  });
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title={cat.label} eyebrow="Category" />
      {posts.length === 0 ? (
        <p className="text-text-muted">
          No {cat.label.toLowerCase()} stories yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {posts.map((p) => (
            <ArticleCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck && npm run build`
Expected: PASS (build pre-renders the 5 category params as dynamic shells).

```bash
git add "app/[category]"
git commit -m "feat(public): editorial category pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Places directory + place detail

**Files:**

- Create: `app/places/page.tsx`, `app/places/[slug]/page.tsx`

**Interfaces:**

- Consumes: `listPlaces`, `getPlaceBySlug`; `PlaceCard`, `SectionHeading`, `Prose`, `JsonLd`; `localBusinessJsonLd`, `breadcrumbJsonLd`, `canonical`.

- [ ] **Step 1: Implement `app/places/page.tsx`**

```tsx
import type { Metadata } from "next";
import { listPlaces } from "@/services/places";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Seoul Directory",
  description:
    "Head spas, salons, clinics, cafes, and wellness spots worth knowing in Seoul.",
  alternates: { canonical: canonical("/places") },
};

export default async function PlacesPage() {
  const places = await listPlaces({ limit: 96 });
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Seoul Directory" eyebrow="Places" />
      {places.length === 0 ? (
        <p className="text-text-muted">
          No places listed yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {places.map((pl) => (
            <PlaceCard key={pl.id} place={pl} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Implement `app/places/[slug]/page.tsx`** (conditional map/booking links per ENG-R5)

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlaceBySlug } from "@/services/places";
import { Prose } from "@/components/editorial/Prose";
import { JsonLd } from "@/components/editorial/JsonLd";
import { localBusinessJsonLd, breadcrumbJsonLd, canonical } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const place = await getPlaceBySlug(params.slug);
  if (!place) return { title: "Not found" };
  return {
    title: place.name,
    description: place.shortDescription ?? undefined,
    alternates: { canonical: canonical(`/places/${place.slug}`) },
    openGraph: {
      title: place.name,
      description: place.shortDescription ?? undefined,
      images: place.images[0] ? [place.images[0]] : undefined,
    },
  };
}

const LINKS: {
  key: "googleMapUrl" | "naverMapUrl" | "bookingUrl" | "instagramUrl";
  label: string;
}[] = [
  { key: "googleMapUrl", label: "Google Maps" },
  { key: "naverMapUrl", label: "Naver Map" },
  { key: "bookingUrl", label: "Book" },
  { key: "instagramUrl", label: "Instagram" },
];

export default async function PlacePage({
  params,
}: {
  params: { slug: string };
}) {
  const place = await getPlaceBySlug(params.slug);
  if (!place) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={localBusinessJsonLd(place)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Places", path: "/places" },
          { name: place.name, path: `/places/${place.slug}` },
        ])}
      />
      <p className="text-xs uppercase tracking-widest text-accent">
        {place.category.replace(/_/g, " ")}
        {place.area ? ` · ${place.area}` : ""}
      </p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">{place.name}</h1>
      {place.shortDescription && (
        <p className="mt-3 text-xl text-text-muted">{place.shortDescription}</p>
      )}

      {place.whyWeLikeIt && (
        <div className="mt-6 rounded-lg bg-muted-pink/40 p-4">
          <p className="text-sm font-medium">Why we like it</p>
          <p className="mt-1 text-sm text-text-muted">{place.whyWeLikeIt}</p>
        </div>
      )}

      {place.longDescription && (
        <div className="mt-8">
          <Prose markdown={place.longDescription} />
        </div>
      )}

      <dl className="mt-8 space-y-1 text-sm">
        {place.bestFor && (
          <div className="flex gap-2">
            <dt className="text-text-muted">Best for</dt>
            <dd>{place.bestFor}</dd>
          </div>
        )}
        {place.priceRange && (
          <div className="flex gap-2">
            <dt className="text-text-muted">Price</dt>
            <dd>{place.priceRange}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {LINKS.filter((l) => place[l.key]).map((l) => (
          <a
            key={l.key}
            href={place[l.key] as string}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-soft-gray px-4 py-2 text-sm hover:border-accent"
          >
            {l.label}
          </a>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run build`
Expected: PASS.

```bash
git add app/places
git commit -m "feat(public): places directory + detail (LocalBusiness JSON-LD, conditional links, 404)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Picks, static pages, 404, robots + sitemap

**Files:**

- Create: `app/picks/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`, `app/privacy/page.tsx`, `app/not-found.tsx`, `app/robots.ts`, `app/sitemap.ts`

**Interfaces:**

- Consumes: `listProducts`, `listPublishedPosts`, `listPlaces`; `ProductCard`, `SectionHeading`, `NewsletterForm`; `SITE_URL`, `canonical`.

- [ ] **Step 1: Implement `app/picks/page.tsx`**

```tsx
import type { Metadata } from "next";
import { listProducts } from "@/services/products";
import { ProductCard } from "@/components/editorial/ProductCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Picks",
  description: "Korean beauty and hair products we recommend.",
  alternates: { canonical: canonical("/picks") },
};

export default async function PicksPage() {
  const products = await listProducts({ limit: 96 });
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Picks" eyebrow="What we love" />
      {products.length === 0 ? (
        <p className="text-text-muted">No picks yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Implement the three static pages**

`app/about/page.tsx`:

```tsx
import type { Metadata } from "next";
import { SITE_NAME, TAGLINE } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE_NAME}.`,
  alternates: { canonical: canonical("/about") },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">About</h1>
      <p className="mt-4 text-lg text-text-muted">{TAGLINE}</p>
      <p className="mt-6">
        {SITE_NAME} is an English-language guide to Korean beauty, haircare,
        head spas, salons, and the Seoul places worth knowing — written for a
        global audience discovering Korean rituals and craft.
      </p>
    </main>
  );
}
```

`app/contact/page.tsx`:

```tsx
import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { NewsletterForm } from "@/components/editorial/NewsletterForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with A Drop of Seoul.",
  alternates: { canonical: canonical("/contact") },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Contact</h1>
      <p className="mt-4 text-text-muted">
        Partnerships, press, or a place we should know about? Email{" "}
        <a className="text-accent" href="mailto:hello@adropofseoul.com">
          hello@adropofseoul.com
        </a>
        .
      </p>
      <div className="mt-8">
        <h2 className="font-serif text-2xl">Newsletter</h2>
        <NewsletterForm />
      </div>
    </main>
  );
}
```

`app/privacy/page.tsx`:

```tsx
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE_NAME}.`,
  alternates: { canonical: canonical("/privacy") },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Privacy Policy</h1>
      <p className="mt-4 text-text-muted">
        We collect only the email addresses submitted to our newsletter, used
        solely to send occasional updates. You can unsubscribe at any time. We
        do not sell personal data.
      </p>
      <p className="mt-4 text-text-muted">
        This site uses affiliate links; purchases made through them may earn us
        a commission at no extra cost to you.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Implement `app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-content px-6 py-32 text-center">
      <p className="text-sm uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-2 font-serif text-5xl">Page not found</h1>
      <p className="mt-4 text-text-muted">
        The page you were looking for isn’t here.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover"
      >
        Back home
      </Link>
    </main>
  );
}
```

- [ ] **Step 4: Implement `app/robots.ts`**

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 5: Implement `app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { listPublishedPosts } from "@/services/posts";
import { listPlaces } from "@/services/places";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/articles",
    "/places",
    "/picks",
    "/about",
    "/contact",
    "/privacy",
    ...CATEGORY_SLUGS.map((s) => `/${s}`),
  ];

  let posts: { slug: string }[] = [];
  let places: { slug: string }[] = [];
  try {
    [posts, places] = await Promise.all([
      listPublishedPosts({ limit: 1000 }),
      listPlaces({ limit: 1000 }),
    ]);
  } catch {
    // No live DB yet (or transient failure): still emit the static routes.
  }

  return [
    ...staticPaths.map((p) => ({
      url: `${SITE_URL}${p}`,
      lastModified: new Date(),
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/articles/${p.slug}`,
      lastModified: new Date(),
    })),
    ...places.map((pl) => ({
      url: `${SITE_URL}/places/${pl.slug}`,
      lastModified: new Date(),
    })),
  ];
}
```

- [ ] **Step 6: Verify, run full suite, commit**

Run: `npm run test && npm run typecheck && npm run build`
Expected: all tests pass; build emits `/robots.txt` and `/sitemap.xml` routes.

```bash
git add app/picks app/about app/contact app/privacy app/not-found.tsx app/robots.ts app/sitemap.ts
git commit -m "feat(public): picks, static pages, 404, robots + sitemap

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Definition of Done (Plan 2)

- Every page wrapped in branded header/footer; primary nav correct.
- Home composes hero, featured, categories, latest, directory, picks, newsletter.
- `/articles` + `/articles/[slug]` (markdown body, Article JSON-LD, breadcrumb, 404).
- `/[category]` for the 5 editorial categories (404 on unknown).
- `/places` + `/places/[slug]` (LocalBusiness JSON-LD, conditional map/booking links, 404).
- `/picks`, `/about`, `/contact`, `/privacy`, branded 404.
- Newsletter signup writes to `newsletter_subscribers` (dedupe-friendly).
- `robots.txt` + dynamic `sitemap.xml`; per-route metadata + canonicals + OG.
- `npm run typecheck`, `npm run build`, `npm run test` green (≈36 tests).

**Deferred to provisioning (same checkpoint as Plan 1):** live-data render verification — confirming pages render seeded posts/places/products and the newsletter insert succeeds — requires the Supabase project.

**Next:** Plan 3 — Admin CMS (Posts/Places/Products CRUD, Media Library, dashboard, admin i18n).

```

```
