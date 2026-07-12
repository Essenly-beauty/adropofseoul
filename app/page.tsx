import { listPublishedPosts } from "@/services/posts";
import { Hero } from "@/components/editorial/Hero";
import { FeaturedStory } from "@/components/editorial/FeaturedStory";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { NewsletterForm } from "@/components/editorial/NewsletterForm";
import { Reveal } from "@/components/editorial/Reveal";
import { Eyebrow } from "@/components/editorial/Eyebrow";
import {
  DiscoveryPlaceCard,
  EditProductCard,
  GuideCard,
  NeighborhoodCard,
} from "@/components/editorial/DiscoveryCards";
import {
  GUIDES,
  NEIGHBORHOODS,
  PLACES,
  PLACE_TYPE_LABELS,
  PLACE_TYPE_ROUTES,
  PRODUCTS,
  type PlaceType,
} from "@/lib/discovery";

export const dynamic = "force-dynamic";

// The home page renders gracefully even if the data backend is unreachable:
// each fetch falls back to an empty list (logged), and the empty-state guards
// below hide those sections — so the editorial layout still stands on its own.
async function safe<T>(p: Promise<T[]>, label: string): Promise<T[]> {
  try {
    return await p;
  } catch (err) {
    console.error(`home: ${label} fetch failed`, err);
    return [];
  }
}

export default async function HomePage() {
  const [posts] = await Promise.all([
    safe(listPublishedPosts({ limit: 7 }), "posts"),
  ]);
  const [featured, ...latest] = posts;
  const placeFilters = [
    { label: "All", href: "/places" },
    ...Object.entries(PLACE_TYPE_ROUTES).map(([type, href]) => ({
      label: PLACE_TYPE_LABELS[type as PlaceType],
      href,
    })),
  ];

  return (
    <main>
      <Hero />

      {featured && (
        <Reveal>
          <section className="mx-auto max-w-content px-6 py-14 md:py-24">
            <SectionHeading title="Featured Story" eyebrow="This Week" />
            <FeaturedStory post={featured} />
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className="mx-auto max-w-content px-6 py-14 md:py-24">
          <SectionHeading
            title="Find Your Beauty Spot"
            eyebrow="Seoul Directory"
            href="/places"
          />
          <p className="-mt-2 mb-8 max-w-[52ch] text-text-muted">
            Explore carefully selected salons, head spas, clinics, and beauty
            stores across Seoul.
          </p>
          <nav className="mb-10 flex flex-wrap gap-3" aria-label="Place types">
            {placeFilters.map((filter) => (
              <a
                key={filter.href}
                href={filter.href}
                className="rounded-full border border-soft-gray px-4 py-2 text-xs uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
              >
                {filter.label}
              </a>
            ))}
          </nav>
          <div className="grid gap-8 md:grid-cols-3">
            {PLACES.slice(0, 6).map((place) => (
              <DiscoveryPlaceCard key={place.slug} place={place} />
            ))}
          </div>
          <a
            href="/places"
            className="mt-10 inline-block border-b border-accent pb-1 text-sm uppercase tracking-label text-accent"
          >
            View All Seoul Places
          </a>
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-porcelain/60">
          <div className="mx-auto max-w-content px-6 py-14 md:py-24">
            <SectionHeading
              title="Explore Seoul by Neighborhood"
              eyebrow="City guide"
              href="/seoul"
            />
            <p className="-mt-2 mb-10 max-w-[56ch] text-text-muted">
              Find the beauty places, rituals, and local favorites worth knowing
              in each part of the city.
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              {NEIGHBORHOODS.map((neighborhood) => (
                <NeighborhoodCard
                  key={neighborhood.slug}
                  neighborhood={neighborhood}
                />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto max-w-content px-6 py-14 md:py-24">
          <SectionHeading
            title="Featured Guides"
            eyebrow="Plan better"
            href="/guides"
          />
          <div className="grid gap-8 md:grid-cols-3">
            {GUIDES.slice(0, 3).map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </section>
      </Reveal>

      {latest.length > 0 && (
        <Reveal>
          <section className="mx-auto max-w-content px-6 py-14 md:py-24">
            <SectionHeading
              title="Latest Stories"
              eyebrow="Journal"
              href="/articles"
            />
            <div className="grid gap-8 md:grid-cols-3">
              {latest.map((p) => (
                <ArticleCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className="mx-auto max-w-content px-6 py-14 md:py-24">
          <SectionHeading
            title="The Edit"
            eyebrow="Products worth knowing"
            href="/the-edit"
          />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {PRODUCTS.map((product) => (
              <EditProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-porcelain/60">
          <div className="mx-auto max-w-content px-6 py-14 md:py-24">
            <Eyebrow className="mb-5">Editorial philosophy</Eyebrow>
            <h2 className="max-w-3xl font-serif text-4xl leading-tight md:text-5xl">
              More choices are not always better. Better choices are.
            </h2>
            <p className="mt-5 max-w-[58ch] leading-8 text-text-muted">
              Korea has thousands of beauty products, salons, treatments, and
              trends. A Drop of Seoul helps readers understand what is actually
              worth their time, who it suits, and what to verify before booking
              or buying.
            </p>
            <a
              href="/about"
              className="mt-8 inline-block border-b border-accent pb-1 text-sm uppercase tracking-label text-accent"
            >
              Read Our Standards
            </a>
          </div>
        </section>
      </Reveal>

      <section className="mt-10 border-t border-soft-gray">
        <div className="mx-auto max-w-content px-6 py-20 text-center md:py-28">
          <Eyebrow className="mb-5">The List</Eyebrow>
          <h2 className="font-serif text-4xl leading-tight md:text-5xl">
            Seoul, <em className="italic text-accent">a drop</em> at a time.
          </h2>
          <p className="mx-auto mt-4 max-w-[40ch] text-text-muted">
            New stories, places, and picks — a few considered emails a month. No
            noise.
          </p>
          <NewsletterForm />
          <p className="mt-5 text-[11px] text-text-muted/60">
            Join readers in 40+ countries. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </main>
  );
}
