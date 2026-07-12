import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "How A Drop of Seoul may use affiliate links and commercial disclosures.",
  alternates: { canonical: canonical("/affiliate-disclosure") },
};

export default function AffiliateDisclosurePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-accent">
        Disclosure
      </p>
      <h1 className="mt-2 font-serif text-5xl leading-tight">
        Affiliate disclosure
      </h1>
      <div className="mt-8 space-y-6 leading-8 text-text-muted">
        <p>
          A Drop of Seoul may use affiliate links in product cards, buying
          guides, or clearly commerce-oriented sections. If a reader buys
          through those links, the site may earn a commission at no extra cost
          to the reader.
        </p>
        <p>
          Affiliate relationships should not determine editorial ranking. Paid
          partnerships, sponsored content, gifted products, and affiliate links
          should be labeled where they appear.
        </p>
        <p>
          Amazon-required language will be shown where Amazon affiliate links
          are present: As an Amazon Associate I earn from qualifying purchases.
        </p>
      </div>
    </main>
  );
}
