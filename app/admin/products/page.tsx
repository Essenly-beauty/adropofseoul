import Link from "next/link";
import { listAllProducts } from "@/services/admin/products";

export const dynamic = "force-dynamic";

const FLASH: Record<string, string> = {
  created: "Product created.",
  updated: "Product updated.",
  deleted: "Product deleted.",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { created?: string; updated?: string; deleted?: string };
}) {
  const products = await listAllProducts();
  const flashKey = Object.keys(FLASH).find(
    (k) => (searchParams as Record<string, string>)[k]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded bg-text px-4 py-2 text-sm text-bg hover:opacity-90"
        >
          New product
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
            <th className="py-2">Name</th>
            <th className="py-2">Brand</th>
            <th className="py-2">Status</th>
            <th className="py-2">Updated</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-soft-gray/60">
              <td className="py-2">{p.name}</td>
              <td className="py-2">{p.brand ?? "—"}</td>
              <td className="py-2">
                {p.isPublished ? (
                  <span className="text-green-700">Published</span>
                ) : (
                  <span className="text-text-muted">Draft</span>
                )}
              </td>
              <td className="py-2">{p.updatedAt?.slice(0, 10)}</td>
              <td className="py-2 text-right">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-accent hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && (
        <p className="mt-6 text-text-muted">No products yet.</p>
      )}
    </div>
  );
}
