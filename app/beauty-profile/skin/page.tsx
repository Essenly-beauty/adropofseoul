import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Skin Profile — Coming Soon",
  description:
    "A short guide to your skin's tendencies, sensitivities, and goals, matched to a Korean skincare approach. Coming soon.",
  alternates: { canonical: canonical("/beauty-profile/skin") },
  openGraph: {
    title: "Skin Profile — Coming Soon",
    description:
      "A short guide to your skin's tendencies, sensitivities, and goals, matched to a Korean skincare approach.",
    url: canonical("/beauty-profile/skin"),
    type: "website",
  },
};

// The Skin Profile quiz/taxonomy is not yet approved (product + medical review
// pending), so this is an honest "coming soon" with a real next step, not
// invented dermatological content. [PRODUCT DECISION REQUIRED: skin taxonomy]
export default function SkinProfilePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <Link
        href="/beauty-profile"
        className="text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
      >
        ← My Beauty Profile
      </Link>

      <p className="mt-4 text-xs uppercase tracking-widest text-accent">
        Skin Profile
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
        Your skin, understood — coming soon.
      </h1>
      <p className="mt-4 text-lg text-text-muted">
        A short, private guide to your skin&apos;s tendencies, sensitivities,
        and goals, matched to a Korean skincare approach. We&apos;re building it
        with care — it&apos;s guidance, never a diagnosis.
      </p>

      <section className="mt-10 rounded-lg border border-soft-gray bg-porcelain/40 p-6">
        <p className="text-sm text-text-muted">
          In the meantime, start with our editorial:
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/skincare"
            className="rounded-full border border-text px-4 py-1.5 text-xs font-medium uppercase tracking-label transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
          >
            Skincare stories →
          </Link>
          <Link
            href="/ingredients"
            className="rounded-full border border-soft-gray px-4 py-1.5 text-xs font-medium uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
          >
            Ingredient dictionary →
          </Link>
          <Link
            href="/beauty-profile/hair"
            className="rounded-full border border-soft-gray px-4 py-1.5 text-xs font-medium uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
          >
            Try the Hair Profile →
          </Link>
        </div>
      </section>
    </main>
  );
}
