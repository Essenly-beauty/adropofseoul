// The two Seongsu series guides, defined in code.
//
// These posts render richer than the CMS's sanitized-markdown pipeline allows
// (an embedded interactive map, per-stop cards with Google/Naver links, a
// working waitlist form), so they live here rather than in the `posts` table.
// They are still surfaced through the normal /articles route, the Stories index,
// the Guides category, and the sitemap via lib/seongsu/assets.ts.
//
// Prose is authored to the ADS "locals-know" voice. Every in-body link resolves
// (stop names → on-page card anchors, cross-links → the sibling guide). There is
// deliberately no framing that any single fashion company produced a staff guide.

import type { CourseId } from "./courses";

export type SeriesNav = { label: string; href: string };

export type Guide = {
  slug: string;
  courseId: CourseId;
  episode: number;
  category: string; // post_category enum value
  title: string;
  subtitle: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  /** Relative to /public. Rendered only if the file exists; else a branded placeholder. */
  heroImage: string;
  heroAlt: string;
  heroCaption: string;
  /** Markdown rendered above the map. */
  intro: string;
  /** Markdown "The walk" — stop names link to #stop-<id> anchors. */
  walk: string;
  /** Optional markdown block between the stop cards and "Know before you go". */
  linkUp?: string;
  /** Markdown "Know before you go". */
  knowBeforeYouGo: string;
  showAlternates: boolean;
  showDetours: boolean;
  cta: { heading: string; body: string; button: string };
  seriesNav: SeriesNav;
  footnote: string;
};

const AUTHOR = "A Drop of Seoul Editorial";

export const GUIDES: Guide[] = [
  {
    slug: "seongsu-beauty-and-bites",
    courseId: 1,
    episode: 1,
    category: "guides",
    title: "Eat Like a Local in Seongsu: The Beauty-and-Bites Walk",
    subtitle:
      "Seoul's K-beauty flagships and the local tables the industry actually eats at — one walkable day, mapped in order.",
    seoTitle: "Seongsu Food & Beauty Walk: Where Locals Eat | A Drop of Seoul",
    metaDescription:
      "A walkable Seongsu guide pairing Seoul's K-beauty flagships with the local spots the industry actually eats at — tappable map, hours, and insider tips.",
    excerpt:
      "A walkable Seongsu day where the K-beauty flagships everyone flies in for sit on the same blocks as the pork-stew joints and bakeries the locals swear by — with a tappable map, hours, and honest tips.",
    author: AUTHOR,
    publishedAt: "2026-07-18",
    heroImage: "/images/seongsu/seongsu-beauty-and-bites.jpg",
    heroAlt:
      "A Seongsu street in Seoul where a glass-walled K-beauty flagship sits beside an old brick warehouse and a local eatery",
    heroCaption:
      "Seongsu, where the beauty flagships and the local kitchens share the same block.",
    intro: `Seongsu is where Korea's beauty and fashion industry actually works — and the food scene grew up to feed the people who spend their days here. We built this walk the way the locals move through the neighborhood: we cross-checked the spots the industry crowd passes around, then walked every block ourselves and kept only what held up.

Here's the part that makes Seongsu special: the K-beauty flagships everyone flies in for — Olive Young's flagship, Amore, Tamburins, Nonfiction — sit on the *same blocks* as the little pork-stew joints and bakeries the locals swear by. You can build your own lipstick, walk five minutes, eat where the fashion set eats, then grab a bag of salt bread on the way to the next flagship. This is that walk.

Everything below is within about a ten-minute walk of Seongsu Station, Exits 3 and 4.

## First, why Seongsu?

Seongsu was a factory-and-warehouse district that never quite tore its old bones down. Car repair shops and print works still share the street with glass-walled beauty stores, and that friction — raw industrial texture against polished flagships — is exactly why it became Seoul's beauty-and-fashion epicenter. People call it the Brooklyn of Seoul. What that shorthand misses is that Seongsu is where the Korean beauty industry actually *lives* now, and the food scene grew up to feed the people who work here.`,
    walk: `## The walk

**Start with scent.** [Nonfiction](#stop-nonfiction) is the gentlest introduction to Seongsu's perfume houses — clean, minimalist, and, by every account we read, staffed by people who'll happily talk you through each fragrance in fluent English. It's the rare flagship where you won't feel rushed or lost. A two-minute stroll away, [Tamburins](#stop-tamburins) is the opposite energy: a raw industrial shell that opens into a dramatic, scented cavern built around a giant diffuser. There's often a short line to get in, prices are steep, and it's worth walking through even if you buy nothing. Go for the space as much as the perfume.

**Then lunch, the local way.** [Somunnan Gamjatang](#stop-somunnan) is the canteen for the neighborhood's working crowd — deep, spicy pork-bone stew with meat that slides off the bone, generous portions, and a kitchen used to moving fast. It's open 24 hours and costs about ten dollars. One honest heads-up regulars will give you: the aroma clings to your clothes, so it's a smarter mid-walk stop than a pre-shopping one. (Not in the mood for something that hearty? Swap in [MiDoin](#stop-midoin) a couple doors over for a tidy Japanese-style steak bowl at a similar price.)

**Now the haul.** The [Olive Young N flagship](#stop-olive-young) plays more like a beauty theme park than a drugstore — floors of testers, hands-on skin-analysis stations, and a tax refund processed right at the register (bring your actual passport). If you want the skin analysis, know that slots cap out fast and locals line up before opening. Otherwise, just graze.

**A snack you carry.** [Jayeondo](#stop-jayeondo) sells exactly one thing — a savory salt bread — and draws a line for it anyway. Order and pay at the kiosk, collect your bag, and eat it warm while it's crisp on the outside and molten-buttery in the middle. It even holds up the next day, if any survives.

**One more flagship, then a drink.** [Amore Seongsu](#stop-amore) is the stop to slow down for: you can shade-match a custom foundation or build your own lipstick with staff who genuinely don't push. Budget real time for it — and note it's closed Mondays. When the shops shut, walk south to [Zodiac](#stop-zodiac), a tiny, near-perfect cocktail bar where every signature is themed to a star sign. Order yours and call it a day.`,
    knowBeforeYouGo: `## Know before you go

- **Dodge the crush.** Seongsu's popular spots run on wait-list apps and queues. Aim to arrive off-peak — before noon and before 6 p.m. — and you'll move a lot faster.
- **Mondays:** Amore Seongsu is closed. Everything else on this route runs daily.
- **Cards work everywhere,** and several places (Olive Young, Jayeondo) use kiosks or tablets, so you barely need to speak.
- **Passport = savings.** Foreign visitors get tax refunds at the beauty flagships; keep your passport on you.`,
    showAlternates: true,
    showDetours: true,
    cta: {
      heading: "Planning a Seongsu day of your own?",
      body: "We're building small-group Seongsu guides that run exactly this kind of route — beauty flagships and local tables, no tourist traps.",
      button: "Join the waitlist",
    },
    seriesNav: {
      label:
        "Next in the series: Seongsu's Warehouse District — a café-and-dessert crawl",
      href: "/articles/seongsu-warehouse-cafes",
    },
    footnote:
      "Hours and closing days were checked against Google at time of writing; confirm on each shop's Instagram before you go.",
  },
  {
    slug: "seongsu-warehouse-cafes",
    courseId: 2,
    episode: 2,
    category: "guides",
    title: "Seongsu's Warehouse District: A Café-and-Dessert Crawl",
    subtitle:
      "The old warehouses just east of the beauty mile are Seoul's most photogenic cafés now. A short crawl — burger, warehouse coffee, the famous French toast — with a map.",
    seoTitle: "Seongsu Cafés: A Warehouse & Dessert Crawl | A Drop of Seoul",
    metaDescription:
      "Seongsu's old warehouses became Seoul's most photogenic cafés. A short east-side crawl — burger, warehouse coffee, the famous French toast — with a map.",
    excerpt:
      "The slower, shorter cousin to our beauty-and-bites walk: a burger lunch, a coffee in a room the size of a cathedral, the French toast people cross the city for, and a concept building to browse — four stops, under a kilometer.",
    author: AUTHOR,
    publishedAt: "2026-07-18",
    heroImage: "/images/seongsu/seongsu-warehouse-cafes.jpg",
    heroAlt:
      "The soaring interior of a converted warehouse café in Seongsu, Seoul, with exposed brick, tall windows, and afternoon light",
    heroCaption:
      "East of the beauty mile, the old warehouses are cafés now — this is the crawl.",
    intro: `Walk ten minutes east of Seongsu's beauty mile and the neighborhood changes character. The flagships thin out, the streets get quieter, and the old warehouses — the ones that gave the district its industrial bones — take over. Most of them are cafés now, and they're the reason half of Seoul's Instagram feed looks the way it does.

This is the slower, shorter cousin to our [beauty-and-bites walk](/articles/seongsu-beauty-and-bites): a burger lunch, a coffee in a room the size of a cathedral, the French toast people cross the city for, and a concept building to browse before the light goes. Four stops, under a kilometer, no rush.`,
    walk: `## The walk

**Lunch first.** [bd Burger](#stop-bd-burger) is the one spot that showed up on every single Seongsu list we cross-checked — the date-course videos, the local food guides, all of it. That kind of consensus is rare, and it earns the burger. Get the wasabi shrimp; don't skip the eggplant fries. It's on the second floor (easy to walk past), and you pay right at your table.

**Then the cathedral.** One block over, [Daelim Changgo](#stop-daelim) is the warehouse café that started the whole aesthetic — soaring ceilings, exposed brick, beans roasting in the corner, and afternoon light pouring through enormous old windows. We'll be straight with you, because locals are: the coffee and pastries are average and not cheap, and the music runs loud. You're paying for the room, and the room is genuinely worth it. Come for the space, take your photos, keep your coffee expectations modest.

**Now dessert — but read this first.** [Standard Bread](#stop-standard-bread) is the anchor of the east side, and its crème brûlée French toast is the thing people talk about. It runs on an online wait-list, which is actually good news: put your name down, then spend the wait wandering next door. Which brings us to the last stop.

**End at the concept building.** [LCDC Seoul](#stop-lcdc) is a single building stacked with small independent shops, rotating art shows, and a calm little café called Ephemera for when your feet give out. It's the perfect place to kill time while Standard Bread texts you — browse a few floors, then double back for your table. Paid valet is available, and shoppers get an hour of free parking.`,
    linkUp: `## The two courses link up

Here's a trick the map makes obvious: this crawl and the [beauty-and-bites walk](/articles/seongsu-beauty-and-bites) aren't really separate. bd Burger and Daelim sit just east of where the first route ends, and Zodiac — the cocktail bar that closes out Course 1 — is right between them. Do the beauty mile in the morning and afternoon, drift east for coffee and dessert, and you've got one full Seongsu day without ever getting in a cab.`,
    knowBeforeYouGo: `## Know before you go

- **Wait-lists are your friend.** Standard Bread's online list lets you shop instead of stand in place. Use it.
- **Open daily.** All four stops run every day; café hours are roughly late morning to early evening.
- **Photos everywhere, but be kind** — these are working cafés, not sets. A quick shot, then let people have their tables.
- **Cash isn't needed;** cards and counter-service ordering are the norm.`,
    showAlternates: false,
    showDetours: false,
    cta: {
      heading: "Want someone to time all of this for you?",
      body: "Wait-lists, walking order, the good tables — we're building small-group Seongsu guides that run exactly these routes.",
      button: "Join the waitlist",
    },
    seriesNav: {
      label:
        "Start of the series: Eat Like a Local in Seongsu — the beauty-and-bites walk",
      href: "/articles/seongsu-beauty-and-bites",
    },
    footnote:
      "Hours were checked against Google at time of writing; confirm on each spot's Instagram before you go.",
  },
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function isGuideSlug(slug: string): boolean {
  return GUIDE_SLUGS.includes(slug);
}
