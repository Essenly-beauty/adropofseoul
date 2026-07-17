import { postCounts, listAllPosts } from "@/services/admin/posts";
import { placeCounts, listAllPlaces } from "@/services/admin/places";
import { productCounts, listAllProducts } from "@/services/admin/products";
import { isLive } from "@/lib/admin/workflow";

export const dynamic = "force-dynamic";

function Card({
  title,
  total,
  live,
  hidden,
  href,
}: {
  title: string;
  total: number;
  live: number;
  hidden: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-lg border border-soft-gray bg-white p-5 hover:border-accent"
    >
      <p className="font-serif text-xl">{title}</p>
      <p className="mt-2 text-sm text-text-muted">
        {total} total · {live} live · {hidden} hidden
      </p>
    </a>
  );
}

export default async function AdminDashboard() {
  const [posts, places, products, pc, plc, prc] = await Promise.all([
    listAllPosts(),
    listAllPlaces(),
    listAllProducts(),
    postCounts(),
    placeCounts(),
    productCounts(),
  ]);

  const recent = [
    ...posts.map((p) => ({
      kind: "Post",
      name: p.title,
      href: `/admin/posts/${p.id}`,
      live: isLive(p.status),
      updatedAt: p.updatedAt,
    })),
    ...places.map((p) => ({
      kind: "Place",
      name: p.name,
      href: `/admin/places/${p.id}`,
      live: p.isPublished,
      updatedAt: p.updatedAt,
    })),
    ...products.map((p) => ({
      kind: "Product",
      name: p.name,
      href: `/admin/products/${p.id}`,
      live: p.isPublished,
      updatedAt: p.updatedAt,
    })),
  ]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 8);

  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card title="Posts" {...pc} href="/admin/posts" />
        <Card title="Places" {...plc} href="/admin/places" />
        <Card title="Products" {...prc} href="/admin/products" />
      </div>

      <h2 className="mt-10 font-serif text-2xl">Recently updated</h2>
      {recent.length === 0 ? (
        <p className="mt-2 text-text-muted">
          Nothing yet — create your first post.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-soft-gray rounded-lg border border-soft-gray bg-white">
          {recent.map((r) => (
            <li key={r.href}>
              <a
                href={r.href}
                className="flex items-center justify-between px-4 py-3 hover:bg-soft-gray/40"
              >
                <span>
                  <span className="text-xs uppercase tracking-wide text-text-muted">
                    {r.kind}
                  </span>{" "}
                  {r.name}
                </span>
                <span className="text-xs text-text-muted">
                  {r.live ? "Published" : "Hidden"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
