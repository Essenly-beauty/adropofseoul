import type { Metadata } from "next";
import { SITE_NAME, TAGLINE } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE_NAME}.`,
  alternates: { canonical: canonical("/about") },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">About</h1>
      <p className="mt-4 text-lg text-text-muted">{TAGLINE}</p>
      <p className="mt-6">
        {SITE_NAME} is a media outlet that looks closely at beauty in Seoul. We
        cover K-beauty routines and ingredients, whole-body care like head spas
        and wellness, and the character of the neighborhoods across the city.
        Rather than chasing trends, we focus on routines you can actually
        follow, and we only feature what we&apos;ve genuinely tried ourselves.
      </p>
      <p className="mt-4">
        {SITE_NAME} is created by Essenly, a hair care brand. While it&apos;s a
        brand-owned channel, we aim to keep our editorial standards and point of
        view independent.
      </p>
      <p className="mt-4">
        Essenly is a minimal hair care brand built on the philosophy of
        &ldquo;Essentials Only.&rdquo; Our signature complex, blending collagen,
        amino acids, and plant-based oils, wraps and protects damaged hair while
        restoring shine, all in service of a quiet, considered kind of
        self-care.
      </p>
    </main>
  );
}
