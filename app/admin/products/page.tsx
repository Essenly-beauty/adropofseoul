import { listAllProducts } from "@/services/admin/products";
import { liveLabel } from "@/lib/admin/workflow";
import { deleteProduct } from "@/app/admin/actions/products";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ProductsListPage() {
  const products = await listAllProducts();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Products</h1>
        <a
          href="/admin/products/new"
          className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          New product
        </a>
      </div>
      {products.length === 0 ? (
        <p className="mt-6 text-text-muted">No products yet.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-soft-gray text-left text-text-muted">
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
              <th className="py-2">Updated</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-soft-gray">
                <td className="py-2">
                  <a
                    href={`/admin/products/${p.id}`}
                    className="hover:text-accent"
                  >
                    {p.name}
                  </a>
                </td>
                <td className="py-2">{liveLabel(p.isPublished)}</td>
                <td className="py-2 text-text-muted">
                  {p.updatedAt.slice(0, 10)}
                </td>
                <td className="py-2 text-right">
                  <DeleteButton action={deleteProduct.bind(null, p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
