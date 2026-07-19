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

## Before first real content — `next/image` remote hosts

`next.config.js` currently allow-lists only the Supabase Storage hostname for
`next/image`. Post/place/product images rendered from any OTHER host (brand
sites, affiliate CDNs, Instagram) will throw a runtime error ("hostname not
configured under images"). Before loading real content, decide the image story
and update `images.remotePatterns` accordingly:

- **Recommended:** upload/proxy all images through Supabase Storage (already
  allow-listed) so every `next/image` src shares one trusted host.
- Or add each known external CDN hostname to `remotePatterns`.
- Or set `images.unoptimized = true` to bypass the optimizer (loses
  optimization benefits).

Seed content uses no external image URLs, so this is latent until real data
lands — but it must be resolved before publishing posts/products with
off-Supabase images.

## When attaching a custom domain

The canonical site URL lives in TWO places that must be updated together:

1. **`app/layout.tsx` — `metadataBase`** is hardcoded to
   `https://adropofseoul.vercel.app`. Change it to the new domain. This is
   what turns relative OG paths (`/og.png`) into absolute `og:image` /
   `twitter:image` URLs.
2. **`NEXT_PUBLIC_SITE_URL` (Vercel env, Production)** — set to the new
   domain (no trailing slash). It drives `SITE_URL` in `lib/site.ts`, which
   feeds `canonical()` in `lib/seo.ts` (per-page canonical URLs, per-page
   `og:url`/`og:image`, JSON-LD), `app/sitemap.ts`, and `app/robots.ts`.
   If both aren't updated, canonical/sitemap URLs and OG URLs will point at
   different hosts.

Also:

- In Vercel domain settings, keep `adropofseoul.vercel.app` as a 308
  redirect to the new primary domain so old shared links and indexed pages
  carry over.
- **OG image cache:** link scrapers (Facebook, Kakao, X, LinkedIn) cache
  per-URL. The domain change alone gives the image a fresh URL, but when
  replacing `public/og.png` itself, rename the file (e.g. `og-v2.png`) and
  update the `OG_IMAGE` constant in `app/layout.tsx` — query-string versions
  are ignored by some scrapers. Force a re-scrape with the Facebook Sharing
  Debugger and Kakao 공유 디버거 (developers.kakao.com/tool/debugger/sharing).
- **Verify:** `npm run build && npx next start`, then check that
  `curl -s localhost:3000/ | grep og:image` shows the new domain, and that
  `/sitemap.xml` and `/robots.txt` use it too.
