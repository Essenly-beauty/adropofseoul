import { listAllPosts } from "@/services/admin/posts";
import { statusLabel } from "@/lib/admin/workflow";
import { deletePost } from "@/app/admin/actions/posts";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function PostsListPage() {
  const posts = await listAllPosts();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Posts</h1>
        <a
          href="/admin/posts/new"
          className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          New post
        </a>
      </div>
      {posts.length === 0 ? (
        <p className="mt-6 text-text-muted">No posts yet.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-soft-gray text-left text-text-muted">
              <th className="py-2">Title</th>
              <th className="py-2">Status</th>
              <th className="py-2">Updated</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-soft-gray">
                <td className="py-2">
                  <a
                    href={`/admin/posts/${p.id}`}
                    className="hover:text-accent"
                  >
                    {p.title}
                  </a>
                </td>
                <td className="py-2">{statusLabel(p.status)}</td>
                <td className="py-2 text-text-muted">
                  {p.updatedAt.slice(0, 10)}
                </td>
                <td className="py-2 text-right">
                  <DeleteButton action={deletePost.bind(null, p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
