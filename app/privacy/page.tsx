import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE_NAME}.`,
  alternates: { canonical: canonical("/privacy") },
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

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-text-muted">
        Last updated: August 20, 2026
      </p>

      <Section title="What we collect">
        <p>
          <span className="font-medium text-text">
            Newsletter and waitlist:
          </span>{" "}
          when you subscribe, we store the email address you submit. We use it
          only to send the updates you asked for, and you can unsubscribe at any
          time.
        </p>
        <p>
          <span className="font-medium text-text">
            Accounts (when available):
          </span>{" "}
          if you create an account by signing in with Google, we receive your
          name, email address, and profile photo from Google. Features tied to
          your account — such as saved places or an optional beauty profile
          (skin and hair preferences you choose to share) — are stored so we can
          show them back to you and improve recommendations. The beauty profile
          is always optional and can be edited or cleared.
        </p>
        <p>
          <span className="font-medium text-text">Messages:</span> if you
          contact us, we keep the message so we can reply.
        </p>
      </Section>

      <Section title="What we don't do">
        <p>
          We do not sell personal data. We do not republish other people&apos;s
          reviews or private content. We limit our own collection to what the
          features above need; analytics, advertising, hosting, and
          authentication providers may process the technical information
          described in this policy when those services are active.
        </p>
      </Section>

      <Section title="Cookies, analytics, and ads">
        <p>
          We may use analytics to understand which pages are useful. When we use
          Google AdSense, third-party vendors, including Google, use cookies and
          similar identifiers to serve and measure ads based on a visitor&apos;s
          prior visits to this site or other websites. Google&apos;s use of
          advertising cookies enables Google and its partners to show
          personalized advertising where the visitor has consented.
        </p>
        <p>
          Visitors can opt out of personalized advertising through{" "}
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover"
          >
            Google Ads Settings
          </a>
          . If additional advertising vendors or networks serve ads here, we
          will identify them and provide links to their privacy and opt-out
          choices. Visitors can also review industry opt-out choices at{" "}
          <a
            href="https://www.aboutads.info/choices/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover"
          >
            YourAdChoices
          </a>
          .
        </p>
        <p>
          For visitors in the EEA, the United Kingdom, and Switzerland, we use a
          Google-certified consent management platform before requesting
          consent for personalized advertising where required. Visitors can
          revisit or change their privacy choices through the consent controls
          shown on the site.
        </p>
      </Section>

      <Section title="Affiliate links">
        <p>
          Some articles contain affiliate links. The editor of this site may
          personally earn a commission at no extra cost to you. This never
          affects what we recommend.
        </p>
      </Section>

      <Section title="Where your data lives">
        <p>
          Data is processed by our infrastructure providers: Supabase (database
          and authentication) and Vercel (hosting). Sign-in, when available, is
          provided by Google. Each processes data on our behalf under their own
          security terms.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can unsubscribe from emails at any time, and you can ask us to
          delete your account data or anything else we hold about you —{" "}
          <Link href="/contact" className="text-accent hover:text-accent-hover">
            contact us
          </Link>{" "}
          and we will handle it promptly.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes in a meaningful way, we will update this page
          and the date above.
        </p>
      </Section>
    </main>
  );
}
