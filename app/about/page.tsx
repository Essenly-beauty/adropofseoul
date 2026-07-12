import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About A Drop of Seoul",
  description:
    "A Drop of Seoul is a selective Korean beauty discovery platform for readers who need better choices, not more of them.",
  alternates: { canonical: canonical("/about") },
};

const PROMISES = [
  "We choose selectively.",
  "We explain who each recommendation is best for.",
  "We distinguish editorial recommendations from paid partnerships.",
  "We update practical information where possible.",
  "We prioritize useful context over trend-driven hype.",
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-accent">About</p>
      <h1 className="mt-2 font-serif text-5xl leading-tight md:text-6xl">
        Better Korean beauty choices, not just more of them.
      </h1>
      <p className="mt-6 text-xl leading-9 text-text-muted">
        Korea has thousands of beauty products, salons, treatments, and trends.
        Most visitors do not need more choices. They need better ones.
      </p>

      <section className="mt-12 space-y-6 leading-8 text-text-muted">
        <p>
          {SITE_NAME} is an English-language Korean beauty discovery platform
          and independent editorial guide. We help international readers
          understand Korean skincare, hair rituals, head spas, treatments,
          neighborhoods, stores, and places worth planning around.
        </p>
        <p>
          The long-term journey is simple: editorial story to guide, guide to
          directory, directory to place detail, and then booking or affiliate
          conversion only when that next step genuinely helps the reader.
        </p>
      </section>

      <section className="mt-12 border-y border-soft-gray py-8">
        <h2 className="font-serif text-3xl">Who it is for</h2>
        <p className="mt-4 leading-8 text-text-muted">
          A Drop of Seoul is for readers who are curious about Korean beauty but
          do not want to sort through every viral claim, sponsored list, and
          product shelf alone. It is for travelers planning a Seoul beauty day,
          shoppers comparing products thoughtfully, and people who want cultural
          context before making decisions.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Our editorial promise</h2>
        <ul className="mt-5 space-y-3 text-text-muted">
          {PROMISES.map((promise) => (
            <li key={promise}>- {promise}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <InfoBlock
          title="How we select"
          copy="Places and products are included because they help explain a useful beauty decision: who it suits, what it is best for, where it fits in a routine or itinerary, and what a reader should verify before acting."
        />
        <InfoBlock
          title="How we review"
          copy="Practical details such as prices, opening hours, addresses, booking links, and formulas can change. We mark sample data clearly and update verified information where possible."
        />
        <InfoBlock
          title="How commerce works"
          copy="Affiliate links may support the site, but commission does not decide editorial ranking. Paid partnerships and sponsored content must be disclosed clearly."
        />
        <InfoBlock
          title="What inclusion means"
          copy="Inclusion is selective and not automatically paid. A place or product can be worth mentioning for a specific reader while still not being right for everyone."
        />
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/editorial-standards"
          className="rounded-full border border-text px-5 py-3 text-xs uppercase tracking-label transition-colors duration-medium ease-editorial hover:bg-text hover:text-bg"
        >
          Editorial Standards
        </Link>
        <Link
          href="/places"
          className="rounded-full border border-soft-gray px-5 py-3 text-xs uppercase tracking-label text-text-muted transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
        >
          Explore Places
        </Link>
      </div>
    </main>
  );
}

function InfoBlock({ title, copy }: { title: string; copy: string }) {
  return (
    <section className="border-t border-soft-gray pt-6">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-text-muted">{copy}</p>
    </section>
  );
}
