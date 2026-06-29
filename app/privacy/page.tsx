import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE_NAME}.`,
  alternates: { canonical: canonical("/privacy") },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Privacy Policy</h1>
      <p className="mt-4 text-text-muted">
        We collect only the email addresses submitted to our newsletter, used
        solely to send occasional updates. You can unsubscribe at any time. We
        do not sell personal data.
      </p>
      <p className="mt-4 text-text-muted">
        This site uses affiliate links; purchases made through them may earn us
        a commission at no extra cost to you.
      </p>
    </main>
  );
}
