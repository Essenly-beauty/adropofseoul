// Code-defined "pillar" (hub) articles — prose guides rendered through the same
// /articles/[slug] route as the Seongsu guides, but with a plain prose layout
// (no map / stop cards). They carry a `region` so they surface in the right
// Around Seoul tab, and `pinned` to sort them to the top.
//
// Why code-defined: published articles live in Supabase and can't be written
// from this environment, and this hub predates any per-neighborhood spoke.
//
// Internal links point only at articles that actually exist. Future spokes to
// wire up when their articles ship (keep them plain text until then):
//   Hannam, Gangnam (Apgujeong/Cheongdam), Yeonnam & Hongdae,
//   Jongno & Bukchon, Myeongdong, Euljiro & Ikseon-dong.
// The 30-second anchors below match the slugified `##` headings in `body`.

export type Pillar = {
  slug: string;
  category: string;
  region: string;
  pinned: boolean;
  title: string;
  /** Dek shown under the H1. */
  dek: string;
  seoTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  author: string;
  seriesLabel: string;
  areaTag: string;
  publishedAt: string;
  excerpt: string;
  heroImage: string;
  heroAlt: string;
  heroCaption: string;
  /** Markdown body (rendered with heading anchors). */
  body: string;
  cta: { heading: string; body: string; button: string };
  seriesLinks: { label: string; href: string }[];
};

const SEOUL_NEIGHBORHOODS_BODY = `*Where you spend your hours in Seoul matters more than what you cross off a list. Start here, then go deeper.*

Most Seoul guides hand you a checklist — a tower, a palace, a market, done. But Seoul doesn't really work like a list of attractions. It works like a collection of small cities pressed together, each with its own tempo, its own crowd, its own reason to exist. Spend an afternoon in the wrong one for what you actually want, and you'll leave thinking Seoul is either too polished or too chaotic. Spend it in the right one, and it clicks.

So instead of telling you what to *see*, this guide helps you decide *where to be* — based on what you're in the mood for. And because it's us, we've kept one thread most guides skip: the beauty angle. Seoul is arguably the beauty capital of the world, and every neighborhood plays a different role in that story.

## The 30-second version

Match your mood, then jump to that section.

- **Trending right now — popups, design cafés, photos** → [Seongsu](#seongsu-the-trend-engine)
- **Quiet luxury, art, good taste** → [Hannam](#hannam-quiet-luxury)
- **Serious shopping + beauty clinics** → [Gangnam — Apgujeong & Cheongdam](#gangnam-apgujeong-cheongdam)
- **Young energy, cheap eats, a fun night** → [Yeonnam & Hongdae](#yeonnam-hongdae-young-seoul)
- **History, hanok houses, traditional Seoul** → [Jongno & Bukchon](#jongno-bukchon-old-seoul)
- **K-beauty shopping until the suitcase won't close** → [Myeongdong](#myeongdong-the-k-beauty-bazaar)
- **The hidden, moody, local side** → [Euljiro & Ikseon-dong](#euljiro-ikseon-dong-the-local-secret)

## Seongsu — the trend engine

Seongsu is where Seoul decides what's cool next. Old brick warehouses reborn as concept cafés, flagship stores that look like galleries, and — the real draw — **brand popups**, a rotating dozen of them every weekend, half of them free to walk through and all designed to be photographed.

**Best for:** trend-chasers and content people who want the current Seoul, not the postcard one.

**The beauty angle:** this is where K-beauty brands *launch*. It's the best neighborhood in the city to stumble into a skincare or makeup popup.

We've already mapped two full Seongsu walks, so we won't repeat them here: the [beauty-and-bites mile](/articles/seongsu-beauty-and-bites) and the [warehouse café-and-dessert crawl](/articles/seongsu-warehouse-cafes). Do them back to back and you've got a full day without a cab.

## Hannam — quiet luxury

If Seongsu shouts, Hannam whispers. Draped on a hillside near the river, it's where old money, embassies, and Seoul's most discerning tastemakers overlap. Calmer pace, subtler storefronts, an understated and expensive kind of confidence.

**Best for:** travelers who'd rather have one perfect meal and one great gallery than ten stops.

**The beauty angle:** the boutiques here lean *curated* — niche fragrance, artisanal skincare, the editing you'd trust from someone with genuinely good taste.

**Don't miss:** the Leeum Museum of Art — worth it for the architecture alone.

## Gangnam — Apgujeong & Cheongdam

"Gangnam" means everything south of the river, but the part that matters to you is the Apgujeong–Cheongdam corridor: Seoul's luxury spine. Flagship department stores, designer boutiques, valet everywhere, nightlife that starts late.

**Best for:** dedicated shoppers and anyone treating themselves.

**The beauty angle:** this is the one you came for. Apgujeong–Cheongdam is Seoul's **skin-clinic and aesthetics belt** — the densest cluster of dermatology and cosmetic practices in the country, many used to international visitors. We'll be straight with you, because it matters: a treatment is a real medical decision, not a souvenir. Research properly and choose a licensed, reputable clinic — don't just walk into the nearest sign.

**Don't miss:** the department-store food halls in the basement. World-class.

## Yeonnam & Hongdae — young Seoul

West of center, Seoul at full volume and full youth. Hongdae is the university heart — buskers, indie music, late-night everything, prices that won't hurt. Yeonnam beside it is the grown-up cousin: a long green park (locals call it "Yeontral Park") lined with small restaurants and cafés.

**Best for:** first-timers, younger travelers, and anyone who wants energy and value over polish.

**The beauty angle:** youthful and cheap — great for everyday K-beauty and drugstore hauls (sheet masks by the armful make the best gifts).

**Don't miss:** an evening of busking on the Hongdae main streets, then a slow walk down Yeonnam's park.

## Jongno & Bukchon — old Seoul

This is the Seoul of 600 years ago, still standing. Jongno holds the grand palaces; Bukchon Hanok Village, tucked between two of them, is a living neighborhood of tile-roofed houses on quiet lanes. Insadong nearby sells tea and crafts; Gwangjang Market serves some of the city's best street food.

**Best for:** history lovers, first-timers who want the iconic Seoul, and anyone after those hanbok-in-a-palace photos.

**The beauty angle:** more cultural than commercial — but renting a *hanbok* for a palace stroll is the classic Seoul photo experience, with a whole ecosystem of shops around Bukchon to help you look the part.

**Don't miss:** Gyeongbokgung early, before the crowds — then get lost on Bukchon's back lanes. People live there, so keep your voice down.

## Myeongdong — the K-beauty bazaar

Let's be honest about what Myeongdong is: a dense, bright, slightly overwhelming grid of skincare and cosmetics stores stacked side by side, street food filling every gap. It's touristy and it knows it — and for one specific mission it's unbeatable.

**Best for:** the K-beauty shopping run.

**The beauty angle:** this *is* the angle. Every major Korean brand has a store here, staff often speak English, tax-free is easy, and you can compare a dozen brands in two blocks. Come with a list — or an empty bag and a plan.

**Don't miss:** the evening street-food stalls. Shop, then eat your way back to the subway.

## Euljiro & Ikseon-dong — the local secret

Two smaller pockets for when you want the Seoul that Seoulites actually brag about. **Euljiro** is a gritty daytime print-and-hardware district that turns into a maze of hidden bars after dark ("Hip-jiro," locals call it). **Ikseon-dong** is a tiny hanok neighborhood reborn as narrow alleys of cafés and boutiques — old bones, young energy.

**Best for:** return visitors, or anyone who wants to feel like they found something.

## Where should you actually stay?

The question that quietly makes or breaks a trip. Honest answer: it depends on you.

- **First time, want the icons** → **Jongno / Myeongdong.** Central, walkable to palaces, easy subway.
- **Here to shop and be pampered** → **Gangnam (Apgujeong/Cheongdam).** Steps from the luxury and the clinics.
- **Younger, social, budget-aware** → **Hongdae / Yeonnam.** Nightlife at the door, great value.
- **Want calm and good taste** → **Hannam / Itaewon.** Quieter, refined, still connected.
- **Here for trends and content** → **Seongsu.** In the middle of the action.

One geography tip that saves real subway time: the Han River splits the city. The **north side** (Jongno, Bukchon, Myeongdong, Hongdae, Seongsu) holds most of the history and youth culture; the **south side** (Gangnam, Apgujeong, Cheongdam) holds most of the luxury and clinics. Group your days by side of the river instead of zig-zagging across it.

## Know before you go

- **Pick a theme per day, not a checklist.** A "history day" in Jongno feels nothing like a "trend day" in Seongsu — keep them separate and each one gets to be its best.
- **Two or three neighborhoods beats ten.** You'll learn more about Seoul, and enjoy it more.
- **Mind the river.** Cluster north-side days and south-side days; don't cross it twice a day.
- **Beauty clinics are a medical decision.** If Gangnam's on your list, research and book a licensed, reputable clinic in advance — don't wing it on arrival.`;

export const PILLARS: Pillar[] = [
  {
    slug: "seoul-neighborhoods-guide",
    category: "guides",
    region: "common",
    pinned: true,
    title:
      "Seoul by Neighborhood: How to Choose Where to Go (and Where to Stay)",
    dek: "Seoul isn't a checklist of sights — it's a stack of small cities, each with its own tempo. Here's how to pick the ones that match the trip you actually want.",
    seoTitle:
      "Seoul Neighborhoods: Where to Go & Where to Stay | A Drop of Seoul",
    metaDescription:
      "A local's guide to Seoul's neighborhoods — match your mood to the right area (trends, luxury, history, K-beauty) and figure out where to stay. Start here.",
    ogTitle:
      "Seoul by Neighborhood: How to Choose Where to Go (and Where to Stay)",
    ogDescription:
      "A local's guide to Seoul's neighborhoods — match your mood to the right area (trends, luxury, history, K-beauty) and figure out where to stay. Start here.",
    author: "A Drop of Seoul Editorial",
    seriesLabel: "Seoul Neighborhoods · Start here",
    areaTag: "Seoul",
    publishedAt: "2026-07-18",
    excerpt:
      "Seoul works like a collection of small cities, not a checklist. Match your mood — trends, luxury, history, K-beauty — to the right neighborhood, and figure out where to stay. The hub to start every Seoul trip.",
    heroImage: "/images/seoul/seoul-neighborhoods-guide.jpg",
    heroAlt:
      "A map-like collage of Seoul neighborhoods at dusk — warehouse cafés, palace rooftops, and neon shopping streets across the Han River",
    heroCaption:
      "Seoul is a stack of small cities — pick the ones that fit your trip.",
    body: SEOUL_NEIGHBORHOODS_BODY,
    cta: {
      heading: "Planning a Seoul trip?",
      body: "Want this turned into an actual day-by-day itinerary — beauty stops included, the ones that are hard to navigate from abroad? That's exactly what we're building.",
      button: "Join the waitlist",
    },
    seriesLinks: [
      {
        label: "Go deeper → Seongsu: the beauty-and-bites walk",
        href: "/articles/seongsu-beauty-and-bites",
      },
      {
        label: "Seongsu: the warehouse café crawl",
        href: "/articles/seongsu-warehouse-cafes",
      },
    ],
  },
];

export const PILLAR_SLUGS = PILLARS.map((p) => p.slug);

export function getPillar(slug: string): Pillar | undefined {
  return PILLARS.find((p) => p.slug === slug);
}

export function isPillarSlug(slug: string): boolean {
  return PILLAR_SLUGS.includes(slug);
}
