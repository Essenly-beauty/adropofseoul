import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Editorial Standards",
  description:
    "How A Drop of Seoul selects, reviews, labels, and updates beauty recommendations.",
  alternates: { canonical: canonical("/editorial-standards") },
};

export default function EditorialStandardsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-accent">Standards</p>
      <h1 className="mt-2 font-serif text-5xl leading-tight">
        Editorial standards
      </h1>
      <div className="mt-8 space-y-8 leading-8 text-text-muted">
        <section>
          <h2 className="font-serif text-3xl text-text">Selection</h2>
          <p className="mt-3">
            We include places, products, and guides when they help readers make
            clearer Korean beauty decisions. Selection is not automatic and is
            not guaranteed by payment.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-3xl text-text">Verification</h2>
          <p className="mt-3">
            Practical details can change. Addresses, opening hours, prices,
            booking links, and formulas should be checked against official
            sources before publication and updated where possible.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-3xl text-text">Disclosure</h2>
          <p className="mt-3">
            Affiliate links, gifted products, sponsored content, and paid
            partnerships must be disclosed clearly. Editorial judgment should
            remain separate from commercial compensation.
          </p>
        </section>
      </div>
    </main>
  );
}
