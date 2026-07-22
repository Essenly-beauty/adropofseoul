# Phase 0: Admin-Claim RLS + Legal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make opening Google SSO safe: replace every "any authenticated session may write/read-PII" RLS policy with an `app_metadata.role = 'admin'` claim gate, ship the tooling to stamp and verify the claim, and expand the legal pages (privacy rewrite + new terms) that member features and Google OAuth review require.

**Architecture:** One migration swaps 8 policies across 6 tables onto a shared `public.is_admin()` SQL function reading `auth.jwt() -> 'app_metadata' ->> 'role'` (`app_metadata` is server-controlled — users cannot edit it, unlike `user_metadata`). Two operational scripts follow the existing `scripts/*.mjs` idiom: one stamps the claim on admin users via the service role, one proves the lockdown by creating a throwaway non-admin user and attempting the newly-forbidden operations. Legal pages are static JSX in the existing editorial style. Live DB apply is a gated controller step with a strict order: **stamp claim → push migration → admins re-login → verify**.

**Tech Stack:** Supabase migrations (SQL), `@supabase/supabase-js` admin API (existing dep), Next.js static pages, Vitest.

## Global Constraints

- No new npm dependencies.
- App-layer admin guards (`ADMIN_EMAILS` + middleware + `requireAdmin`) stay untouched — the claim is defense in depth, not a replacement.
- Policy names must not change (drop + recreate under the same name): `posts_admin_all`, `places_admin_all`, `products_admin_all`, `media_admin_all`, `newsletter_admin_read` (0002_rls.sql), `waitlist_admin_read` (0006_waitlist.sql), `ingredients_admin_all`, `product_ingredients_admin_all` (20260712044543_ingredients.sql). Public-insert policies are NOT touched. AMENDED during review: the 5 public-READ policies ARE recreated as `to anon, authenticated` (same using-clauses) — original `to anon`-only scoping would have blanked the site for signed-in non-admin members once the permissive admin policies were claim-gated. Do not "fix" this back.
- Scripts follow the `scripts/seed-posts.mjs` conventions: header usage comment, `env()` helper that falls back to `.env.local`, plain Node ESM, no CLI framework.
- Legal pages: English, editorial page style (`max-w-3xl px-6 py-16`, serif h1, `text-text-muted` body), honest about current vs planned collection ("if you create an account…" phrasing for SSO/profile features not yet live). No boilerplate legalese walls — short clear sections.
- Test commands: `npx vitest run <file>`; full gate `npm test && npm run typecheck`.
- Branch: `feat/phase0-rls-legal` off main. Verify `git branch --show-current` before every commit (a concurrent session sometimes switches branches on this checkout).
- Live DB steps (Task 4) run only from the controller, in the stated order — the migration locks out any admin whose JWT lacks the claim, so the claim must be stamped first.

---

### Task 1: Admin-claim RLS migration

**Files:**

- Create: `supabase/migrations/20260721150000_admin_claim_rls.sql`

**Interfaces:**

- Produces: `public.is_admin()` SQL function used by all 8 recreated policies; Task 4 pushes this migration live.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260721150000_admin_claim_rls.sql`:

```sql
-- Until now every admin-scoped policy trusted any authenticated session,
-- because public signups were disabled ("authenticated" == admin). Google
-- SSO opens signup, so admin-ness moves to a server-controlled claim:
-- app_metadata.role = 'admin'. Users cannot modify their own app_metadata.
-- scripts/set-admin-role.mjs stamps the claim; admins must sign out and
-- back in afterward so a freshly issued JWT carries it.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- content tables: writes become admin-only
drop policy if exists posts_admin_all on posts;
create policy posts_admin_all on posts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists places_admin_all on places;
create policy places_admin_all on places
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists products_admin_all on products;
create policy products_admin_all on products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists media_admin_all on media;
create policy media_admin_all on media
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists ingredients_admin_all on ingredients;
create policy ingredients_admin_all on ingredients
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists product_ingredients_admin_all on product_ingredients;
create policy product_ingredients_admin_all on product_ingredients
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- subscriber PII: reads become admin-only
drop policy if exists newsletter_admin_read on newsletter_subscribers;
create policy newsletter_admin_read on newsletter_subscribers
  for select to authenticated
  using (public.is_admin());

drop policy if exists waitlist_admin_read on waitlist_subscribers;
create policy waitlist_admin_read on waitlist_subscribers
  for select to authenticated
  using (public.is_admin());
```

- [ ] **Step 2: Sanity checks (offline)**

Run: `grep -c "public.is_admin()" supabase/migrations/20260721150000_admin_claim_rls.sql`
Expected: `15` (1 definition + 14 policy references).
Run: `grep -c "drop policy if exists" supabase/migrations/20260721150000_admin_claim_rls.sql`
Expected: `8`.
Live apply is deliberately NOT part of this task (Task 4, gated).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260721150000_admin_claim_rls.sql
git commit -m "feat(security): admin-claim RLS — writes and PII reads require app_metadata.role=admin"
```

---

### Task 2: Claim tooling — `set-admin-role.mjs` + `verify-rls.mjs`

**Files:**

- Create: `scripts/set-admin-role.mjs`
- Create: `scripts/verify-rls.mjs`

**Interfaces:**

- Consumes: `.env.local` vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`.
- Produces: `node scripts/set-admin-role.mjs [emails…]` (exit 0 = all stamped) and `node scripts/verify-rls.mjs` (exit 0 = lockdown proven), both run live in Task 4.

- [ ] **Step 1: Write the claim-stamping script**

Create `scripts/set-admin-role.mjs`:

```js
// Stamps app_metadata.role = 'admin' on the given users so the admin-claim
// RLS policies (migration 20260721150000_admin_claim_rls) accept them.
// Usage: node scripts/set-admin-role.mjs [email …]
// With no args, uses the ADMIN_EMAILS env var (comma-separated).
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (reads
// .env.local automatically). Admins must sign out and back in afterward —
// the claim only lands in freshly issued JWTs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function env(key) {
  if (process.env[key]) return process.env[key];
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split(
    "\n"
  )) {
    if (line.startsWith(key + "="))
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^"|"$/g, "");
  }
  throw new Error("missing " + key);
}

const emails = process.argv.slice(2).length
  ? process.argv.slice(2)
  : env("ADMIN_EMAILS")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

if (!emails.length) {
  console.error("no emails given and ADMIN_EMAILS is empty");
  process.exit(2);
}

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY")
);

const { data, error } = await supabase.auth.admin.listUsers({
  perPage: 1000,
});
if (error) throw error;

let failed = false;
for (const email of emails) {
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    console.error(`NOT FOUND: ${email}`);
    failed = true;
    continue;
  }
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { app_metadata: { ...user.app_metadata, role: "admin" } }
  );
  if (updateError) {
    console.error(`FAILED: ${email} — ${updateError.message}`);
    failed = true;
    continue;
  }
  console.log(`OK: ${email} (${user.id}) app_metadata.role=admin`);
}
console.log(
  failed
    ? "done with failures"
    : "done — stamped admins must sign out/in to refresh their JWT"
);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Write the lockdown-verification script**

Create `scripts/verify-rls.mjs`:

```js
// Proves the admin-claim RLS lockdown: creates a throwaway NON-admin user
// with the service role, signs in as them with the anon key, and checks
// that they can read published content but cannot write content tables or
// read subscriber emails. Deletes the throwaway user afterward.
// Usage: node scripts/verify-rls.mjs
// Run AFTER the 20260721150000_admin_claim_rls migration is applied.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function env(key) {
  if (process.env[key]) return process.env[key];
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split(
    "\n"
  )) {
    if (line.startsWith(key + "="))
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^"|"$/g, "");
  }
  throw new Error("missing " + key);
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const admin = createClient(url, env("SUPABASE_SERVICE_ROLE_KEY"));

const suffix = Math.random().toString(36).slice(2, 10);
const email = `rls-probe-${suffix}@example.com`;
const password = `Probe-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const { data: created, error: createError } = await admin.auth.admin.createUser(
  {
    email,
    password,
    email_confirm: true,
  }
);
if (createError) throw createError;

const results = [];
function check(name, ok, detail) {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

try {
  const probe = createClient(url, env("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const { error: signInError } = await probe.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  // Published content must stay readable to everyone.
  const { data: places, error: readError } = await probe
    .from("places")
    .select("id, slug")
    .limit(1);
  check("published places readable", !readError, readError?.message);

  // UPDATE against a using-clause that denies the row updates 0 rows.
  const target = places?.[0];
  if (target) {
    const { data: updated, error: updateError } = await probe
      .from("places")
      .update({ name: "rls-probe-was-here" })
      .eq("id", target.id)
      .select();
    check(
      "places update blocked",
      !updateError && (updated ?? []).length === 0,
      updateError?.message ?? `updated ${updated?.length ?? 0} rows`
    );
  } else {
    check("places update blocked", false, "no published place to probe");
  }

  // INSERT trips the with-check clause and must error.
  const { error: insertError } = await probe.from("places").insert({
    name: "rls probe",
    slug: `rls-probe-${suffix}`,
    category: "cafe",
  });
  check("places insert blocked", Boolean(insertError), insertError?.message);

  // Subscriber PII must not be readable by a non-admin session.
  const { data: subs, error: subsError } = await probe
    .from("newsletter_subscribers")
    .select("email")
    .limit(1);
  check(
    "subscriber emails hidden",
    !subsError && (subs ?? []).length === 0,
    subsError?.message ?? `read ${subs?.length ?? 0} rows`
  );
} finally {
  await admin.auth.admin.deleteUser(created.user.id);
}

const allPass = results.every(Boolean);
console.log(allPass ? "RLS VERIFY: ALL PASS" : "RLS VERIFY: FAILURES");
process.exit(allPass ? 0 : 1);
```

- [ ] **Step 3: Offline sanity check**

Run: `node --check scripts/set-admin-role.mjs && node --check scripts/verify-rls.mjs && echo SYNTAX_OK`
Expected: `SYNTAX_OK`. (Both scripts hit the live project — do NOT execute them in this task.)

- [ ] **Step 4: Commit**

```bash
git add scripts/set-admin-role.mjs scripts/verify-rls.mjs
git commit -m "feat(security): admin-claim stamping + RLS lockdown verification scripts"
```

---

### Task 3: Privacy rewrite + Terms page + footer/sitemap wiring

**Files:**

- Modify: `app/privacy/page.tsx` (full rewrite)
- Create: `app/terms/page.tsx`
- Modify: `components/editorial/SiteFooter.tsx` (MORE list: add Terms)
- Modify: `components/editorial/SiteFooter.test.tsx` (assert the Terms link)
- Modify: `app/sitemap.ts` (add `/terms` next to `/privacy`)

- [ ] **Step 1: Update the footer test first (TDD for the wiring)**

In `components/editorial/SiteFooter.test.tsx`, inside the existing `"renders curated column links and copyright"` test, add after the Privacy Policy assertion:

```tsx
expect(
  screen.getByRole("link", { name: "Terms of Use" }).getAttribute("href")
).toBe("/terms");
```

Run: `npx vitest run components/editorial/SiteFooter.test.tsx`
Expected: FAIL — no "Terms of Use" link yet.

- [ ] **Step 2: Add the footer link**

In `components/editorial/SiteFooter.tsx`, extend `MORE`:

```tsx
const MORE = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
];
```

Run: `npx vitest run components/editorial/SiteFooter.test.tsx`
Expected: PASS.

- [ ] **Step 3: Rewrite the privacy page**

Replace the body of `app/privacy/page.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE_NAME}.`,
  alternates: { canonical: canonical("/privacy") },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-muted">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-text-muted">
        Last updated: July 21, 2026
      </p>

      <Section title="What we collect">
        <p>
          <span className="font-medium text-text">
            Newsletter and waitlist:
          </span>{" "}
          when you subscribe, we store the email address you submit. We use it
          only to send the updates you asked for, and you can unsubscribe at any
          time.
        </p>
        <p>
          <span className="font-medium text-text">
            Accounts (when available):
          </span>{" "}
          if you create an account by signing in with Google, we receive your
          name, email address, and profile photo from Google. Features tied to
          your account — such as saved places or an optional beauty profile
          (skin and hair preferences you choose to share) — are stored so we can
          show them back to you and improve recommendations. The beauty profile
          is always optional and can be edited or cleared.
        </p>
        <p>
          <span className="font-medium text-text">Messages:</span> if you
          contact us, we keep the message so we can reply.
        </p>
      </Section>

      <Section title="What we don't do">
        <p>
          We do not sell personal data. We do not republish other people's
          reviews or private content. We collect nothing beyond what the
          features above need.
        </p>
      </Section>

      <Section title="Cookies, analytics, and ads">
        <p>
          We may use privacy-respecting analytics to understand which pages are
          useful. If we show ads (such as Google AdSense) in the future, the ad
          provider may set cookies to serve and measure ads; where required, we
          will ask for your consent first.
        </p>
      </Section>

      <Section title="Affiliate links">
        <p>
          Some articles contain affiliate links. Purchases made through them may
          earn us a commission at no extra cost to you. This never affects what
          we recommend.
        </p>
      </Section>

      <Section title="Where your data lives">
        <p>
          Data is processed by our infrastructure providers: Supabase (database
          and authentication) and Vercel (hosting). Sign-in, when available, is
          provided by Google. Each processes data on our behalf under their own
          security terms.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can unsubscribe from emails at any time, and you can ask us to
          delete your account data or anything else we hold about you —{" "}
          <Link href="/contact" className="text-accent hover:text-accent-hover">
            contact us
          </Link>{" "}
          and we will handle it promptly.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes in a meaningful way, we will update this page
          and the date above.
        </p>
      </Section>
    </main>
  );
}
```

- [ ] **Step 4: Create the terms page**

Create `app/terms/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms of use for ${SITE_NAME}.`,
  alternates: { canonical: canonical("/terms") },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-muted">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Terms of Use</h1>
      <p className="mt-3 text-sm text-text-muted">
        Last updated: July 21, 2026
      </p>

      <Section title="Using this site">
        <p>
          {SITE_NAME} is an editorial guide to Korean beauty, wellness, and
          places in Seoul. By using the site you agree to these terms. If you
          create an account (when available), you are responsible for the
          activity on it.
        </p>
      </Section>

      <Section title="Not professional advice">
        <p>
          Articles about skincare, treatments, clinics, and ingredients are
          editorial information, not medical, dermatological, or professional
          advice. Treatments carry real risks that depend on your skin, health
          history, and the practitioner. Always consult a qualified professional
          before making decisions about procedures or products.
        </p>
      </Section>

      <Section title="Places and prices change">
        <p>
          We curate carefully, but shops move, menus change, and prices drift.
          Details were accurate when written; verify anything important — hours,
          prices, bookings — with the venue directly. We are not responsible for
          your experience with third-party venues or services.
        </p>
      </Section>

      <Section title="Affiliate links">
        <p>
          Some links are affiliate links. They may earn us a commission at no
          extra cost to you and never change our editorial judgment.
        </p>
      </Section>

      <Section title="Our content">
        <p>
          The writing, curation, and images we publish belong to {SITE_NAME}{" "}
          unless credited otherwise. You are welcome to share links; please do
          not republish substantial portions without permission.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          The site is provided as-is. To the extent permitted by law, we are not
          liable for indirect damages arising from use of the site or reliance
          on its content.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Anything unclear?{" "}
          <Link href="/contact" className="text-accent hover:text-accent-hover">
            Contact us
          </Link>
          .
        </p>
      </Section>
    </main>
  );
}
```

- [ ] **Step 5: Add `/terms` to the sitemap**

In `app/sitemap.ts`, in the static-routes list where `"/privacy"` appears (line ~25), add `"/terms"` on the next line.

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck`
Expected: all tests pass (footer test now includes Terms), tsc clean.

- [ ] **Step 7: Commit**

```bash
git add app/privacy/page.tsx app/terms/page.tsx components/editorial/SiteFooter.tsx components/editorial/SiteFooter.test.tsx app/sitemap.ts
git commit -m "feat(legal): privacy rewrite for accounts/ads + terms of use page"
```

---

### Task 4: Live apply (GATED — controller only, strict order)

No files. Run from the repo root, in this order, stopping on any failure:

- [ ] **Step 1:** `node scripts/set-admin-role.mjs` — stamps `ADMIN_EMAILS` accounts. Must print `OK:` for every admin BEFORE the migration goes live (the new policies lock out unstamped admins).
- [ ] **Step 2:** `npm run db:push` — applies `20260721150000_admin_claim_rls.sql`. Needs Supabase CLI auth; if it fails with an auth/link error, hand the migration to the user to run via the Supabase dashboard SQL editor instead.
- [ ] **Step 3:** `node scripts/verify-rls.mjs` — must print `RLS VERIFY: ALL PASS`.
- [ ] **Step 4:** Tell the admin (user) to sign out and back in on the admin panel — the claim only lands in freshly issued JWTs — then confirm an admin edit still works (manual smoke, user-run).
