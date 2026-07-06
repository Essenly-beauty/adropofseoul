import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function CategoryIndex() {
  return (
    <div className="border-t border-soft-gray">
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/${c.slug}`}
          className="group grid grid-cols-[1fr_auto] items-baseline gap-6 border-b border-soft-gray py-6 transition-[padding] duration-medium ease-editorial hover:pl-4 md:grid-cols-[auto_1fr_auto]"
        >
          <span className="font-serif text-3xl leading-none transition-colors duration-medium ease-editorial group-hover:text-accent md:text-4xl">
            {c.label}
          </span>
          <span className="hidden text-sm text-text-muted md:block">
            {c.blurb}
          </span>
          <span className="translate-x-[-8px] text-[11px] uppercase tracking-label text-text-muted opacity-0 transition-all duration-medium ease-editorial group-hover:translate-x-0 group-hover:opacity-100">
            Enter →
          </span>
        </Link>
      ))}
    </div>
  );
}
