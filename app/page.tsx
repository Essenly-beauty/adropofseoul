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
            href="/articles"
          />
          <CategoryIndex />
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

      {places.length > 0 && (
        <Reveal>
          <section className="bg-porcelain/60">
            <div className="mx-auto max-w-content px-6 py-14 md:py-24">
              <SectionHeading
                title="The Seoul Directory"
                eyebrow="On the map"
                href="/places"
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
              href="/picks"
            />
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {products.map((pr) => (
                <ProductCard key={pr.id} product={pr} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

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
