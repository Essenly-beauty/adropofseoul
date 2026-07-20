"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import type { AdminProduct } from "@/services/admin/products";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  type FormState,
} from "@/app/admin/products/actions";
import {
  TextField,
  UrlField,
  NumberField,
  TextArea,
  CheckboxField,
} from "./fields";

export function ProductForm({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: AdminProduct;
}) {
  const action =
    mode === "edit" && product
      ? updateProductAction.bind(null, product.id)
      : createProductAction;
  const [state, formAction] = useFormState(action, { ok: true } as FormState);
  const e = state.errors ?? {};

  return (
    <div className="max-w-2xl">
      {state.formError && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.formError}
        </p>
      )}
      <form action={formAction} className="grid gap-5">
        <TextField
          label="Name"
          name="name"
          defaultValue={product?.name}
          error={e.name}
        />
        <TextField
          label="Brand"
          name="brand"
          defaultValue={product?.brand ?? ""}
        />
        <TextField
          label="Slug"
          name="slug"
          defaultValue={product?.slug}
          readOnly={mode === "edit"}
          error={e.slug}
        />
        <TextField
          label="Category"
          name="category"
          defaultValue={product?.category ?? ""}
        />
        <TextArea
          label="Description"
          name="description"
          defaultValue={product?.description ?? ""}
        />
        <TextField
          label="Price"
          name="price"
          defaultValue={product?.price ?? ""}
        />
        <UrlField
          label="Image"
          name="image"
          defaultValue={product?.image ?? ""}
          error={e.image}
        />
        <UrlField
          label="Affiliate URL"
          name="affiliateUrl"
          defaultValue={product?.affiliateUrl ?? ""}
          error={e.affiliateUrl}
        />
        <TextField
          label="Where to buy"
          name="whereToBuy"
          defaultValue={product?.whereToBuy ?? ""}
        />
        <TextField
          label="Best for"
          name="bestFor"
          defaultValue={product?.bestFor ?? ""}
        />
        <TextArea
          label="Ingredients"
          name="ingredients"
          defaultValue={product?.ingredients ?? ""}
        />
        <NumberField
          label="Rating (0–5)"
          name="rating"
          step="0.1"
          defaultValue={product?.rating != null ? String(product.rating) : ""}
          error={e.rating}
        />
        <CheckboxField
          label="Disclosure required"
          name="disclosureRequired"
          defaultChecked={product?.disclosureRequired ?? false}
        />
        <CheckboxField
          label="Published"
          name="isPublished"
          defaultChecked={product?.isPublished ?? false}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded bg-text px-4 py-2 text-sm text-bg hover:opacity-90"
          >
            {mode === "create" ? "Create product" : "Save changes"}
          </button>
          <Link
            href="/admin/products"
            className="text-sm text-text-muted hover:text-text"
          >
            Cancel
          </Link>
        </div>
      </form>

      {mode === "edit" && product && (
        <form
          action={deleteProductAction.bind(null, product.id)}
          className="mt-8 border-t border-soft-gray pt-6"
          onSubmit={(ev) => {
            if (!confirm("Delete this product? This cannot be undone.")) {
              ev.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete product
          </button>
        </form>
      )}
    </div>
  );
}
