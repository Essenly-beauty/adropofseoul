import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Editorial Standards",
  description:
    "How A Drop of Seoul researches, verifies, updates, and discloses its editorial recommendations.",
  alternates: { canonical: canonical("/editorial-standards") },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-text-muted">
        {children}
      </div>
    </section>
  );
}

export default function EditorialStandardsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-accent">About us</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">
        Editorial standards
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-text-muted">
        A Drop of Seoul is a Seoul-based publication produced by Essenly Inc.
        The byline “A Drop of Seoul Editorial” identifies work researched,
        written, and reviewed under the publication&apos;s responsibility.
      </p>

      <Section title="How we choose what to cover">
        <p>
          We cover Korean beauty, wellness, and Seoul experiences that answer a
          practical reader question. Popularity alone is not a recommendation.
          We look for usefulness, a distinct point of view, and enough evidence
          to explain who something is for and where its limits are.
        </p>
      </Section>

      <Section title="Firsthand experience and researched guides">
        <p>
          When a recommendation comes from a visit or product trial, we say so
          and describe the relevant context. Researched guides may draw on
          official brand information, public records, primary research, booking
          platforms, and reputable reporting. We do not present a researched
          listing as a personal visit.
        </p>
      </Section>

      <Section title="Sources and changing details">
        <p>
          We prefer primary sources for prices, opening hours, statistics,
          ingredients, and policy details, and link them where they materially
          support a claim. Seoul changes quickly, so readers should confirm
          time-sensitive details with the venue or service before booking.
        </p>
      </Section>

      <Section title="Beauty and wellness information">
        <p>
          Skincare, scalp, treatment, and ingredient coverage is educational,
          not medical advice. We separate cosmetic guidance from diagnosis and
          encourage professional care for persistent symptoms, pregnancy-related
          questions, medication interactions, or procedures with meaningful
          risk.
        </p>
      </Section>

      <Section title="Commercial relationships">
        <p>
          Affiliate links and paid relationships are disclosed where they
          appear. A commission does not change the price a reader pays or our
          editorial judgment. Sponsored work, if published, will be labeled
          clearly and will not be presented as independent testing.
        </p>
      </Section>

      <Section title="Corrections and updates">
        <p>
          We correct material errors and update time-sensitive guides when new
          information changes the recommendation. To flag an error, email{" "}
          <a
            href="mailto:hello@adropofseoul.com"
            className="text-accent hover:text-accent-hover"
          >
            hello@adropofseoul.com
          </a>{" "}
          or use our{" "}
          <Link href="/contact" className="text-accent hover:text-accent-hover">
            contact page
          </Link>
          .
        </p>
      </Section>
    </main>
  );
}
