# Supabase Provisioning

1. Create a project at supabase.com. Copy the Project URL, anon key, service
   role key, and project ref into `.env.local` (and Vercel env later).
2. **Disable email signups:** Auth → Providers → Email → turn OFF "Allow new
   users to sign up". (Admin accounts are created manually; see step 5.)
3. Link the CLI: `npx supabase link --project-ref <ref>`.
4. Apply schema: `npm run db:push` (runs migrations 0001, 0002, 0003) then, to
   load sample content, paste `supabase/seed.sql` into the SQL Editor and run it.
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

## Editorial agents (Track 1+)

- **Migration 0003** (`research_runs`, `place_candidates`, post workflow
  fields) applies with the normal `npm run db:push`. After applying, regenerate
  types: `SUPABASE_PROJECT_ID=<ref> npm run db:types` and commit the result.
- **`AI_GATEWAY_API_KEY`** — create an API key under the Vercel team's
  AI Gateway settings and set it in `.env.local` and the Vercel project env.
  Agent features (`lib/agents/`, `services/agents/`) fail with a clear error
  when the key is absent; the rest of the site is unaffected.
- **`CRON_SECRET`** (Track 2) — random string in the Vercel project env; Vercel
  Cron sends it automatically as `Authorization: Bearer` to
  `/api/agents/research` (weekly schedule in `vercel.json`). Without it the
  route answers 401 to everyone, including the cron — set it before expecting
  scheduled runs. Manual runs from `/admin/candidates` do not need it.
- **`UNSPLASH_ACCESS_KEY` / `PEXELS_API_KEY`** (optional, Track 2 images) —
  enable the commercial-safe stock image pool during research runs. Either or
  both; a missing key silently skips that provider. Reality images found in
  sources are always stored as `license: unverified` — the editor must clear
  rights before publishing (attribution alone is not a license). Migration
  `0004` (image_candidates) applies with the normal `npm run db:push`.
- **Booking readiness (0005)** — `neighborhoods` table + places columns
  (name_kr, geo, price KRW range, booking_channel, deposit_policy,
  editorial_status sample/verified, last_verified_at) apply with the normal
  `npm run db:push`. See `docs/superpowers/specs/2026-07-17-booking-service-db-alignment.md`.
