# A Drop of Seoul — Foundation & Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the independent `adropofseoul` Next.js project — scaffold + tooling, brand design system, Supabase clients, full Postgres schema with RLS + seed, a typed `services/` data-access layer, and an allowlist-gated `/admin` auth shell.

**Architecture:** Clean-room port of Essenly's *technical skeleton only* (Next.js 14 App Router, Supabase-SSR, husky/eslint/vitest tooling). All application code, branding, and business logic are written fresh. Data access is funneled through a typed `services/` layer; components never touch Supabase directly. Pure helpers (`slugify`) and the auth allowlist are unit-tested; row→view mapping is tested with fixtures against a fake Supabase client.

**Tech Stack:** Next.js 14.2 (App Router) · TypeScript (strict) · Tailwind CSS 3.4 · `@supabase/ssr` + `@supabase/supabase-js` · Vitest + Testing Library · Supabase CLI (migrations, type-gen).

## Global Constraints

- **Independent product:** no Essenly application code, branding, routes, assets, business logic, or git history. Essenly is a technical starter only.
- **Repo:** new directory `/Users/jj_whatap/up/adropofseoul`; fresh git history on `main`; new GitHub repo named `adropofseoul`.
- **Next.js:** `14.2.35`. **TypeScript:** `strict: true`. Path alias `@/*` → `./*`.
- **Public content language:** English only. No KR columns.
- **Brand tokens (exact):** bg `#FAF8F4`, text `#1C1C1C`, accent `#B78B62`, soft-gray `#E8E2DA`, muted-pink `#E9D6CF`. Headings **Cormorant Garamond**; body/UI **Inter** (both via `next/font`).
- **Admin gate:** Supabase Auth + email allowlist from env `ADMIN_EMAILS` (comma-separated, case-insensitive).
- **Data access:** all DB reads/writes go through `services/*`. RLS on every table: public `SELECT` of published rows only; writes admin-only.
- **DB queries:** always bounded (`limit`/range); never unbounded `select("*")` on a full table for listings.
- **Commit trailer:** end every commit message with
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **All commands run from** `/Users/jj_whatap/up/adropofseoul` unless stated otherwise.

---

## File Structure

```
adropofseoul/
  package.json, next.config.js, tsconfig.json, postcss.config.mjs,
  tailwind.config.ts, .eslintrc.json, .prettierrc, .lintstagedrc,
  vitest.config.ts, .gitignore, .env.example, README.md
  .husky/pre-commit
  app/
    layout.tsx              # root layout: fonts, <html>, global chrome slot
    globals.css             # Tailwind layers + CSS font vars
    page.tsx                # temporary home placeholder (replaced in Plan 2)
    admin/
      layout.tsx            # server-side allowlist gate + admin chrome
      page.tsx              # admin home (placeholder dashboard)
      login/page.tsx        # email/password login (client)
      actions.ts            # signIn / signOut server actions
  components/
    ui/                     # (created as needed in later plans)
  lib/
    supabase/
      client.ts             # browser client
      server.ts             # server client
      middleware.ts         # session refresh + /admin gate
    auth.ts                 # isAllowedAdmin(email) + ADMIN_EMAILS parsing
    slug.ts                 # slugify()
    slug.test.ts
    auth.test.ts
  services/
    types.ts                # domain view types (Post, Place, Product, ...)
    posts.ts                # listPublishedPosts, getPostBySlug, mapPostRow
    places.ts               # listPlaces, getPlaceBySlug, mapPlaceRow
    products.ts             # listProducts, getProductBySlug, mapProductRow
    _fake-supabase.ts       # test helper: fake query builder
    posts.test.ts
    places.test.ts
    products.test.ts
  types/
    database.types.ts       # generated from Supabase (committed)
  supabase/
    config.toml
    migrations/
      0001_init.sql         # tables, enums, indexes
      0002_rls.sql          # RLS policies
    seed.sql                # sample posts/places/products
  middleware.ts             # delegates to lib/supabase/middleware
  docs/
    superpowers/...         # this plan + spec
    PROVISIONING.md         # how to create the Supabase project + apply schema
```

---

### Task 1: Project scaffold, tooling, and GitHub repo

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `postcss.config.mjs`, `.eslintrc.json`, `.prettierrc`, `.lintstagedrc`, `vitest.config.ts`, `.gitignore`, `.env.example`, `README.md`, `.husky/pre-commit`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Produces: a booting Next.js app; `npm run build`, `npm run typecheck`, `npm run test` all green; `@/*` path alias; `origin` remote pointing at the new GitHub repo.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "adropofseoul",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:push": "npx supabase db push",
    "db:diff": "npx supabase db diff",
    "db:types": "npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > types/database.types.ts",
    "db:migration": "npx supabase migration new",
    "prepare": "husky"
  },
  "dependencies": {
    "@supabase/ssr": "^0.9.0",
    "@supabase/supabase-js": "^2.99.1",
    "next": "14.2.35",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "husky": "^9.1.7",
    "jsdom": "^29.0.1",
    "lint-staged": "^16.4.0",
    "postcss": "^8",
    "prettier": "^3.8.3",
    "tailwindcss": "^3.4.1",
    "typescript": "^5",
    "vitest": "^4.1.2"
  }
}
```

- [ ] **Step 2: Create config files**

`next.config.js` (note: **no** next-pwa — Essenly-specific; keep only Supabase image host allow-listing):

```js
const SUPABASE_HOSTNAME = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname;
  } catch {
    return null;
  }
})();

const remotePatterns = [];
if (SUPABASE_HOSTNAME) {
  remotePatterns.push({ protocol: "https", hostname: SUPABASE_HOSTNAME });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns },
};

module.exports = nextConfig;
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`postcss.config.mjs`:

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: { tailwindcss: {} },
};
export default config;
```

`.eslintrc.json`:

```json
{ "extends": ["next/core-web-vitals", "next/typescript"] }
```

`.prettierrc`:

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

`.lintstagedrc`:

```json
{ "*": "prettier --ignore-unknown --write" }
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "jsdom" },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`.gitignore`:

```
/node_modules
/.pnp
.pnp.js

/coverage

/.next/
/out/
/build

.DS_Store
*.pem

npm-debug.log*
yarn-debug.log*
yarn-error.log*

.env*.local
.env.local

.vercel

*.tsbuildinfo
next-env.d.ts

.superpowers/
.vscode/
```

- [ ] **Step 3: Create `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_PROJECT_ID=your-supabase-project-ref
ADMIN_EMAILS=you@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 4: Create the app shell**

`app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  background-color: #faf8f4;
  color: #1c1c1c;
}
```

`app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "A Drop of Seoul",
  description:
    "A curated guide to Korean beauty, hair rituals, head spas, and places worth knowing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

`app/page.tsx` (temporary — replaced in Plan 2):

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="font-serif text-5xl">A Drop of Seoul</h1>
      <p className="mt-4 text-lg text-[#1c1c1c]/70">
        A curated guide to Korean beauty, hair rituals, head spas, and places
        worth knowing.
      </p>
    </main>
  );
}
```

- [ ] **Step 5: Install dependencies and init husky**

Run:
```bash
npm install
npx husky init
printf '%s\n' 'npx lint-staged' > .husky/pre-commit
```
Expected: `node_modules/` populated; `.husky/pre-commit` exists.

- [ ] **Step 6: Verify the app builds, type-checks, and tests run**

Run:
```bash
npm run typecheck && npm run build
```
Expected: typecheck passes; build completes with a `/` route. (No test files yet; `npm run test` will be exercised in later tasks.)

- [ ] **Step 7: Write `README.md`**

```markdown
# A Drop of Seoul

English-language editorial site curating Korean beauty, haircare, head spas,
salons, wellness, and Seoul lifestyle places.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres,
Auth, Storage) · Vercel.

## Getting started
1. `cp .env.example .env.local` and fill in Supabase + ADMIN_EMAILS values.
2. `npm install`
3. `npm run dev` → http://localhost:3000

See `docs/PROVISIONING.md` for Supabase project setup and schema application.
```

- [ ] **Step 8: First commit (fresh history)**

```bash
git add -A
git commit -m "chore: scaffold adropofseoul (Next.js 14 + Supabase + Tailwind)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 9: Create the GitHub repo and push**

First confirm auth: `gh auth status` (expected: logged in). Then:
```bash
gh repo create adropofseoul --private --source=. --remote=origin --push
```
Expected: repo created at `github.com/<account>/adropofseoul`; `origin` set; `main` pushed. (Private by default — flip to public later with `gh repo edit --visibility public` when ready to launch.)

Verify: `git remote -v` shows `origin` → `adropofseoul`.

---

### Task 2: Brand design system + base chrome

**Files:**
- Create: `tailwind.config.ts`
- Modify: `app/globals.css`, `app/layout.tsx`

**Interfaces:**
- Produces: Tailwind theme tokens `bg`, `text`, `accent`, `soft-gray`, `muted-pink`; font families `font-serif` (Cormorant) and `font-sans` (Inter); usable across all later components.

- [ ] **Step 1: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAF8F4",
        text: { DEFAULT: "#1C1C1C", muted: "rgba(28,28,28,0.66)" },
        accent: { DEFAULT: "#B78B62", hover: "#A2774F" },
        "soft-gray": "#E8E2DA",
        "muted-pink": "#E9D6CF",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: { sm: "4px", md: "8px", lg: "16px" },
      maxWidth: { content: "72rem" },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Update `app/globals.css` to use tokens**

Replace the `body` rule with Tailwind `@layer base`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light;
  }
  body {
    @apply bg-bg text-text;
  }
  h1, h2, h3 {
    @apply font-serif;
  }
}
```

- [ ] **Step 3: Verify build + visual smoke**

Run:
```bash
npm run build && npm run dev
```
Expected: build passes. Manually open http://localhost:3000 — the heading renders in Cormorant Garamond on the `#FAF8F4` background. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "feat(design): A Drop of Seoul brand tokens + fonts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Supabase clients + admin-gating middleware

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts`

**Interfaces:**
- Consumes: env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Produces:
  - `createClient()` (browser) — `lib/supabase/client.ts`
  - `createClient()` (async, server) — `lib/supabase/server.ts`
  - `updateSession(request: NextRequest): Promise<NextResponse>` — `lib/supabase/middleware.ts`

- [ ] **Step 1: Create `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create `lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create `lib/supabase/middleware.ts`** (gate `/admin`, not Essenly's `/home`/`/onboarding`)

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminArea = path.startsWith("/admin") && path !== "/admin/login";
  if (!user && isAdminArea) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin/login";
    return NextResponse.redirect(redirect);
  }

  return supabaseResponse;
}
```

- [ ] **Step 4: Create root `middleware.ts`**

```ts
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase middleware.ts
git commit -m "feat(auth): Supabase clients + /admin session middleware

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Database schema, RLS, seed, and provisioning doc

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_rls.sql`, `supabase/seed.sql`, `types/database.types.ts`, `docs/PROVISIONING.md`

**Interfaces:**
- Produces: tables `posts`, `places`, `products`, `media`, `newsletter_subscribers`; enums `post_status`, `post_category`, `place_category`, `partnership_status`; generated `Database` type exported from `types/database.types.ts`.

> **Manual prerequisite (human checkpoint):** This task writes and applies SQL to a live Supabase project. Before Step 6, a human must create a Supabase project, put its values in `.env.local` and link the CLI (`npx supabase link --project-ref <ref>`). Steps 1–5 (writing SQL + config) need no credentials; Steps 6–7 (apply + type-gen) do. See `docs/PROVISIONING.md`.

- [ ] **Step 1: Create `supabase/config.toml`**

```toml
project_id = "adropofseoul"

[db]
port = 54322
major_version = 15
```

- [ ] **Step 2: Create `supabase/migrations/0001_init.sql`**

```sql
-- Enums
create type post_status as enum ('draft', 'published');
create type post_category as enum ('beauty', 'hair', 'head_spa', 'places', 'wellness', 'products', 'guides');
create type place_category as enum ('head_spa', 'salon', 'cafe', 'clinic', 'shop', 'wellness');
create type partnership_status as enum ('none', 'contacted', 'interested', 'partner');

-- updated_at trigger helper
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text,
  excerpt text,
  body text,
  category post_category not null,
  tags text[] not null default '{}',
  featured_image text,
  gallery_images jsonb not null default '[]',
  author text,
  seo_title text,
  meta_description text,
  status post_status not null default 'draft',
  published_at timestamptz,
  related_places uuid[] not null default '{}',
  related_products uuid[] not null default '{}',
  instagram_caption text,
  threads_post text,
  x_post text,
  pinterest_title text,
  pinterest_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_status_published_at_idx on posts (status, published_at desc);
create index posts_category_idx on posts (category);
create trigger posts_set_updated_at before update on posts
  for each row execute function set_updated_at();

-- places
create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category place_category not null,
  area text,
  address text,
  short_description text,
  long_description text,
  why_we_like_it text,
  best_for text,
  price_range text,
  instagram_url text,
  naver_map_url text,
  google_map_url text,
  booking_url text,
  contact_email text,
  contact_phone text,
  languages text[] not null default '{}',
  images jsonb not null default '[]',
  partnership_status partnership_status not null default 'none',
  notes text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index places_category_idx on places (category);
create index places_published_idx on places (is_published);
create trigger places_set_updated_at before update on places
  for each row execute function set_updated_at();

-- products
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  slug text not null unique,
  category text,
  description text,
  price text,
  image text,
  affiliate_url text,
  where_to_buy text,
  best_for text,
  ingredients text,
  rating numeric(2,1),
  disclosure_required boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();

-- media
create table media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  alt_text text not null,
  caption text,
  folder text,
  width int,
  height int,
  created_at timestamptz not null default now()
);

-- newsletter
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 3: Create `supabase/migrations/0002_rls.sql`**

```sql
-- Enable RLS
alter table posts enable row level security;
alter table places enable row level security;
alter table products enable row level security;
alter table media enable row level security;
alter table newsletter_subscribers enable row level security;

-- Admin check: email present in app.admin_emails GUC (set per-request) OR
-- simpler: rely on authenticated role for writes. For MVP, writes require an
-- authenticated session; the app-layer allowlist (lib/auth.ts) is the gate.
-- Public read policies expose only published rows.

-- posts: public reads published; authenticated users full access
create policy posts_public_read on posts
  for select using (status = 'published');
create policy posts_admin_all on posts
  for all to authenticated using (true) with check (true);

-- places
create policy places_public_read on places
  for select using (is_published = true);
create policy places_admin_all on places
  for all to authenticated using (true) with check (true);

-- products
create policy products_public_read on products
  for select using (is_published = true);
create policy products_admin_all on products
  for all to authenticated using (true) with check (true);

-- media: admin-only
create policy media_admin_all on media
  for all to authenticated using (true) with check (true);

-- newsletter: anyone may insert their email; reads admin-only
create policy newsletter_public_insert on newsletter_subscribers
  for insert to anon, authenticated with check (true);
create policy newsletter_admin_read on newsletter_subscribers
  for select to authenticated using (true);
```

> **Security note for the implementer:** RLS grants any *authenticated* user full write access; the real admin restriction is enforced in the app layer (`lib/auth.ts` + `app/admin/layout.tsx`). This is acceptable for MVP **only because Supabase email signups are disabled** (documented in `PROVISIONING.md`) — the sole authenticated users are seeded admins. Do not enable public signups without first tightening these policies to an `admins` table check.

- [ ] **Step 4: Create `supabase/seed.sql`** (sample content so Plan 2's public site has data)

```sql
insert into posts (title, slug, category, excerpt, body, author, status, published_at)
values
  ('The Seoul Head Spa Ritual', 'seoul-head-spa-ritual', 'head_spa',
   'Inside the slow, sensory world of Korean scalp care.',
   E'## A new kind of calm\n\nKorean head spas treat the scalp as skin...',
   'Editorial Team', 'published', now()),
  ('Five K-Beauty Serums Worth the Hype', 'five-k-beauty-serums', 'beauty',
   'Our shortlist after months of testing.',
   E'## The shortlist\n\nWe narrowed it down...',
   'Editorial Team', 'published', now() - interval '2 days');

insert into places (name, slug, category, area, short_description, why_we_like_it, is_published)
values
  ('Sool Loft Head Spa', 'sool-loft-head-spa', 'head_spa', 'Seongsu',
   'A minimalist scalp-care studio in Seongsu.',
   'The aromatherapy steam treatment is unmatched.', true),
  ('Aman Salon', 'aman-salon', 'salon', 'Hannam',
   'Quiet, expert color work in Hannam.',
   'English-speaking stylists and a calm room.', true);

insert into products (name, brand, slug, category, description, price, best_for, disclosure_required, is_published)
values
  ('Rice Toner', 'Beauty of Joseon', 'boj-rice-toner', 'toner',
   'A milky, brightening toner.', '$17', 'dull skin', true, true);
```

- [ ] **Step 5: Write `docs/PROVISIONING.md`** (the manual checklist)

```markdown
# Supabase Provisioning

1. Create a project at supabase.com. Copy the Project URL, anon key, service
   role key, and project ref into `.env.local` (and Vercel env later).
2. **Disable email signups:** Auth → Providers → Email → turn OFF "Allow new
   users to sign up". (Admin accounts are created manually; see step 5.)
3. Link the CLI: `npx supabase link --project-ref <ref>`.
4. Apply schema: `npm run db:push` (runs migrations 0001, 0002) then, to load
   sample content, paste `supabase/seed.sql` into the SQL Editor and run it.
5. Create the admin user: Auth → Users → Add user (email + password). Put that
   email in `ADMIN_EMAILS`.
6. Generate types: `SUPABASE_PROJECT_ID=<ref> npm run db:types`, then commit
   `types/database.types.ts`.
```

- [ ] **Step 6: Apply migrations (requires provisioned project)**

Run: `npm run db:push`
Expected: migrations `0001_init`, `0002_rls` applied; no errors. Then load seed via SQL Editor (per `PROVISIONING.md`).

- [ ] **Step 7: Generate and commit types**

Run: `SUPABASE_PROJECT_ID=<ref> npm run db:types`
Expected: `types/database.types.ts` populated with a `Database` type containing `posts`, `places`, `products`, `media`, `newsletter_subscribers`.

- [ ] **Step 8: Commit**

```bash
git add supabase types/database.types.ts docs/PROVISIONING.md
git commit -m "feat(db): schema, RLS, seed + generated types

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `slugify` helper + typed `services/` data layer

**Files:**
- Create: `lib/slug.ts`, `lib/slug.test.ts`, `services/types.ts`, `services/_fake-supabase.ts`, `services/posts.ts`, `services/posts.test.ts`, `services/places.ts`, `services/places.test.ts`, `services/products.ts`, `services/products.test.ts`

**Interfaces:**
- Consumes: `Database` from `@/types/database.types`; `createClient` from `@/lib/supabase/server`.
- Produces:
  - `slugify(input: string): string` — `lib/slug.ts`
  - Domain types `Post`, `Place`, `Product` — `services/types.ts`
  - `mapPostRow(row): Post`, `listPublishedPosts(opts?: { limit?: number; category?: string }): Promise<Post[]>`, `getPostBySlug(slug: string): Promise<Post | null>` — `services/posts.ts`
  - `mapPlaceRow(row): Place`, `listPlaces(opts?: { limit?: number; category?: string }): Promise<Place[]>`, `getPlaceBySlug(slug): Promise<Place | null>` — `services/places.ts`
  - `mapProductRow(row): Product`, `listProducts(opts?: { limit?: number }): Promise<Product[]>`, `getProductBySlug(slug): Promise<Product | null>` — `services/products.ts`

- [ ] **Step 1: Write the failing test for `slugify`**

`lib/slug.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("The Seoul Head Spa Ritual")).toBe("the-seoul-head-spa-ritual");
  });
  it("strips punctuation and collapses spaces", () => {
    expect(slugify("Five K-Beauty  Serums!")).toBe("five-k-beauty-serums");
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("  Hello  ")).toBe("hello");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -- slug`
Expected: FAIL — `slugify` not exported.

- [ ] **Step 3: Implement `lib/slug.ts`**

```ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm run test -- slug`
Expected: PASS (3 tests).

- [ ] **Step 5: Create `services/types.ts`**

```ts
export type Post = {
  id: string;
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
  publishedAt: string | null;
};

export type Place = {
  id: string;
  name: string;
  slug: string;
  category: string;
  area: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  whyWeLikeIt: string | null;
  bestFor: string | null;
  priceRange: string | null;
  instagramUrl: string | null;
  naverMapUrl: string | null;
  googleMapUrl: string | null;
  bookingUrl: string | null;
  languages: string[];
  images: string[];
};

export type Product = {
  id: string;
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
};
```

- [ ] **Step 6: Create the fake Supabase client for tests**

`services/_fake-supabase.ts` — a minimal chainable query builder that records calls and returns canned rows. Each terminal (`maybeSingle`, or awaiting the builder) resolves `{ data, error }`.

```ts
type Result = { data: unknown; error: unknown };

export function fakeClient(result: Result) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.order = chain;
  builder.limit = chain;
  builder.range = chain;
  builder.maybeSingle = () => Promise.resolve(result);
  // Awaiting the builder itself resolves the result (for list queries).
  (builder as { then: unknown }).then = (
    onFulfilled: (r: Result) => unknown
  ) => Promise.resolve(result).then(onFulfilled);
  return {
    from: () => builder,
  };
}
```

- [ ] **Step 7: Write the failing test for `mapPostRow` + `getPostBySlug`**

`services/posts.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { mapPostRow, getPostBySlug } from "./posts";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1",
  title: "Hello",
  slug: "hello",
  subtitle: null,
  excerpt: "x",
  body: "## hi",
  category: "beauty",
  tags: ["k-beauty"],
  featured_image: "img.jpg",
  author: "Team",
  seo_title: null,
  meta_description: null,
  published_at: "2026-01-01T00:00:00Z",
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
import { createClient } from "@/lib/supabase/server";

describe("mapPostRow", () => {
  it("maps snake_case row to camelCase Post", () => {
    const post = mapPostRow(row as never);
    expect(post.featuredImage).toBe("img.jpg");
    expect(post.tags).toEqual(["k-beauty"]);
  });
});

describe("getPostBySlug", () => {
  it("returns mapped post when found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: row, error: null })
    );
    const post = await getPostBySlug("hello");
    expect(post?.slug).toBe("hello");
  });
  it("returns null when not found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: null, error: null })
    );
    const post = await getPostBySlug("nope");
    expect(post).toBeNull();
  });
});
```

- [ ] **Step 8: Run it to confirm it fails**

Run: `npm run test -- posts`
Expected: FAIL — `posts.ts` not implemented.

- [ ] **Step 9: Implement `services/posts.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import type { Post } from "./types";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string;
  tags: string[];
  featured_image: string | null;
  author: string | null;
  seo_title: string | null;
  meta_description: string | null;
  published_at: string | null;
};

const COLUMNS =
  "id,title,slug,subtitle,excerpt,body,category,tags,featured_image,author,seo_title,meta_description,published_at";

export function mapPostRow(row: PostRow): Post {
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
    publishedAt: row.published_at,
  };
}

export async function listPublishedPosts(
  opts: { limit?: number; category?: string } = {}
): Promise<Post[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? 24);
  if (opts.category) query = query.eq("category", opts.category);
  const { data, error } = await query;
  if (error) throw error;
  return (data as PostRow[] | null)?.map(mapPostRow) ?? [];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? mapPostRow(data as PostRow) : null;
}
```

- [ ] **Step 10: Run the test to confirm it passes**

Run: `npm run test -- posts`
Expected: PASS (3 tests).

- [ ] **Step 11: Implement `services/places.ts` + `services/places.test.ts`** (same pattern)

`services/places.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { Place } from "./types";

type PlaceRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  area: string | null;
  short_description: string | null;
  long_description: string | null;
  why_we_like_it: string | null;
  best_for: string | null;
  price_range: string | null;
  instagram_url: string | null;
  naver_map_url: string | null;
  google_map_url: string | null;
  booking_url: string | null;
  languages: string[];
  images: string[];
};

const COLUMNS =
  "id,name,slug,category,area,short_description,long_description,why_we_like_it,best_for,price_range,instagram_url,naver_map_url,google_map_url,booking_url,languages,images";

export function mapPlaceRow(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    area: row.area,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    whyWeLikeIt: row.why_we_like_it,
    bestFor: row.best_for,
    priceRange: row.price_range,
    instagramUrl: row.instagram_url,
    naverMapUrl: row.naver_map_url,
    googleMapUrl: row.google_map_url,
    bookingUrl: row.booking_url,
    languages: row.languages ?? [],
    images: Array.isArray(row.images) ? row.images : [],
  };
}

export async function listPlaces(
  opts: { limit?: number; category?: string } = {}
): Promise<Place[]> {
  const supabase = await createClient();
  let query = supabase
    .from("places")
    .select(COLUMNS)
    .eq("is_published", true)
    .order("name", { ascending: true })
    .limit(opts.limit ?? 50);
  if (opts.category) query = query.eq("category", opts.category);
  const { data, error } = await query;
  if (error) throw error;
  return (data as PlaceRow[] | null)?.map(mapPlaceRow) ?? [];
}

export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPlaceRow(data as PlaceRow) : null;
}
```

`services/places.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { mapPlaceRow, getPlaceBySlug } from "./places";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1", name: "Sool Loft", slug: "sool-loft", category: "head_spa",
  area: "Seongsu", short_description: "x", long_description: null,
  why_we_like_it: null, best_for: null, price_range: null,
  instagram_url: null, naver_map_url: null, google_map_url: null,
  booking_url: null, languages: ["en"], images: ["a.jpg"],
};

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";

describe("mapPlaceRow", () => {
  it("maps row and coerces images to array", () => {
    const p = mapPlaceRow(row as never);
    expect(p.shortDescription).toBe("x");
    expect(p.images).toEqual(["a.jpg"]);
  });
});

describe("getPlaceBySlug", () => {
  it("returns null when not found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: null, error: null })
    );
    expect(await getPlaceBySlug("nope")).toBeNull();
  });
});
```

- [ ] **Step 12: Implement `services/products.ts` + `services/products.test.ts`** (same pattern)

`services/products.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { Product } from "./types";

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
};

const COLUMNS =
  "id,name,brand,slug,category,description,price,image,affiliate_url,where_to_buy,best_for,ingredients,rating,disclosure_required";

export function mapProductRow(row: ProductRow): Product {
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
  };
}

export async function listProducts(
  opts: { limit?: number } = {}
): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("is_published", true)
    .order("name", { ascending: true })
    .limit(opts.limit ?? 50);
  if (error) throw error;
  return (data as ProductRow[] | null)?.map(mapProductRow) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProductRow(data as ProductRow) : null;
}
```

`services/products.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { mapProductRow, getProductBySlug } from "./products";
import { fakeClient } from "./_fake-supabase";

const row = {
  id: "1", name: "Rice Toner", brand: "Beauty of Joseon", slug: "boj-rice-toner",
  category: "toner", description: "milky", price: "$17", image: null,
  affiliate_url: null, where_to_buy: null, best_for: "dull skin",
  ingredients: null, rating: 4.5, disclosure_required: true,
};

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { createClient } from "@/lib/supabase/server";

describe("mapProductRow", () => {
  it("maps affiliate + disclosure fields", () => {
    const p = mapProductRow(row as never);
    expect(p.disclosureRequired).toBe(true);
    expect(p.rating).toBe(4.5);
  });
});

describe("getProductBySlug", () => {
  it("returns mapped product when found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      fakeClient({ data: row, error: null })
    );
    expect((await getProductBySlug("boj-rice-toner"))?.brand).toBe(
      "Beauty of Joseon"
    );
  });
});
```

- [ ] **Step 13: Run the full suite**

Run: `npm run test`
Expected: PASS — slug (3) + posts (3) + places (2) + products (2).

- [ ] **Step 14: Typecheck + commit**

```bash
npm run typecheck
git add lib/slug.ts lib/slug.test.ts services
git commit -m "feat(services): typed data-access layer + slugify (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Auth allowlist + `/admin` shell, login, logout

**Files:**
- Create: `lib/auth.ts`, `lib/auth.test.ts`, `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/login/page.tsx`, `app/admin/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`; env `ADMIN_EMAILS`.
- Produces:
  - `parseAdminEmails(raw: string | undefined): string[]` — `lib/auth.ts`
  - `isAllowedAdmin(email: string | null | undefined, raw?: string): boolean` — `lib/auth.ts`
  - server actions `signIn(formData: FormData)`, `signOut()` — `app/admin/actions.ts`

- [ ] **Step 1: Write the failing test for the allowlist**

`lib/auth.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseAdminEmails, isAllowedAdmin } from "./auth";

describe("parseAdminEmails", () => {
  it("splits, trims, lowercases, drops blanks", () => {
    expect(parseAdminEmails(" A@x.com, b@Y.com ,")).toEqual([
      "a@x.com",
      "b@y.com",
    ]);
  });
  it("returns [] for undefined", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
  });
});

describe("isAllowedAdmin", () => {
  it("is true for a listed email (case-insensitive)", () => {
    expect(isAllowedAdmin("A@x.com", "a@x.com,b@y.com")).toBe(true);
  });
  it("is false for an unlisted email", () => {
    expect(isAllowedAdmin("c@z.com", "a@x.com")).toBe(false);
  });
  it("is false for null", () => {
    expect(isAllowedAdmin(null, "a@x.com")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -- auth`
Expected: FAIL — `lib/auth.ts` not found.

- [ ] **Step 3: Implement `lib/auth.ts`**

```ts
export function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdmin(
  email: string | null | undefined,
  raw: string | undefined = process.env.ADMIN_EMAILS
): boolean {
  if (!email) return false;
  return parseAdminEmails(raw).includes(email.trim().toLowerCase());
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm run test -- auth`
Expected: PASS (5 tests).

- [ ] **Step 5: Create the login server actions `app/admin/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/admin/login?error=invalid");
  }
  if (!isAllowedAdmin(email)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=forbidden");
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

- [ ] **Step 6: Create the login page `app/admin/login/page.tsx`**

```tsx
import { signIn } from "../actions";

export default function AdminLogin({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;
  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-serif text-3xl">Admin</h1>
      {error === "invalid" && (
        <p className="mt-4 text-sm text-red-600">Invalid email or password.</p>
      )}
      {error === "forbidden" && (
        <p className="mt-4 text-sm text-red-600">
          This account is not an authorized admin.
        </p>
      )}
      <form action={signIn} className="mt-6 space-y-4">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border border-soft-gray px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-md border border-soft-gray px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-2 text-white hover:bg-accent-hover"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 7: Create the gated admin layout `app/admin/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";
import { signOut } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The login route renders without the gate; everything else requires an
  // allowlisted admin. Middleware already redirects anon users, but we
  // re-check here so a logged-in non-admin can never see admin content.
  const allowed = isAllowedAdmin(user?.email);

  if (user && !allowed) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=forbidden");
  }

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
      <div className="px-6 py-8">{children}</div>
    </div>
  );
}
```

> **Implementer note:** `app/admin/login/page.tsx` lives *under* this layout, so the layout must not redirect away when there is no user (only when a logged-in user is non-admin). The anon→login redirect is handled by middleware (Task 3), which exempts `/admin/login`.

- [ ] **Step 8: Create the placeholder dashboard `app/admin/page.tsx`**

```tsx
export default function AdminDashboard() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      <p className="mt-2 text-text-muted">
        Posts, Places, Products, and Media management arrive in the CMS plan.
      </p>
    </div>
  );
}
```

- [ ] **Step 9: Verify build + manual auth smoke**

Run: `npm run typecheck && npm run build`
Expected: PASS.

Manual (requires provisioned project + seeded admin from Task 4):
- Visit `/admin` while logged out → redirected to `/admin/login`.
- Log in with the allowlisted admin → lands on `/admin` dashboard.
- Log in with a non-allowlisted (but valid) Supabase user → bounced to `/admin/login?error=forbidden`.

- [ ] **Step 10: Run the full suite + commit**

```bash
npm run test
git add lib/auth.ts lib/auth.test.ts app/admin
git commit -m "feat(admin): allowlist-gated /admin shell + login/logout (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push
```
Expected: all tests pass; pushed to `origin/main`.

---

## Definition of Done (Plan 1)

- New `adropofseoul` repo on GitHub with fresh history; app boots on `/`.
- Brand tokens + Cormorant/Inter fonts render.
- Supabase schema applied with RLS; types generated and committed.
- `services/` layer with passing unit tests (slug, posts, places, products, auth).
- `/admin` gated by Supabase Auth + email allowlist; login/logout works.
- `npm run typecheck`, `npm run build`, `npm run test` all green.

**Next:** Plan 2 — Public Editorial Site (written after this plan executes, so it reflects the real `services/` signatures above).
