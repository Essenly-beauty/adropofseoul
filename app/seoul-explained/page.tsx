import type { Metadata } from "next";
import {
  EditorialArchive,
  type ArchiveParams,
} from "@/components/editorial/EditorialArchive";
import { listEditorialPosts } from "@/services/editorial";
import { EDITORIAL_TOPICS } from "@/lib/editorial-taxonomy";
import { buildPageMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Seoul, Explained",
  description:
    "The habits, food, and shopping that shape Korean life — explained from Seoul.",
  path: "/seoul-explained",
});
export default async function ExplainedPage({
  searchParams,
}: {
  searchParams: ArchiveParams;
}) {
  return (
    <EditorialArchive
      title="Seoul, Explained"
      description="The habits, food, and shopping that shape Korean life — explained from Seoul."
      basePath="/seoul-explained"
      section="explained"
      posts={await listEditorialPosts()}
      searchParams={searchParams}
      tabs={[
        { key: "all", label: "All", href: "/seoul-explained" },
        ...EDITORIAL_TOPICS.filter((t) => t.section === "explained"),
      ]}
    />
  );
}
