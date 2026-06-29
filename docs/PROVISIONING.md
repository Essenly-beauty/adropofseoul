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
