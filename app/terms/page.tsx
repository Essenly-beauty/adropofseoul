import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms of use for ${SITE_NAME}.`,
  alternates: { canonical: canonical("/terms") },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-muted">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Terms of Use</h1>
      <p className="mt-3 text-sm text-text-muted">
        Last updated: July 21, 2026
      </p>

      <Section title="Using this site">
        <p>
          {SITE_NAME} is an editorial guide to Korean beauty, wellness, and
          places in Seoul. By using the site you agree to these terms. If you
          create an account (when available), you are responsible for the
          activity on it.
        </p>
      </Section>

      <Section title="Not professional advice">
        <p>
          Articles about skincare, treatments, clinics, and ingredients are
          editorial information, not medical, dermatological, or professional
          advice. Treatments carry real risks that depend on your skin, health
          history, and the practitioner. Always consult a qualified professional
          before making decisions about procedures or products.
        </p>
      </Section>

      <Section title="Places and prices change">
        <p>
          We curate carefully, but shops move, menus change, and prices drift.
          Details were accurate when written; verify anything important — hours,
          prices, bookings — with the venue directly. We are not responsible for
          your experience with third-party venues or services.
        </p>
      </Section>

      <Section title="Affiliate links">
        <p>
          Some links are affiliate links. They may earn us a commission at no
          extra cost to you and never change our editorial judgment.
        </p>
      </Section>

      <Section title="Our content">
        <p>
          The writing, curation, and images we publish belong to {SITE_NAME}{" "}
          unless credited otherwise. You are welcome to share links; please do
          not republish substantial portions without permission.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          The site is provided as-is. To the extent permitted by law, we are not
          liable for indirect damages arising from use of the site or reliance
          on its content.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Anything unclear?{" "}
          <Link href="/contact" className="text-accent hover:text-accent-hover">
            Contact us
          </Link>
          .
        </p>
      </Section>
    </main>
  );
}
