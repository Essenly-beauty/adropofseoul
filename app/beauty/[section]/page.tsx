import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { IngredientCard } from "@/components/editorial/IngredientCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import {
  BEAUTY_SECTION_SLUGS,
  getBeautySectionBySlug,
  postMatchesBeautySection,
} from "@/lib/beauty";
import { canonical } from "@/lib/seo";
import { listIngredients } from "@/services/ingredients";
import { listPublishedPosts } from "@/services/posts";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return BEAUTY_SECTION_SLUGS.map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: { section: string };
}): Promise<Metadata> {
  const section = getBeautySectionBySlug(params.section);
  if (!section) return { title: "Not found" };
  return {
    title: `${section.label} | Beauty`,
    description: section.description,
    alternates: { canonical: canonical(`/beauty/${section.slug}`) },
  };
}

export default async function BeautySectionPage({
  params,
}: {
  params: { section: string };
}) {
  const section = getBeautySectionBySlug(params.section);
  if (!section) notFound();

  if (section.slug === "ingredients") {
    let ingredients: Awaited<ReturnType<typeof listIngredients>> = [];
    try {
      ingredients = await listIngredients({ limit: 200 });
    } catch (err) {
      console.error("beauty ingredients: fetch failed", err);
    }

    return (
      <main className="mx-auto max-w-content px-6 py-16">
        <SectionHeading
          title="Ingredients"
          eyebrow="Beauty / Learn the label"
          href="/ingredients"
        />
        <p className="mb-8 max-w-3xl text-text-muted">
          The ingredient dictionary stays independent at /ingredients, but it is
          also the first pillar of Beauty: the place to understand what Korean
          products are trying to do before deciding what to buy.
        </p>
        {ingredients.length === 0 ? (
          <p className="text-text-muted">
            Ingredient entries are being added — check back soon.
          </p>
        ) : (
          <div className="grid gap-6 border-b border-soft-gray md:grid-cols-3 md:border-b-0">
            {ingredients.map((ingredient) => (
              <IngredientCard key={ingredient.id} ingredient={ingredient} />
            ))}
          </div>
        )}
      </main>
    );
  }

  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    const beautyPosts = await listPublishedPosts({
      limit: 48,
      category: "beauty",
    });
    posts = beautyPosts.filter((post) =>
      postMatchesBeautySection(post.tags, section)
    );
  } catch (err) {
    console.error(`beauty ${section.slug}: posts fetch failed`, err);
  }

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title={section.label} eyebrow="Beauty" />
      <p className="mb-8 max-w-3xl text-text-muted">{section.description}</p>
      {posts.length === 0 ? (
        <p className="max-w-2xl text-text-muted">
          This Beauty section is being shaped. Future stories will sit here when
          they match the editorial pillar, with product links used only when
          they add practical context.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
