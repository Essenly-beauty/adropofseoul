import type { Metadata } from "next";
import { listProducts } from "@/services/products";
import { ProductCard } from "@/components/editorial/ProductCard";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Picks",
  description: "Korean beauty and hair products we recommend.",
  alternates: { canonical: canonical("/picks") },
};

export default async function PicksPage() {
  const products = await listProducts({ limit: 96 });
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Picks" eyebrow="What we love" />
      {products.length === 0 ? (
        <p className="text-text-muted">No picks yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
