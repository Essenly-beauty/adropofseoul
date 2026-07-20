import { notFound } from "next/navigation";
import { getAdminProductById } from "@/services/admin/products";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getAdminProductById(params.id);
  if (!product) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit product</h1>
      <p className="mt-1 text-text-muted">{product.name}</p>
      <div className="mt-6">
        <ProductForm mode="edit" product={product} />
      </div>
    </div>
  );
}
