"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  updateProduct,
  removeProduct,
} from "@/services/admin/products";
import { validateProduct } from "@/lib/admin/validate";
import type { ProductInput } from "@/services/admin/types";
import { type FormState, orNull } from "./state";
import { requireAdmin } from "./require-admin";

function readProduct(formData: FormData): ProductInput {
  const ratingRaw = orNull(formData.get("rating"));
  return {
    name: String(formData.get("name") ?? "").trim(),
    brand: orNull(formData.get("brand")),
    slug: String(formData.get("slug") ?? "").trim(),
    category: orNull(formData.get("category")),
    description: orNull(formData.get("description")),
    price: orNull(formData.get("price")),
    image: orNull(formData.get("image")),
    affiliateUrl: orNull(formData.get("affiliateUrl")),
    whereToBuy: orNull(formData.get("whereToBuy")),
    bestFor: orNull(formData.get("bestFor")),
    ingredients: orNull(formData.get("ingredients")),
    rating: ratingRaw === null ? null : Number(ratingRaw),
    disclosureRequired: formData.get("disclosureRequired") === "on",
    isPublished: formData.get("isPublished") === "on",
  };
}

export async function saveProduct(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const id = orNull(formData.get("id"));
  const input = readProduct(formData);

  const errors = validateProduct(input);
  if (Object.keys(errors).length > 0) return { errors };

  const result = id
    ? await updateProduct(id, input)
    : await createProduct(input);
  if (!result.ok) {
    if (result.code === "23505")
      return { errors: { slug: "That slug is already taken." } };
    return { errors: {}, formError: "Could not save. Please try again." };
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();
  const result = await removeProduct(id);
  if (!result.ok) throw new Error(`Delete failed: ${result.message}`);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
