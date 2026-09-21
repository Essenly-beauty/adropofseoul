import type { Metadata } from "next";
import {
  EditorialArchive,
  type ArchiveParams,
} from "@/components/editorial/EditorialArchive";
import { listEditorialPosts } from "@/services/editorial";
import { SKINCARE_TABS } from "@/lib/taxonomy";
import { buildPageMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "The Edit · Beauty",
  description:
    "Every beauty story in one place — skincare, hair and scalp care, trends, routines, and considered picks.",
  path: "/beauty/the-edit",
});
export default async function BeautyEdit({
  searchParams,
}: {
  searchParams: ArchiveParams;
}) {
  return (
    <EditorialArchive
      title="The Edit"
      description="Our beauty journal — the ideas, people, routines, and products worth a closer look."
      basePath="/beauty/the-edit"
      section="beauty"
      posts={await listEditorialPosts()}
      searchParams={searchParams}
      tabs={SKINCARE_TABS}
      activeTab="edit"
    />
  );
}
