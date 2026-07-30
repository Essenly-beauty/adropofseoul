import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/seo";
import { HAIR_PROFILES } from "@/lib/haircare/profiles";

export const metadata: Metadata = {
  title: "Hair Profile — What Does Your Hair Actually Need?",
  description:
    "A short guide to your hair texture, scalp condition, damage level, and ideal care routine.",
  alternates: { canonical: canonical("/beauty-profile/hair") },
  openGraph: {
    title: "Hair Profile — What Does Your Hair Actually Need?",
    description:
      "A short guide to your hair texture, scalp condition, damage level, and ideal care routine.",
    url: canonical("/beauty-profile/hair"),
    type: "website",
  },
};

const REASSURANCE = [
  "About two minutes",
  "No purchase required",
  "Personalized care guidance",
  "Educational, not a medical diagnosis",
];

export default function HairProfilePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <Link
        href="/beauty-profile"
        className="text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
      >
        ← My Beauty Profile
      </Link>

      <p className="mt-4 text-xs uppercase tracking-widest text-accent">
        Hair Profile
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
        What does your hair actually need?
      </h1>
      <p className="mt-4 text-lg text-text-muted">
        A short guide to your hair texture, scalp condition, damage level, and
        ideal care routine — through the lens of Korean hair care.
      </p>

      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
        {REASSURANCE.map((r) => (
          <li key={r} className="flex items-center gap-2">
            <span aria-hidden className="text-accent">
              ·
            </span>
            {r}
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link
          href="/beauty-profile/hair/quiz"
          className="inline-block rounded-full border border-text bg-text px-6 py-2.5 text-xs font-medium uppercase tracking-label text-bg transition-colors duration-medium ease-editorial hover:border-accent hover:bg-accent"
        >
          Start the quiz
        </Link>
      </div>

      {/* Secondary path: the six profiles double as the quiz's result
          archetypes, so anyone who already knows theirs can skip straight to
          the care guide. */}
      <section className="mt-16 border-t border-soft-gray pt-10">
        <h2 className="font-serif text-2xl">Already know your profile?</h2>
        <p className="mt-2 text-text-muted">Go straight to its care guide.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {HAIR_PROFILES.map((p) => (
            <Link
              key={p.slug}
              href={`/haircare/profiles/${p.slug}`}
              className="group block rounded-lg border border-soft-gray p-5 transition-colors duration-medium ease-editorial hover:border-accent"
            >
              <h3 className="font-serif text-lg leading-snug transition-colors duration-medium ease-editorial group-hover:text-accent">
                {p.name}
              </h3>
              <p className="mt-2 text-sm text-text-muted">{p.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-12 border-t border-soft-gray pt-6 text-xs text-text-muted/70">
        Persistent itching, redness, flaking, pain, or sudden hair loss may need
        professional evaluation. This guide is educational and not a medical
        diagnosis.
      </p>
    </main>
  );
}
