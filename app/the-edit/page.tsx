import type { Metadata } from "next";
import Link from "next/link";
import { EditProductCard } from "@/components/editorial/DiscoveryCards";
import { JsonLd } from "@/components/editorial/JsonLd";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { EDIT_SECTIONS, PRODUCTS } from "@/lib/discovery";
import { breadcrumbJsonLd, canonical, itemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "The Edit",
  description:
    "A calm editorial product edit for Korean beauty, skincare, haircare, and products worth knowing.",
  alternates: { canonical: canonical("/the-edit") },
};

export default function TheEditPage() {
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "The Edit", path: "/the-edit" },
        ])}
      />
      <JsonLd
        data={itemListJsonLd(
          "The Edit products",
          PRODUCTS.map((product) => ({
            name: `${product.brand} ${product.name}`,
            path: "/the-edit",
          }))
        )}
      />
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">
          Products worth knowing
        </p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          The Edit
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-muted">
          A tighter product lens for Korean beauty and haircare. Products are
          examples inside a larger editorial story, not the whole point of the
          site.
        </p>
      </header>

      <nav className="mt-10 flex flex-wrap gap-3" aria-label="Edit sections">
        {EDIT_SECTIONS.map((section) => (
          <Link
            key={section.slug}
            href={`/the-edit/${section.slug}`}
            className="rounded-full border border-soft-gray px-4 py-2 text-xs uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
          >
            {section.title}
          </Link>
        ))}
      </nav>

      <section className="mt-12">
        <SectionHeading title="Current edit" eyebrow="Selected" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {PRODUCTS.map((product) => (
            <EditProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
