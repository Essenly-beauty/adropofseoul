import { notFound } from "next/navigation";
import { getProductById } from "@/services/admin/products";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductById(params.id);
  if (!product) notFound();
  return (
    <div>
      <h1 className="font-serif text-3xl">Edit product</h1>
      <div className="mt-6">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
