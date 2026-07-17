import type { Candidate } from "@/lib/agents/schemas";
export type { WriteResult } from "@/services/admin/types";

export type ResearchRunInput = {
  agent: "research" | "writer";
  area: string;
  sourceConfig: Record<string, unknown> | null;
  promptVersion: string;
};

export type ResearchRun = ResearchRunInput & {
  id: string;
  status: "running" | "done" | "error";
  counts: Record<string, number> | null;
  tokenCost: number | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type CandidateStatus =
  "new" | "reviewing" | "approved" | "rejected" | "promoted";

// Persisted candidates don't carry inline image lists — images live in the
// image_candidates table, linked by place_candidate_id.
export type PlaceCandidate = Omit<Candidate, "imageUrls"> & {
  id: string;
  runId: string | null;
  dedupeKey: string;
  status: CandidateStatus;
  promotedPlaceId: string | null;
  createdAt: string;
  updatedAt: string;
};
