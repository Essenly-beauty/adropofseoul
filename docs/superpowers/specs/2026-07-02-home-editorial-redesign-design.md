# A Drop of Seoul — Home & Shared Chrome Editorial Redesign

**Date:** 2026-07-02
**Status:** Approved (visual mockup) — pending implementation plan
**Reference mockup:** `scratchpad/adropofseoul-home.html` (published artifact `home-v1`)

## Intent

Elevate the homepage and shared chrome from a generic Tailwind baseline to a
premium editorial identity, matching the approved brand mood (Into The Gloss ·
Kinfolk · rhode · Monocle · Apple).

**Audience:** 20–40 year-old international readers interested in K-beauty, plus
travelers wanting Korean tourism / local experiences.

**Purpose:** Build a credible media platform — awareness, information, and
first-party data (newsletter) — that can later funnel into the Essenly cosmetics
brand. This makes _discovery_ (categories, guides, directory) and the
_newsletter_ strategic, not decorative.

**Chosen tone:** hybrid — the hero is quiet (rhode/Kinfolk); sections below grow
structured and editorial (Monocle/ITG) as you scroll.

## Design System (refinements — existing tokens stay)

Palette (unchanged): bg `#FAF8F4`, ink `#1C1C1C`, muted `rgba(28,28,28,0.60)`,
accent `#B78B62` / hover `#A2774F`, hairline `#E8E2DA`, blush `#E9D6CF`.
Add a `porcelain` `#F2EDE5` neutral for placeholder gradients + directory/footer
grounds.

- **Type:** Cormorant Garamond = display/headings (high-contrast editorial);
  Inter = body/UI/labels. Both already loaded via `next/font`.
- **Eyebrow/label:** Inter, ~11px, uppercase, `letter-spacing: 0.22em`, accent
  or faint ink. The Monocle/ITG signature — used on section kickers, card meta.
- **Hairlines:** 1px `hairline` rules for section tops, index rows, card meta,
  footer.
- **Radius:** move away from `rounded-lg` everywhere → crisp `2px` (`rounded-sm`)
  on image frames; pills (`999px`) only for buttons/tags.
- **Motion tokens:** add real `transitionDuration` values to
  `tailwind.config.ts` (`duration-medium` is currently referenced but undefined
  → a silent no-op). Apple-restrained: 280–500ms `ease-out`. Uses: image hover
  zoom, link underline reveal, color shift, scroll-reveal fade/translate.
  All motion gated by `prefers-reduced-motion`.
- **Image placeholders (no photography yet):** render image slots as intentional
  tonal blocks — a soft `blush → porcelain → hairline` gradient with a fine
  grain dot-texture and a small uppercase label (area/category). Looks
  deliberate now; swaps cleanly to `next/image` when photos land. Aspect ratios:
  featured 5:6, articles 3:2, places 4:5, products 1:1.

## Homepage Structure (`app/page.tsx`)

1. **Masthead hero** — quiet, centered. Kicker (`Seoul · Beauty & Ritual`), large
   Cormorant statement with one italic accent phrase, short lede, one pill CTA +
   one quiet text link, scroll cue. Generous vertical padding. Replaces the
   current two-button hero.
2. **Featured Story** — asymmetric two-column cover unit: portrait tonal frame +
   (tag · read-time · serif headline · excerpt · quiet read link). Uses the most
   recent published post.
3. **Explore by Category** — Monocle-style labeled index: hairline-separated rows
   (serif name + one-line descriptor + hover-revealed "Enter →"), replacing the
   bordered cards. Drives newcomer discovery.
4. **Latest Stories** — 3-col editorial grid; each card = tonal frame + eyebrow
   meta (category · read time) + serif title + excerpt.
5. **The Seoul Directory** — differentiated with a `porcelain` ground and a
   one-line intro; place cards emphasize area label + category (strategic for
   the tourism/local-experience audience).
6. **Weekly Picks** — minimal 4-col product strip: brand eyebrow, serif name,
   tabular price, quiet "Shop →".
7. **Newsletter** — replaces the pink box: hairline-topped quiet band, centered
   serif invitation, underline-style inline email input, trust fine-print
   (framed as joining an insider list — tasteful data capture).

Cards render gracefully with or without images (tonal placeholder fallback), and
sections that have no data stay conditionally hidden (as today).

## Shared Chrome

- **SiteHeader** — more breathing room, small-caps letter-spaced nav with an
  underline-reveal hover, thin bottom hairline, sticky blur. **Add a minimal
  mobile menu** (currently nav simply disappears below `md` — a real gap).
- **SiteFooter** — multi-column editorial footer: wordmark + tagline, "Explore"
  and "The Guide" link columns, base row (copyright · "Seoul · Worldwide").
- **Cards (ArticleCard, PlaceCard, ProductCard, CategoryCard)** — unify on the
  editorial treatment (eyebrow meta, serif title, tonal placeholder, crisp
  frame, restrained hover). These are reused across routes, so the refresh
  ripples site-wide for free.

## Component boundaries

- New primitives kept small and single-purpose: `Eyebrow`, `TonalFrame`
  (placeholder-or-image), `SectionHeading` (extend existing). Cards consume
  `TonalFrame` so image/placeholder logic lives in one place.
- `NewsletterForm` keeps its existing server-action wiring; only its markup/style
  changes (underline input variant).
- No route logic or data-layer changes — services and `Promise.all` fetching in
  `page.tsx` stay as-is.

## Scope

**In:** design-system refinements (tokens, motion, placeholder strategy),
`app/page.tsx` restructure, SiteHeader (+ mobile menu), SiteFooter, the four
editorial cards, NewsletterForm restyle, new `Eyebrow`/`TonalFrame` primitives.

**Out (this pass):** real content/photography, admin CMS, KR i18n, live ESP
integration, and full redesign of individual detail routes
(`articles/[slug]`, `places/[slug]`, category, listing pages) beyond what the
shared card/chrome refresh improves automatically.

## Testing

- Existing component tests (`ArticleCard`, `PlaceCard`, `ProductCard`,
  `SiteHeader`) must keep passing; update them for new markup where needed and
  add a placeholder-fallback test for `TonalFrame`.
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all green.
