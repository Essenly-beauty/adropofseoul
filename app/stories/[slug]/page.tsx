import { redirect } from "next/navigation";

export default function StoryRedirectPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/articles/${params.slug}`);
}
