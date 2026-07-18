import type { Metadata } from "next";
import { SectionHeading } from "@/components/editorial/SectionHeading";
import { AroundSeoulTabs } from "@/components/editorial/AroundSeoulTabs";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { canonical } from "@/lib/seo";
import { listPublishedPosts } from "@/services/posts";
import { listPillarPosts } from "@/lib/articles/assets";
import { regionForGuide } from "@/lib/taxonomy";
import type { Post } from "@/services/types";

export const metadata: Metadata = {
  title: "Around Seoul · Common",
  description:
    "Seoul explorations that aren't tied to one neighborhood — the city-wide guides.",
  alternates: { canonical: canonical("/around-seoul/common") },
};

export const dynamic = "force-dynamic";

export default async function AroundSeoulCommonPage() {
  // Region-agnostic guides: code-defined pillars (pinned first) + any DB
  // guides posts explicitly tagged region:common.
  let dbPosts: Post[] = [];
  try {
    const guides = await listPublishedPosts({ limit: 96, category: "guides" });
    dbPosts = guides.filter((p) => regionForGuide(p) === "common");
  } catch (err) {
    console.error("around-seoul/common: fetch failed", err);
  }
  const posts: Post[] = [...listPillarPosts({ region: "common" }), ...dbPosts];

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <SectionHeading title="Around Seoul" eyebrow="Guides" />
      <AroundSeoulTabs active="common" />
      {posts.length === 0 ? (
        <p className="max-w-xl text-text-muted">
          City-wide Seoul guides are on the way. In the meantime, explore our
          neighborhood walks under{" "}
          <a
            href="/around-seoul"
            className="text-accent hover:text-accent-hover"
          >
            By neighborhood
          </a>
          .
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {posts.map((p) => (
            <ArticleCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
