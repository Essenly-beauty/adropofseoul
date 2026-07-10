import type { Metadata } from "next";
import { listIngredients } from "@/services/ingredients";
import { IngredientCard } from "@/components/editorial/IngredientCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { JsonLd } from "@/components/editorial/JsonLd";
import { AreaFilter } from "@/components/editorial/AreaFilter";
import { SKIN_TYPES } from "@/lib/taxonomy";
import { canonical, definedTermSetJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "K-Beauty Ingredient Dictionary",
  description:
    "What Korean beauty ingredients actually do — niacinamide, snail mucin, centella, and more, by function and skin type.",
  alternates: { canonical: canonical("/ingredients") },
};

export const dynamic = "force-dynamic";

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: { skin?: string };
}) {
  let ingredients: Awaited<ReturnType<typeof listIngredients>> = [];
  try {
    ingredients = await listIngredients({ limit: 200 });
  } catch (err) {
    console.error("ingredients: fetch failed", err);
  }

  const skinValues = SKIN_TYPES.map((t) => t.value);
  const active =
    searchParams.skin && skinValues.includes(searchParams.skin)
      ? searchParams.skin
      : undefined;
  const visible = active
    ? ingredients.filter((i) => i.goodForSkinTypes.includes(active))
    : ingredients;

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd data={definedTermSetJsonLd(ingredients)} />
      <SectionHeading
        title="Ingredient Dictionary"
        eyebrow="Know your actives"
      />
      {ingredients.length > 0 && (
        <AreaFilter
          basePath="/ingredients"
          param="skin"
          options={SKIN_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          active={active}
        />
      )}
      {visible.length === 0 ? (
        <p className="text-text-muted">
          Ingredients are being added — check back soon.
        </p>
      ) : (
        <div className="border-b border-soft-gray">
          {visible.map((i) => (
            <IngredientCard key={i.id} ingredient={i} />
          ))}
        </div>
      )}
    </main>
  );
}
