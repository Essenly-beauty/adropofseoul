import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StartQuizButton } from "@/components/editorial/StartQuizButton";
import { isFlagEnabled } from "@/lib/profile/flags";

// Entry point for the server-backed Hair Profile quiz (M2b-2b). Creating the
// attempt is a mutation (it sets the anonymous cookie), so it runs in the
// StartQuizButton client action, not at render. Gated + noindex.
export const metadata: Metadata = {
  title: "Start the Hair Profile",
  robots: { index: false, follow: false },
};

const REASSURANCE = [
  "About two minutes",
  "No account needed",
  "Your answers stay private",
  "Educational, not a medical diagnosis",
];

export default function HairQuizStartPage() {
  if (!isFlagEnabled("hair_profile")) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <Link
        href="/beauty-profile/hair"
        className="text-[11px] uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
      >
        ← Hair Profile
      </Link>

      <p className="mt-4 text-xs uppercase tracking-widest text-accent">
        Hair Profile
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
        Let&apos;s find what your hair needs.
      </h1>
      <p className="mt-4 text-lg text-text-muted">
        A few short questions about your hair and routine. You&apos;ll see a
        result before any signup — and you can pick up where you left off.
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
        <StartQuizButton domain="hair" sourceContext="hair_landing" />
      </div>
    </main>
  );
}
