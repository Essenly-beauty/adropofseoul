import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">New product</h1>
      <div className="mt-6">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}
