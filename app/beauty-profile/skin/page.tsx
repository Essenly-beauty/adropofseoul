import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Skin Profile",
  description:
    "Understand your skin's tendencies and goals, then see explainable Korean skincare starting points—before any signup.",
  alternates: { canonical: canonical("/beauty-profile/skin") },
};

export default function SkinProfilePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <Link
        href="/beauty-profile"
        className="text-[11px] uppercase tracking-label text-text-muted hover:text-accent"
      >
        ← My Beauty Profile
      </Link>
      <p className="mt-4 text-xs uppercase tracking-widest text-accent">
        Skin Profile
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
        Understand what your skin is asking for.
      </h1>
      <p className="mt-4 text-lg text-text-muted">
        Eight short questions about how your skin feels, what you want from your
        routine, and the textures you prefer. See your full result and a small
        Korean product preview before any signup.
      </p>
      <ul className="mt-8 grid gap-3 text-sm text-text-muted sm:grid-cols-3">
        <li className="border-t border-soft-gray pt-3">About 2 minutes</li>
        <li className="border-t border-soft-gray pt-3">
          No signup for results
        </li>
        <li className="border-t border-soft-gray pt-3">
          Guidance, not diagnosis
        </li>
      </ul>
      <Link
        href="/beauty-profile/skin/quiz"
        className="mt-10 inline-block rounded-full border border-text bg-text px-6 py-3 text-xs font-medium uppercase tracking-label text-bg hover:border-accent hover:bg-accent"
      >
        Start my Skin Profile →
      </Link>
      <section className="mt-12 rounded-lg border border-soft-gray bg-porcelain/40 p-6">
        <h2 className="text-[11px] uppercase tracking-label text-accent">
          Privacy and limits
        </h2>
        <p className="mt-3 text-sm text-text-muted">
          This first version scores in your browser and does not require an
          account. It describes self-observed tendencies and cannot diagnose a
          skin condition or guarantee product compatibility.
        </p>
      </section>
    </main>
  );
}
