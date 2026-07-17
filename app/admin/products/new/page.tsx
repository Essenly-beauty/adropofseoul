import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">New product</h1>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}
