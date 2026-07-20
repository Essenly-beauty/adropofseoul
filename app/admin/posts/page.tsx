import Link from "next/link";
import { listAllPosts } from "@/services/admin/posts";

export const dynamic = "force-dynamic";

const FLASH: Record<string, string> = {
  created: "Post created.",
  updated: "Post updated.",
  deleted: "Post deleted.",
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: { created?: string; updated?: string; deleted?: string };
}) {
  const posts = await listAllPosts();
  const flashKey = Object.keys(FLASH).find(
    (k) => (searchParams as Record<string, string>)[k]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded bg-text px-4 py-2 text-sm text-bg hover:opacity-90"
        >
          New post
        </Link>
      </div>
      {flashKey && (
        <p className="mt-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {FLASH[flashKey]}
        </p>
      )}
      <table className="mt-6 w-full text-sm">
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
            <tr key={p.id} className="border-b border-soft-gray/60">
              <td className="py-2">{p.title}</td>
              <td className="py-2">{p.status}</td>
              <td className="py-2">{p.updatedAt?.slice(0, 10)}</td>
              <td className="py-2 text-right">
                <Link
                  href={`/admin/posts/${p.id}`}
                  className="text-accent hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {posts.length === 0 && (
        <p className="mt-6 text-text-muted">No posts yet.</p>
      )}
    </div>
  );
}
