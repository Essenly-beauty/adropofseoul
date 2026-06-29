import Link from "next/link";
import type { Category } from "@/lib/categories";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/${category.slug}`}
      className="block rounded-lg border border-soft-gray bg-white p-6 transition-colors hover:border-accent"
    >
      <span className="font-serif text-2xl">{category.label}</span>
    </Link>
  );
}
