"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPlace, getPlaceBySlug } from "@/services/admin/places";
import {
  listCandidateById,
  setCandidateStatus,
} from "@/services/agents/candidates";
import { setImageStatus } from "@/services/agents/images";
import { runResearch, productionDeps } from "@/services/agents/research";
import { slugify } from "@/lib/slug";
import { type FormState, orNull } from "./state";
import { requireAdmin } from "./require-admin";

/**
 * HUMAN GATE 1 (spec §5.3). Approve promotes the candidate into an
 * UNPUBLISHED places draft via the admin create path — there is no route from
 * here to the public site without the editor separately publishing the place.
 */
export async function approveCandidate(id: string): Promise<void> {
  await requireAdmin();
  const candidate = await listCandidateById(id);
  if (!candidate) throw new Error("Candidate not found.");

  // Korean-only names slugify to "" — fall back to a candidate-stable slug so
  // every place gets a valid, unique URL.
  const slug = slugify(candidate.name) || `place-${candidate.id.slice(0, 8)}`;

  const created = await createPlace({
    name: candidate.name,
    nameKr: candidate.nameKr,
    slug,
    category: candidate.categoryGuess ?? "shop",
    area: candidate.area,
    address: candidate.addressHint,
    geoLat: null,
    geoLng: null,
    priceMinKrw: null,
    priceMaxKrw: null,
    bookingChannel: null,
    depositPolicy: null,
    editorialStatus: "sample", // data unverified until the editor checks it
    lastVerifiedAt: null,
    shortDescription: null,
    longDescription: null,
    whyWeLikeIt: candidate.whyNotable || null,
    bestFor: null,
    priceRange: null,
    instagramUrl: null,
    naverMapUrl: null,
    googleMapUrl: null,
    bookingUrl: null,
    contactEmail: null,
    contactPhone: null,
    languages: [],
    isPublished: false, // draft — Gate 1 never publishes
    notes: [
      "Promoted from research candidate.",
      `Evidence: "${candidate.evidenceQuote}"`,
      `Sources: ${candidate.sourceUrls.join(", ")}`,
    ].join("\n"),
  });
  let placeId: string;
  if (created.ok && created.id) {
    placeId = created.id;
  } else if (!created.ok && created.code === "23505") {
    // A place with this slug already exists — most likely a prior
    // half-finished promotion of THIS candidate. Reuse it instead of
    // erroring or creating a duplicate (idempotent recovery).
    const existing = await getPlaceBySlug(slug);
    if (!existing)
      throw new Error(`Could not create place: ${created.message}`);
    placeId = existing.id;
  } else {
    throw new Error(
      `Could not create place: ${!created.ok ? created.message : "no id"}`
    );
  }

  const moved = await setCandidateStatus(id, "promoted", placeId);
  if (!moved.ok) throw new Error(moved.message);

  revalidatePath("/admin/candidates");
  redirect(`/admin/places/${placeId}`);
}

export async function rejectCandidate(id: string): Promise<void> {
  await requireAdmin();
  const moved = await setCandidateStatus(id, "rejected");
  if (!moved.ok) throw new Error(moved.message);
  revalidatePath("/admin/candidates");
  redirect("/admin/candidates");
}

export async function runResearchAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const area = orNull(formData.get("area"));
  if (!area) return { errors: { area: "Enter an area (e.g. Seongsu)." } };
  const images = formData.get("images") === "on";

  const result = await runResearch({ area, images }, productionDeps());
  if (!result.ok) {
    return { errors: {}, formError: `Research failed: ${result.error}` };
  }

  revalidatePath("/admin/candidates");
  redirect(
    `/admin/candidates?ran=${encodeURIComponent(area)}&kept=${result.kept}&dropped=${result.dropped}&images=${result.images}`
  );
}

export async function approveImage(id: string): Promise<void> {
  await requireAdmin();
  const r = await setImageStatus(id, "approved");
  if (!r.ok) throw new Error(r.message);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/candidates/[id]", "page");
}

export async function rejectImage(id: string): Promise<void> {
  await requireAdmin();
  const r = await setImageStatus(id, "rejected");
  if (!r.ok) throw new Error(r.message);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/candidates/[id]", "page");
}
