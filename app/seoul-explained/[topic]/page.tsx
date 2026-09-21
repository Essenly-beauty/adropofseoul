import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  EditorialArchive,
  type ArchiveParams,
} from "@/components/editorial/EditorialArchive";
import { listEditorialPosts } from "@/services/editorial";
import { EDITORIAL_TOPICS } from "@/lib/editorial-taxonomy";
import { buildPageMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
const topics = EDITORIAL_TOPICS.filter((t) => t.section === "explained");
const descriptions: Record<string, string> = {
  "everyday-life":
    "The habits, relationships, rituals, and everyday details that make Korea make sense.",
  "food-drink": "What we eat and drink, and the everyday stories behind it.",
  shopping:
    "How we shop, what is worth bringing home, and the little things to know before you buy.",
};
export function generateMetadata({
  params,
}: {
  params: { topic: string };
}): Metadata {
  const topic = topics.find((t) => t.key === params.topic);
  if (!topic) return {};
  return buildPageMetadata({
    title: `${topic.label} · Seoul, Explained`,
    description: descriptions[topic.key],
    path: topic.href,
  });
}
export default async function ExplainedTopic({
  params,
  searchParams,
}: {
  params: { topic: string };
  searchParams: ArchiveParams;
}) {
  const topic = topics.find((t) => t.key === params.topic);
  if (!topic) notFound();
  return (
    <EditorialArchive
      title={topic.label}
      description={descriptions[topic.key]}
      basePath={topic.href}
      section="explained"
      topic={topic.key}
      posts={await listEditorialPosts()}
      searchParams={searchParams}
      tabs={[{ key: "all", label: "All", href: "/seoul-explained" }, ...topics]}
      activeTab={topic.key}
    />
  );
}
