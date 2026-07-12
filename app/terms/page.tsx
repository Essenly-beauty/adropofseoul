import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms",
  description: "Basic terms for using A Drop of Seoul.",
  alternates: { canonical: canonical("/terms") },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-accent">Terms</p>
      <h1 className="mt-2 font-serif text-5xl leading-tight">Terms</h1>
      <div className="mt-8 space-y-6 leading-8 text-text-muted">
        <p>
          A Drop of Seoul provides editorial information for discovery and
          planning. Content is not medical, legal, or financial advice.
        </p>
        <p>
          Beauty treatments, prices, booking options, product formulas, and
          availability can change. Readers should verify practical details with
          official providers before booking or buying.
        </p>
      </div>
    </main>
  );
}
