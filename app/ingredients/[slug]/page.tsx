import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getIngredientBySlug,
  listProductsForIngredient,
} from "@/services/ingredients";
import { Prose } from "@/components/editorial/Prose";
import { Eyebrow } from "@/components/editorial/Eyebrow";
import { TagChips } from "@/components/editorial/TagChips";
import { ProductCard } from "@/components/editorial/ProductCard";
import { IngredientVisual } from "@/components/editorial/IngredientVisual";
import { JsonLd } from "@/components/editorial/JsonLd";
import { skinTypeLabel, concernLabel, functionLabel } from "@/lib/taxonomy";
import { canonical, definedTermJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const ing = await getIngredientBySlug(params.slug);
  if (!ing) return { title: "Not found" };
  return {
    title: ing.seoTitle ?? `${ing.name} — K-Beauty Ingredient`,
    description: ing.metaDescription ?? ing.summary ?? undefined,
    alternates: { canonical: canonical(`/ingredients/${ing.slug}`) },
  };
}

export default async function IngredientPage({
  params,
}: {
  params: { slug: string };
}) {
  const ing = await getIngredientBySlug(params.slug);
  if (!ing) notFound();

  let products: Awaited<ReturnType<typeof listProductsForIngredient>> = [];
  try {
    products = await listProductsForIngredient(ing.id);
  } catch (err) {
    console.error("ingredient: products fetch failed", err);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={definedTermJsonLd(ing)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Ingredients", path: "/ingredients" },
          { name: ing.name, path: `/ingredients/${ing.slug}` },
        ])}
      />

      <IngredientVisual
        ingredient={ing}
        ratio="aspect-[5/3]"
        className="mb-8"
      />

      <Eyebrow>
        {ing.functions.map(functionLabel).join(" · ") || "Ingredient"}
      </Eyebrow>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">{ing.name}</h1>
      {(ing.inciName || ing.alsoKnownAs.length > 0) && (
        <p className="mt-2 text-sm text-text-muted">
          {[ing.inciName, ...ing.alsoKnownAs].filter(Boolean).join(" · ")}
        </p>
      )}
      {ing.summary && (
        <p className="mt-4 text-xl text-text-muted">{ing.summary}</p>
      )}

      {(ing.goodForSkinTypes.length > 0 || ing.targetsConcerns.length > 0) && (
        <div className="mt-6 flex flex-col gap-3 border-y border-soft-gray py-5">
          {ing.goodForSkinTypes.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-label text-accent">
                Good for
              </p>
              <TagChips items={ing.goodForSkinTypes.map(skinTypeLabel)} />
            </div>
          )}
          {ing.targetsConcerns.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-label text-accent">
                Targets
              </p>
              <TagChips items={ing.targetsConcerns.map(concernLabel)} />
            </div>
          )}
        </div>
      )}

      {ing.description && (
        <div className="mt-8">
          <Prose markdown={ing.description} />
        </div>
      )}

      {ing.benefits && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Benefits</h2>
          <div className="mt-2">
            <Prose markdown={ing.benefits} />
          </div>
        </section>
      )}

      {ing.caution && (
        <section className="mt-8 rounded-sm bg-porcelain/60 p-5">
          <h2 className="font-serif text-xl">Good to know</h2>
          <div className="mt-2">
            <Prose markdown={ing.caution} />
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">Found in</h2>
          <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 border-y border-soft-gray py-8">
        <p className="text-[11px] uppercase tracking-label text-accent">
          Keep exploring
        </p>
        <h2 className="mt-2 font-serif text-3xl">Build the next layer.</h2>
        <p className="mt-3 max-w-2xl text-text-muted">
          Use this ingredient as a starting point, then compare it with nearby
          actives, skin concerns, and product guides before you buy anything.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/ingredients"
            className="rounded-full border border-text bg-text px-4 py-2 text-[11px] uppercase tracking-label text-bg"
          >
            Browse ingredients
          </a>
          <a
            href="/beauty/skin-concerns"
            className="rounded-full border border-soft-gray px-4 py-2 text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
          >
            Match a concern
          </a>
          <a
            href="/beauty/products"
            className="rounded-full border border-soft-gray px-4 py-2 text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-text"
          >
            Product context
          </a>
        </div>
      </section>
    </main>
  );
}
