import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { IngredientCard } from "@/components/editorial/IngredientCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { BEAUTY_SECTIONS } from "@/lib/beauty";
import { canonical } from "@/lib/seo";
import { listIngredients } from "@/services/ingredients";
import { listPublishedPosts } from "@/services/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beauty",
  description:
    "K-beauty ingredients, routines, product guides, skin concerns, and the culture behind Korean skincare.",
  alternates: { canonical: canonical("/beauty") },
};

export default async function BeautyPage() {
  let ingredients: Awaited<ReturnType<typeof listIngredients>> = [];
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];

  try {
    ingredients = await listIngredients({ limit: 4 });
  } catch (err) {
    console.error("beauty: ingredients fetch failed", err);
  }

  try {
    posts = await listPublishedPosts({ limit: 6, category: "beauty" });
  } catch (err) {
    console.error("beauty: posts fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">Beauty</p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          K-beauty, organized by how people actually learn it.
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-muted">
          Ingredients, routines, product context, skin concerns, and culture,
          gathered as a magazine first and a shopping guide only when it helps.
        </p>
      </header>

      <section className="mt-12">
        <SectionHeading title="Beauty Pillars" eyebrow="Explore" />
        <div className="grid gap-px overflow-hidden border-y border-soft-gray bg-soft-gray md:grid-cols-3">
          {BEAUTY_SECTIONS.map((section) => (
            <Link
              key={section.slug}
              href={section.href}
              className="group bg-bg p-6 transition-colors duration-medium ease-editorial hover:bg-porcelain"
            >
              <p className="text-[11px] uppercase tracking-label text-accent">
                {section.eyebrow}
              </p>
              <h2 className="mt-2 font-serif text-2xl transition-colors duration-medium ease-editorial group-hover:text-accent">
                {section.label}
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                {section.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {ingredients.length > 0 && (
        <section className="mt-14">
          <SectionHeading
            title="Ingredient Dictionary"
            eyebrow="Learn the label"
            href="/ingredients"
          />
          <div className="grid gap-6 border-b border-soft-gray md:grid-cols-4 md:border-b-0">
            {ingredients.map((ingredient) => (
              <IngredientCard key={ingredient.id} ingredient={ingredient} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-14">
        <SectionHeading title="Latest Beauty Stories" eyebrow="Magazine" />
        {posts.length === 0 ? (
          <p className="max-w-2xl text-text-muted">
            Beauty stories are being edited. The ingredient dictionary is live
            now, and product and routine guides will follow without crowding the
            magazine with hard-sell shopping copy.
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
