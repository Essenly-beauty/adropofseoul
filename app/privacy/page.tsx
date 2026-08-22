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
        Last updated: August 22, 2026
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
          private content. We limit our own collection to what the features
          above need; analytics, advertising, hosting, and authentication
          providers may process technical information when those services are
          active.
        </p>
      </Section>

      <Section title="Cookies, analytics, and ads">
        <p>
          We may use privacy-respecting analytics to understand which pages are
          useful. When Google AdSense is active, third-party vendors, including
          Google, may place and read cookies on your browser or use web beacons,
          IP addresses, and other identifiers to serve, personalize, and measure
          ads. Google and its partners may use information from visits to this
          site and other websites for advertising where permitted and consented.
        </p>
        <p>
          You can manage personalized advertising through{" "}
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover"
          >
            Google Ads Settings
          </a>
          . You can also learn how Google uses information from sites that use
          its services in{" "}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover"
          >
            Google&apos;s partner-sites notice
          </a>
          .
        </p>
        <p>
          Before serving personalized ads to visitors in the EEA, the United
          Kingdom, or Switzerland, we will use a Google-certified consent
          management platform and request consent where required. Available
          consent controls will let visitors review or change their choices.
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
