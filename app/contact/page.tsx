import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { NewsletterForm } from "@/components/editorial/NewsletterForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with A Drop of Seoul.",
  alternates: { canonical: canonical("/contact") },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Contact</h1>
      <p className="mt-4 text-text-muted">
        Partnerships, press, or a place we should know about? Email{" "}
        <a className="text-accent" href="mailto:hello@adropofseoul.com">
          hello@adropofseoul.com
        </a>
        .
      </p>
      <div className="mt-8">
        <h2 className="font-serif text-2xl">Newsletter</h2>
        <NewsletterForm />
      </div>
    </main>
  );
}
