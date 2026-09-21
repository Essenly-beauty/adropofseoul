import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  EditorialArchive,
  type ArchiveParams,
} from "@/components/editorial/EditorialArchive";
import { listEditorialPosts } from "@/services/editorial";
import { buildPageMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "All Stories",
  description:
    "All our stories — Seoul life, places, and Korean beauty. Search or browse by section and keyword.",
  path: "/stories",
});
export default async function StoriesPage({
  searchParams,
}: {
  searchParams: ArchiveParams;
}) {
  // Keep old archive filters useful after the navigation changes.
  if (["seoul", "wellness", "shopping"].includes(searchParams.filter ?? "")) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    );
    params.delete("filter");
    if (searchParams.filter === "seoul") params.set("filter", "places");
    else params.set("keyword", searchParams.filter!);
    redirect(`/stories?${params}`);
  }
  return (
    <EditorialArchive
      title="All Stories"
      description="Every story in one place. Browse Seoul life, places, and Korean beauty, or follow a keyword across them."
      basePath="/stories"
      posts={await listEditorialPosts()}
      searchParams={searchParams}
    />
  );
}
