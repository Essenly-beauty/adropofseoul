import { createClient } from "@/lib/supabase/server";
import type { ResearchRun, ResearchRunInput, WriteResult } from "./types";

type RunRow = {
  id: string;
  agent: "research" | "writer";
  area: string;
  status: "running" | "done" | "error";
  source_config: Record<string, unknown> | null;
  prompt_version: string;
  counts: Record<string, number> | null;
  token_cost: number | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
};

const COLUMNS =
  "id,agent,area,status,source_config,prompt_version,counts,token_cost,error,started_at,finished_at";

export function mapRunRow(row: RunRow): ResearchRun {
  return {
    id: row.id,
    agent: row.agent,
    area: row.area,
    status: row.status,
    sourceConfig: row.source_config,
    promptVersion: row.prompt_version,
    counts: row.counts,
    tokenCost: row.token_cost,
    error: row.error,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export async function createRun(input: ResearchRunInput): Promise<WriteResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("research_runs")
    .insert({
      agent: input.agent,
      area: input.area,
      source_config: input.sourceConfig,
      prompt_version: input.promptVersion,
    })
    .select("id")
    .single();
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

export async function finishRun(
  id: string,
  outcome: {
    status: "done" | "error";
    counts?: Record<string, number>;
    tokenCost?: number;
    error?: string;
  }
): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("research_runs")
    .update({
      status: outcome.status,
      counts: outcome.counts ?? null,
      token_cost: outcome.tokenCost ?? null,
      error: outcome.error ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error)
    return { ok: false, code: error.code ?? null, message: error.message };
  return { ok: true };
}

export async function listRecentRuns(): Promise<ResearchRun[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("research_runs")
    .select(COLUMNS)
    .order("started_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as RunRow[] | null)?.map(mapRunRow) ?? [];
}
