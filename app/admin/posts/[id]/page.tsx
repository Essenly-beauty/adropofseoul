import { notFound } from "next/navigation";
import { getPostById } from "@/services/admin/posts";
import { PostForm } from "../PostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPostById(params.id);
  if (!post) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit post</h1>
      <div className="mt-6">
        <PostForm post={post} />
      </div>
    </div>
  );
}
