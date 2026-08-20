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

For production verification, set `GOOGLE_SITE_VERIFICATION` to the Search
Console meta-token value and `GOOGLE_ADSENSE_ACCOUNT` to the `ca-pub-...`
account shown by AdSense. The app emits verification meta tags only when these
values are present and serves the matching Google seller declaration at
`/ads.txt`; it does not load ad units on hidden directory pages.

See `docs/PROVISIONING.md` for Supabase project setup and schema application.
