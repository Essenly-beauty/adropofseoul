import { createClient } from "@/lib/supabase/server";
import type { ImageSeed } from "@/lib/agents/schemas";
import type { WriteResult } from "./types";

export type ImageCandidate = ImageSeed & {
  id: string;
  runId: string | null;
  placeCandidateId: string | null;
  area: string;
  status: "new" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
};

type ImageRow = {
  id: string;
  run_id: string | null;
  place_candidate_id: string | null;
  area: string;
  url: string;
  source_url: string;
  source_type: ImageSeed["sourceType"];
  description: string | null;
  suggested_use: ImageSeed["suggestedUse"];
  license: ImageSeed["license"];
  attribution: string | null;
  status: "new" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id,run_id,place_candidate_id,area,url,source_url,source_type,description,suggested_use,license,attribution,status,created_at,updated_at";

export function mapImageRow(row: ImageRow): ImageCandidate {
  return {
    id: row.id,
    runId: row.run_id,
    placeCandidateId: row.place_candidate_id,
    area: row.area,
    url: row.url,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    description: row.description,
    suggestedUse: row.suggested_use,
    license: row.license,
    attribution: row.attribution,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type ImageInsert = ImageSeed & {
  area: string;
  placeCandidateId?: string | null;
};

/** One-at-a-time inserts so a duplicate url (unique, 23505) skips instead of
 * failing the batch — image gathering is idempotent like candidates. */
export async function insertImageCandidates(
  runId: string,
  images: ImageInsert[]
): Promise<
  | { ok: true; inserted: number }
  | { ok: false; code: string | null; message: string }
> {
  const supabase = await createClient();
  let inserted = 0;
  for (const img of images) {
    const { error } = await supabase.from("image_candidates").insert({
      run_id: runId,
      place_candidate_id: img.placeCandidateId ?? null,
      area: img.area,
      url: img.url,
      source_url: img.sourceUrl,
      source_type: img.sourceType,
      description: img.description,
      suggested_use: img.suggestedUse,
      license: img.license,
      attribution: img.attribution,
    });
    if (error) {
      if (error.code === "23505") continue; // already collected — skip
      return { ok: false, code: error.code ?? null, message: error.message };
    }
    inserted++;
  }
  return { ok: true, inserted };
}

export async function listImagesForCandidate(
  placeCandidateId: string
): Promise<ImageCandidate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("image_candidates")
    .select(COLUMNS)
    .eq("place_candidate_id", placeCandidateId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as ImageRow[] | null)?.map(mapImageRow) ?? [];
}

export async function listImagePool(
  status: "new" | "approved" | "rejected" = "new"
): Promise<ImageCandidate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("image_candidates")
    .select(COLUMNS)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as ImageRow[] | null)?.map(mapImageRow) ?? [];
}

export async function setImageStatus(
  id: string,
  status: "approved" | "rejected"
): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("image_candidates")
    .update({ status })
    .eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}
