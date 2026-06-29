import { listPublishedPosts } from "@/services/posts";
import { listPlaces } from "@/services/places";
import { listProducts } from "@/services/products";
import { CATEGORIES } from "@/lib/categories";
import { Hero } from "@/components/editorial/Hero";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { PlaceCard } from "@/components/editorial/PlaceCard";
import { ProductCard } from "@/components/editorial/ProductCard";
import { CategoryCard } from "@/components/editorial/CategoryCard";
import { NewsletterForm } from "@/components/editorial/NewsletterForm";

export default async function HomePage() {
  const [posts, places, products] = await Promise.all([
    listPublishedPosts({ limit: 7 }),
    listPlaces({ limit: 3 }),
    listProducts({ limit: 4 }),
  ]);
  const [featured, ...latest] = posts;

  return (
    <main>
      <Hero />

      {featured && (
        <section className="mx-auto max-w-content px-6">
          <SectionHeading title="Featured Story" eyebrow="This week" />
          <ArticleCard post={featured} />
        </section>
      )}

      <section className="mx-auto mt-20 max-w-content px-6">
        <SectionHeading title="Explore by Category" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="mx-auto mt-20 max-w-content px-6">
          <SectionHeading title="Latest Stories" href="/articles" />
          <div className="grid gap-8 md:grid-cols-3">
            {latest.map((p) => (
              <ArticleCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {places.length > 0 && (
        <section className="mx-auto mt-20 max-w-content px-6">
          <SectionHeading title="Seoul Directory" href="/places" />
          <div className="grid gap-8 md:grid-cols-3">
            {places.map((pl) => (
              <PlaceCard key={pl.id} place={pl} />
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="mx-auto mt-20 max-w-content px-6">
          <SectionHeading title="Weekly Picks" href="/picks" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((pr) => (
              <ProductCard key={pr.id} product={pr} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-20 max-w-content px-6">
        <div className="rounded-lg bg-muted-pink/40 p-8">
          <h2 className="font-serif text-3xl">Stay in the loop</h2>
          <p className="mt-2 text-text-muted">
            New stories, places, and picks — a few times a month.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
