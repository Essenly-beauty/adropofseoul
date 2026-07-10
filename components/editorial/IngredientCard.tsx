import Link from "next/link";
import type { Ingredient } from "@/services/types";
import { functionLabel } from "@/lib/taxonomy";

export function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const primary = ingredient.functions[0];
  return (
    <Link
      href={`/ingredients/${ingredient.slug}`}
      className="group block border-t border-soft-gray py-6"
    >
      {primary && (
        <p className="text-[11px] uppercase tracking-label text-accent">
          {functionLabel(primary)}
        </p>
      )}
      <h3 className="mt-1 font-serif text-2xl transition-colors duration-medium ease-editorial group-hover:text-accent">
        {ingredient.name}
      </h3>
      {ingredient.summary && (
        <p className="mt-1 text-sm text-text-muted line-clamp-2">
          {ingredient.summary}
        </p>
      )}
    </Link>
  );
}
