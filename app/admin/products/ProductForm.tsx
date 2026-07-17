"use client";

import { useFormState } from "react-dom";
import { saveProduct } from "@/app/admin/actions/products";
import { INITIAL_STATE } from "@/app/admin/actions/state";
import type { AdminProduct } from "@/services/admin/types";
import { TextField } from "@/components/admin/TextField";
import { TextAreaField } from "@/components/admin/TextAreaField";
import { UrlField } from "@/components/admin/UrlField";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormError } from "@/components/admin/FormError";

export function ProductForm({ product }: { product?: AdminProduct }) {
  const [state, action] = useFormState(saveProduct, INITIAL_STATE);
  const e = state.errors;
  return (
    <form action={action} className="max-w-3xl">
      {product && <input type="hidden" name="id" value={product.id} />}
      <TextField
        name="name"
        label="Name"
        defaultValue={product?.name}
        error={e.name}
        required
      />
      <TextField name="brand" label="Brand" defaultValue={product?.brand} />
      <TextField
        name="slug"
        label="Slug"
        defaultValue={product?.slug}
        error={e.slug}
        required
      />
      <TextField
        name="category"
        label="Category"
        defaultValue={product?.category}
      />
      <TextAreaField
        name="description"
        label="Description"
        defaultValue={product?.description}
      />
      <TextField
        name="price"
        label="Price (free text, e.g. $17)"
        defaultValue={product?.price}
      />
      <UrlField
        name="image"
        label="Image URL"
        defaultValue={product?.image}
        error={e.image}
      />
      <UrlField
        name="affiliateUrl"
        label="Affiliate URL"
        defaultValue={product?.affiliateUrl}
        error={e.affiliateUrl}
      />
      <TextField
        name="whereToBuy"
        label="Where to buy"
        defaultValue={product?.whereToBuy}
      />
      <TextField
        name="bestFor"
        label="Best for"
        defaultValue={product?.bestFor}
      />
      <TextAreaField
        name="ingredients"
        label="Ingredients"
        defaultValue={product?.ingredients}
      />
      <TextField
        name="rating"
        label="Rating (0–5)"
        defaultValue={product?.rating?.toString() ?? null}
        error={e.rating}
      />
      <label className="mb-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="disclosureRequired"
          defaultChecked={product?.disclosureRequired}
        />
        Requires affiliate disclosure
      </label>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={product?.isPublished}
        />
        Published
      </label>

      {state.formError && <FormError message={state.formError} />}
      <div className="mt-4">
        <SubmitButton>
          {product ? "Save changes" : "Create product"}
        </SubmitButton>
      </div>
    </form>
  );
}
