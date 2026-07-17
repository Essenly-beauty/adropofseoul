"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPlace, updatePlace, removePlace } from "@/services/admin/places";
import { validatePlace } from "@/lib/admin/validate";
import type { PlaceInput } from "@/services/admin/types";
import { type FormState, orNull } from "./state";
import { requireAdmin } from "./require-admin";

function readPlace(formData: FormData): PlaceInput {
  const languages = String(formData.get("languages") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    area: orNull(formData.get("area")),
    address: orNull(formData.get("address")),
    shortDescription: orNull(formData.get("shortDescription")),
    longDescription: orNull(formData.get("longDescription")),
    whyWeLikeIt: orNull(formData.get("whyWeLikeIt")),
    bestFor: orNull(formData.get("bestFor")),
    priceRange: orNull(formData.get("priceRange")),
    instagramUrl: orNull(formData.get("instagramUrl")),
    naverMapUrl: orNull(formData.get("naverMapUrl")),
    googleMapUrl: orNull(formData.get("googleMapUrl")),
    bookingUrl: orNull(formData.get("bookingUrl")),
    contactEmail: orNull(formData.get("contactEmail")),
    contactPhone: orNull(formData.get("contactPhone")),
    languages,
    isPublished: formData.get("isPublished") === "on",
    notes: orNull(formData.get("notes")),
  };
}

export async function savePlace(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const id = orNull(formData.get("id"));
  const input = readPlace(formData);

  const errors = validatePlace(input);
  if (Object.keys(errors).length > 0) return { errors };

  const result = id ? await updatePlace(id, input) : await createPlace(input);
  if (!result.ok) {
    if (result.code === "23505")
      return { errors: { slug: "That slug is already taken." } };
    return { errors: {}, formError: "Could not save. Please try again." };
  }

  revalidatePath("/admin/places");
  redirect("/admin/places");
}

export async function deletePlace(id: string): Promise<void> {
  await requireAdmin();
  const result = await removePlace(id);
  if (!result.ok) throw new Error(`Delete failed: ${result.message}`);
  revalidatePath("/admin/places");
  redirect("/admin/places");
}
