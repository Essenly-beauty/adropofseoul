import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";
import { AROUND_SEOUL_NEIGHBORHOODS } from "@/lib/taxonomy";
import { AroundSeoulTabs } from "@/components/editorial/AroundSeoulTabs";

export const metadata: Metadata = {
  title: "Around Seoul",
  description:
    "Neighborhood-by-neighborhood guides to Seoul — beauty flagships, local tables, cafés, and the routes that link them.",
  alternates: { canonical: canonical("/around-seoul") },
};

export default function AroundSeoulPage() {
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Around Seoul" eyebrow="Guides" />
      <AroundSeoulTabs active="neighborhoods" />

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {AROUND_SEOUL_NEIGHBORHOODS.map((n) => (
          <Link
            key={n.slug}
            href={`/around-seoul/${n.slug}`}
            className="group block rounded-lg border border-soft-gray p-7 transition-colors duration-medium ease-editorial hover:border-accent"
          >
            <h2 className="font-serif text-3xl transition-colors duration-medium ease-editorial group-hover:text-accent">
              {n.label}
            </h2>
            <p className="mt-2 text-sm text-text-muted">{n.blurb}</p>
            <span className="mt-4 inline-block text-[11px] uppercase tracking-label text-accent">
              Explore →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
