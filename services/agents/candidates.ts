import { createClient } from "@/lib/supabase/server";
import { dedupeKey } from "@/lib/agents/dedupe";
import type { Candidate } from "@/lib/agents/schemas";
import type { CandidateStatus, PlaceCandidate, WriteResult } from "./types";

type CandidateRow = {
  id: string;
  run_id: string | null;
  name: string;
  area: string;
  category_guess: string | null;
  why_notable: string | null;
  source_urls: string[];
  evidence: { quote: string } | null;
  confidence: number | null;
  dedupe_key: string;
  status: CandidateStatus;
  promoted_place_id: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id,run_id,name,area,category_guess,why_notable,source_urls,evidence,confidence,dedupe_key,status,promoted_place_id,created_at,updated_at";

// Legal review-flow transitions; anything else is a bug or a stale UI.
const TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  new: ["reviewing", "approved", "rejected"],
  reviewing: ["approved", "rejected"],
  approved: ["promoted", "rejected"],
  rejected: [],
  promoted: [],
};

export function isLegalTransition(
  from: CandidateStatus,
  to: CandidateStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function mapCandidateRow(row: CandidateRow): PlaceCandidate {
  return {
    id: row.id,
    runId: row.run_id,
    name: row.name,
    area: row.area,
    categoryGuess: row.category_guess,
    whyNotable: row.why_notable ?? "",
    sourceUrls: row.source_urls ?? [],
    evidenceQuote: row.evidence?.quote ?? "",
    confidence: row.confidence ?? 0,
    dedupeKey: row.dedupe_key,
    status: row.status,
    promotedPlaceId: row.promoted_place_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(runId: string, c: Candidate) {
  return {
    run_id: runId,
    name: c.name,
    area: c.area,
    category_guess: c.categoryGuess,
    why_notable: c.whyNotable,
    source_urls: c.sourceUrls,
    evidence: { quote: c.evidenceQuote },
    confidence: c.confidence,
    dedupe_key: dedupeKey(c.name, c.area),
  };
}

/**
 * Inserts candidates one at a time so a duplicate dedupe_key (23505) skips
 * that candidate instead of failing the batch — re-running an area is
 * idempotent by design.
 */
export async function insertCandidates(
  runId: string,
  candidates: Candidate[]
): Promise<{ ok: true; inserted: number } | WriteResult> {
  const supabase = await createClient();
  let inserted = 0;
  for (const c of candidates) {
    const { error } = await supabase
      .from("place_candidates")
      .insert(toRow(runId, c));
    if (error) {
      if (error.code === "23505") continue; // already discovered — skip
      return { ok: false, code: error.code ?? null, message: error.message };
    }
    inserted++;
  }
  return { ok: true, inserted };
}

export async function listCandidateById(
  id: string
): Promise<PlaceCandidate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("place_candidates")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCandidateRow(data as CandidateRow) : null;
}

/** Dedupe keys of every candidate ever filed for an area (any status) —
 * rejected candidates must not resurface on the next run. */
export async function listCandidateKeysForArea(
  area: string
): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("place_candidates")
    .select("dedupe_key")
    .eq("area", area)
    .limit(2000);
  if (error) throw error;
  const rows = (data as { dedupe_key: string }[] | null) ?? [];
  return new Set(rows.map((r) => r.dedupe_key));
}

export async function listCandidatesByStatus(
  status: CandidateStatus
): Promise<PlaceCandidate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("place_candidates")
    .select(COLUMNS)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as CandidateRow[] | null)?.map(mapCandidateRow) ?? [];
}

export async function setCandidateStatus(
  id: string,
  to: CandidateStatus,
  promotedPlaceId?: string
): Promise<WriteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("place_candidates")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  const current = (data as { status: CandidateStatus } | null)?.status;
  if (!current)
    return { ok: false, code: null, message: "Candidate not found." };
  if (!isLegalTransition(current, to))
    return {
      ok: false,
      code: null,
      message: `Illegal transition: ${current} → ${to}.`,
    };

  const { error: updateError } = await supabase
    .from("place_candidates")
    .update({ status: to, promoted_place_id: promotedPlaceId ?? null })
    .eq("id", id);
  if (updateError)
    return {
      ok: false,
      code: updateError.code ?? null,
      message: updateError.message,
    };
  return { ok: true };
}
