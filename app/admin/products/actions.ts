"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/auth";
import { parseProductForm } from "@/lib/admin/products";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/admin/products";

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

function revalidateProducts() {
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "23505"
  );
}

export async function createProductAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseProductForm(formData, { mode: "create" });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  try {
    await createProduct(parsed.value);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, errors: { slug: "That slug already exists." } };
    }
    return { ok: false, formError: "Could not save. Please try again." };
  }
  revalidateProducts();
  redirect("/admin/products?created=1");
}

export async function updateProductAction(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseProductForm(formData, { mode: "edit" });
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  try {
    await updateProduct(id, parsed.value);
  } catch {
    return { ok: false, formError: "Could not save. Please try again." };
  }
  revalidateProducts();
  redirect("/admin/products?updated=1");
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteProduct(id);
  revalidateProducts();
  redirect("/admin/products?deleted=1");
}
