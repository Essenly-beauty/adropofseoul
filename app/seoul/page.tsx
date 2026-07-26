import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";
import { SEOUL_NEIGHBORHOODS, PLACE_TYPE_EMOJI } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Seoul",
  description:
    "Explore Seoul by what you want to experience — head spas, salons, clinics, personal color — or by the neighborhood you want to know.",
  alternates: { canonical: canonical("/seoul") },
};

// Curated place-type entry points into the directory (the live, best-populated
// service categories). Each links into /seoul/places with the type filter.
const PLACE_TYPES = [
  { type: "head-spa", label: "Head Spas", cat: "head_spa" },
  { type: "salon", label: "Salons", cat: "salon" },
  { type: "clinic", label: "Skin Clinics", cat: "clinic" },
  { type: "spa", label: "Spa & Massage", cat: "spa" },
  { type: "personal-color", label: "Personal Color", cat: "personal_color" },
  { type: "perfume", label: "Perfume Workshops", cat: "perfume" },
];

export default function SeoulPage() {
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Seoul" eyebrow="The City" />
      <p className="-mt-2 mb-10 max-w-2xl text-text-muted">
        Explore the city by what you want to experience — or by the neighborhood
        you want to know.
      </p>

      {/* Explore by place type */}
      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-2xl">Explore by place</h2>
          <Link
            href="/seoul/places"
            className="text-sm text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
          >
            Full directory →
          </Link>
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Specific spots, ready to book — by service and neighborhood.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLACE_TYPES.map((t) => (
            <Link
              key={t.type}
              href={`/seoul/places?type=${t.type}`}
              className="group flex items-center gap-3 rounded-lg border border-soft-gray p-5 transition-colors duration-medium ease-editorial hover:border-accent"
            >
              <span aria-hidden className="text-2xl">
                {PLACE_TYPE_EMOJI[t.cat]}
              </span>
              <span className="font-serif text-xl transition-colors duration-medium ease-editorial group-hover:text-accent">
                {t.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore by neighborhood */}
      <section className="mt-16">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-2xl">Explore by neighborhood</h2>
          <Link
            href="/seoul/neighborhoods"
            className="text-sm text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
          >
            All neighborhoods →
          </Link>
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Not sure where to go? Start with the neighborhood, not the checklist.
        </p>
        <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {SEOUL_NEIGHBORHOODS.map((n) => (
            <Link
              key={n.slug}
              href={`/seoul/neighborhoods/${n.slug}`}
              className="group block rounded-lg border border-soft-gray p-7 transition-colors duration-medium ease-editorial hover:border-accent"
            >
              <h3 className="font-serif text-3xl transition-colors duration-medium ease-editorial group-hover:text-accent">
                {n.label}
              </h3>
              <p className="mt-2 text-sm text-text-muted">{n.blurb}</p>
              <span className="mt-4 inline-block text-[11px] uppercase tracking-label text-accent">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
