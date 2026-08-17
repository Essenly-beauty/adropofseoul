import type { Metadata } from "next";
import Image from "next/image";
import { listPublishedPosts } from "@/services/posts";
import { listPlaces } from "@/services/places";
import { listProducts } from "@/services/products";
import { Hero } from "@/components/editorial/Hero";
import { FeaturedStory } from "@/components/editorial/FeaturedStory";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { CategoryIndex } from "@/components/editorial/CategoryIndex";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import { ProductCard } from "@/components/editorial/ProductCard";
import { NewsletterForm } from "@/components/editorial/NewsletterForm";
import { Reveal } from "@/components/editorial/Reveal";
import { Eyebrow } from "@/components/editorial/Eyebrow";
import { MySeoulDropLink } from "@/components/editorial/MySeoulDropLink";
import { canonical } from "@/lib/seo";
import { HOME_TITLE, TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: TAGLINE,
  alternates: { canonical: canonical("/") },
  openGraph: {
    title: HOME_TITLE,
    description: TAGLINE,
    url: canonical("/"),
    type: "website",
  },
};

// Regenerate public editorial data at most once every five minutes instead of
// blocking every visitor on three database queries.
export const revalidate = 300;

// Scrim for the closing band: dark enough at the edges to hold type at AA,
// thin across the middle so the dusk horizon still glows through. Built from
// brand ink (#1C1C1C) so the band stays inside the editorial palette.
const CLOSING_SCRIM =
  "linear-gradient(180deg, rgba(28,28,28,0.88) 0%, rgba(28,28,28,0.58) 40%, rgba(28,28,28,0.80) 100%)";

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
  const [posts, places, products] = await Promise.all([
    safe(listPublishedPosts({ limit: 7 }), "posts"),
    safe(listPlaces({ limit: 3 }), "places"),
    safe(listProducts({ limit: 4 }), "products"),
  ]);
  const [featured, ...latest] = posts;

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
            title="Find your way in"
            eyebrow="Explore"
            href="/stories"
          />
          <CategoryIndex />
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-porcelain/60">
          <div className="mx-auto max-w-content px-6 py-14 text-center md:py-20">
            <Eyebrow className="mb-4">My Beauty Profile</Eyebrow>
            <h2 className="mx-auto max-w-[24ch] font-serif text-3xl leading-tight md:text-4xl">
              Not sure what your skin and hair actually need?
            </h2>
            <p className="mx-auto mt-4 max-w-[48ch] text-text-muted">
              A short, private profile of your texture, tendencies, and ideal
              routine — guidance, not a diagnosis, and no signup to see it.
            </p>
            <a
              href="/beauty-profile"
              className="mt-6 inline-block rounded-full border border-text px-5 py-2.5 text-[11px] uppercase tracking-label text-text transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent hover:text-bg"
            >
              Discover My Beauty Profile →
            </a>
            <p className="mt-5 text-xs text-text-muted">
              Already have your result?{" "}
              <MySeoulDropLink
                source="home_beauty_profile"
                className="text-accent hover:text-accent-hover"
              >
                Keep building it in My Seoul Drop ↗
              </MySeoulDropLink>
            </p>
          </div>
        </section>
      </Reveal>

      {latest.length > 0 && (
        <Reveal>
          <section className="mx-auto max-w-content px-6 py-14 md:py-24">
            <SectionHeading
              title="Latest Stories"
              eyebrow="Journal"
              href="/stories"
            />
            <div className="grid gap-8 md:grid-cols-3">
              {latest.map((p) => (
                <ArticleCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {places.length > 0 && (
        <Reveal>
          <section className="bg-porcelain/60">
            <div className="mx-auto max-w-content px-6 py-14 md:py-24">
              <SectionHeading
                title="The Seoul Directory"
                eyebrow="On the map"
                href="/seoul/places"
              />
              <p className="-mt-2 mb-10 max-w-[52ch] text-text-muted">
                Places worth knowing — vetted studios, salons, and spaces with
                English-speaking staff and a calm room.
              </p>
              <div className="grid gap-8 md:grid-cols-3">
                {places.map((pl) => (
                  <PlaceCard key={pl.id} place={pl} />
                ))}
              </div>
              <div className="mt-10 border-t border-soft-gray pt-6 text-sm text-text-muted">
                Found somewhere you want to remember?{" "}
                <MySeoulDropLink
                  source="home_seoul_directory"
                  className="font-medium text-text underline decoration-accent/50 underline-offset-4 hover:text-accent"
                >
                  Build your saved Seoul list in My Seoul Drop ↗
                </MySeoulDropLink>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {products.length > 0 && (
        <Reveal>
          <section className="mx-auto max-w-content px-6 py-14 md:py-24">
            <SectionHeading
              title="Weekly Picks"
              eyebrow="The Shelf"
              href="/skincare/picks"
            />
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {products.map((pr) => (
                <ProductCard key={pr.id} product={pr} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* Closing band — the page's only dark surface, and the last thing with
          editorial weight before the porcelain SiteFooter (which layout.tsx
          appends on every route, so the dark treatment stops here rather than
          running to the page bottom). Object position parks the dusk horizon
          behind the headline; the scrim keeps it glowing under the type. */}
      <section className="relative overflow-hidden bg-text">
        <Image
          src="/images/seoul/seoul-skyline-dusk.avif"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="object-cover object-[center_38%]"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: CLOSING_SCRIM }}
        />
        <div className="relative mx-auto max-w-content px-6 py-24 text-center md:py-32">
          <Eyebrow className="mb-5">The List</Eyebrow>
          <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">
            Seoul, <em className="italic text-accent">a drop</em> at a time.
          </h2>
          <p className="mx-auto mt-4 max-w-[40ch] text-white/70">
            New stories, places, and picks — a few considered emails a month. No
            noise.
          </p>
          <NewsletterForm surface="dark" />
          <p className="mt-5 text-[11px] text-white/55">
            Join readers in 40+ countries. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </main>
  );
}
