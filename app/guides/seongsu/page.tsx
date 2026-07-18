import type { Metadata } from "next";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { JsonLd } from "@/components/editorial/JsonLd";
import { breadcrumbJsonLd, canonical } from "@/lib/seo";
import { listGuidePosts } from "@/lib/seongsu/assets";
import { SeongsuMap } from "@/components/seongsu/SeongsuMap";
import { WaitlistForm } from "@/components/seongsu/WaitlistForm";

const TITLE = "The Seongsu Series: Seoul's Beauty-and-Bites Neighborhood";
const DESCRIPTION =
  "A two-part walking guide to Seongsu — Seoul's K-beauty flagships paired with the local tables the industry actually eats at, plus the warehouse-café crawl just east. One shared, tappable map.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonical("/guides/seongsu") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: canonical("/guides/seongsu"),
  },
};

export default function SeongsuHubPage() {
  const guides = listGuidePosts();
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Seongsu", path: "/guides/seongsu" },
        ])}
      />

      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-accent">
          A Drop of Seoul · Neighborhood series
        </p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">
          Seongsu, the local way
        </h1>
        <p className="mt-4 text-lg text-text-muted">
          Seongsu is where Seoul&apos;s beauty industry actually works — and the
          food scene grew up to feed it. Two connected walks, cross-checked and
          walked by our team: the beauty-and-bites mile, and the warehouse-café
          crawl just east. They share one map, and they link into a single day.
        </p>
      </header>

      <SeongsuMap course={1} className="mx-auto max-w-3xl" />

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {guides.map((post) => (
          <ArticleCard key={post.id} post={post} />
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-3xl">
        <WaitlistForm
          source="seongsu-series"
          heading="Want us to run this walk with you?"
          body="We're building small-group Seongsu guides that run exactly these routes — beauty flagships and local tables, no tourist traps."
          button="Join the waitlist"
        />
      </div>
    </main>
  );
}
