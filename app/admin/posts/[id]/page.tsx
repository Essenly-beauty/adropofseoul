import { notFound } from "next/navigation";
import { getAdminPostById } from "@/services/admin/posts";
import { PostForm } from "@/components/admin/PostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getAdminPostById(params.id);
  if (!post) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit post</h1>
      <p className="mt-1 text-text-muted">{post.title}</p>
      <div className="mt-6">
        <PostForm mode="edit" post={post} />
      </div>
    </div>
  );
}
