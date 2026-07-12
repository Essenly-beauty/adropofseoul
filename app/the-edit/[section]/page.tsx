import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditProductCard } from "@/components/editorial/DiscoveryCards";
import { JsonLd } from "@/components/editorial/JsonLd";
import {
  EDIT_SECTIONS,
  getEditSectionBySlug,
  getProductsBySection,
} from "@/lib/discovery";
import { breadcrumbJsonLd, canonical } from "@/lib/seo";

export function generateStaticParams() {
  return EDIT_SECTIONS.map((section) => ({ section: section.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { section: string };
}): Metadata {
  const section = getEditSectionBySlug(params.section);
  if (!section) return { title: "Not found" };
  return {
    title: `${section.title} | The Edit`,
    description: section.intro,
    alternates: { canonical: canonical(`/the-edit/${section.slug}`) },
  };
}

export default function EditSectionPage({
  params,
}: {
  params: { section: string };
}) {
  const section = getEditSectionBySlug(params.section);
  if (!section) notFound();
  const products = getProductsBySection(section.slug);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "The Edit", path: "/the-edit" },
          { name: section.title, path: `/the-edit/${section.slug}` },
        ])}
      />
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent">
          The Edit
        </p>
        <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
          {section.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-text-muted">
          {section.intro}
        </p>
      </header>
      <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((product) => (
          <EditProductCard key={product.slug} product={product} />
        ))}
      </div>
    </main>
  );
}
