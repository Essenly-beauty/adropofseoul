import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { BEAUTY_PROFILE_DOMAINS } from "@/lib/beauty-profile/domains";
import { BeautyProfileEntryCard } from "@/components/editorial/BeautyProfileEntryCard";

export const metadata: Metadata = {
  title: "My Beauty Profile",
  description:
    "A short, private profile of your skin and hair — texture, needs, and an ideal routine, through the lens of Korean beauty. Guidance, not a diagnosis.",
  alternates: { canonical: canonical("/beauty-profile") },
  openGraph: {
    title: "My Beauty Profile",
    description:
      "Understand your skin and hair, then decide — a short, private profile through the lens of Korean beauty.",
    url: canonical("/beauty-profile"),
    type: "website",
  },
};

export default function BeautyProfilePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <p className="text-xs uppercase tracking-widest text-accent">
        My Beauty Profile
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
        Understand your skin and hair, then decide.
      </h1>
      <p className="mt-4 text-lg text-text-muted">
        A short, private profile of what your skin and hair actually need —
        texture, tendencies, and an ideal routine, through the lens of Korean
        beauty. You get a useful result before any signup.
      </p>

      {/* Choose a domain */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {BEAUTY_PROFILE_DOMAINS.map((d) => (
          <BeautyProfileEntryCard key={d.slug} domain={d} />
        ))}
      </section>

      {/* What it is / isn't + privacy */}
      <section className="mt-12 rounded-lg border border-soft-gray bg-porcelain/40 p-6">
        <h2 className="text-[11px] uppercase tracking-label text-accent">
          What this is
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm text-text-muted">
          <li>Personalized, explainable guidance based on what you tell us.</li>
          <li>Yours to complete anonymously — no account needed to see it.</li>
          <li>
            Private: your answers aren&apos;t shared, and results aren&apos;t
            public.
          </li>
        </ul>
        <h2 className="mt-5 text-[11px] uppercase tracking-label text-accent">
          What this isn&apos;t
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          It is not a medical diagnosis. For persistent concerns — irritation,
          pain, sudden hair loss — consider a qualified professional.
        </p>
      </section>

      {/* [LEGAL REVIEW REQUIRED: final non-diagnostic + privacy copy] */}
    </main>
  );
}
