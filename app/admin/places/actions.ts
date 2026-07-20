"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";
import { parsePlaceForm } from "@/lib/admin/places";
import { createPlace, updatePlace, deletePlace } from "@/services/admin/places";

export type FormState = {
  ok: boolean;
  errors?: Record<string, string>;
  formError?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAllowedAdmin(user?.email)) redirect("/admin/login");
}

function revalidatePlaces() {
  revalidatePath("/admin/places");
  revalidatePath("/places");
  revalidatePath("/places/[slug]", "page");
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

export async function createPlaceAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePlaceForm(formData, { mode: "create" });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  try {
    await createPlace(parsed.value);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { slug: "That slug already exists." } };
    }
    return { ok: false, formError: "Could not save. Please try again." };
  }
  revalidatePlaces();
  redirect("/admin/places?created=1");
}

export async function updatePlaceAction(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePlaceForm(formData, { mode: "edit" });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  try {
    await updatePlace(id, parsed.value);
  } catch {
    return { ok: false, formError: "Could not save. Please try again." };
  }
  revalidatePlaces();
  redirect("/admin/places?updated=1");
}

export async function deletePlaceAction(id: string): Promise<void> {
  await requireAdmin();
  await deletePlace(id);
  revalidatePlaces();
  redirect("/admin/places?deleted=1");
}
