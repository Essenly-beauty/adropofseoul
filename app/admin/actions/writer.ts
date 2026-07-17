"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runWriter, productionWriterDeps } from "@/services/agents/writer";
import { type FormState, orNull } from "./state";
import { requireAdmin } from "./require-admin";

/** Drafts a neighborhood guide from the area's places (Track 3). The result
 * is always a DRAFT post — Human Gate 2 is the editor resolving every
 * [[ NOTE ]] slot in the CMS before publishing. */
export async function draftGuideAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const area = orNull(formData.get("area"));
  if (!area) return { errors: { area: "Enter an area (e.g. Seongsu)." } };

  const result = await runWriter({ area }, productionWriterDeps());
  if (!result.ok) {
    return { errors: {}, formError: `Draft failed: ${result.error}` };
  }

  revalidatePath("/admin/posts");
  redirect(`/admin/posts/${result.postId}`);
}
