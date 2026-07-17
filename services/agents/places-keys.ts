import { createClient } from "@/lib/supabase/server";
import { dedupeKey } from "@/lib/agents/dedupe";

/** Dedupe keys of REAL places already in the directory for an area — a
 * re-discovered live place must never re-enter the candidate queue. */
export async function listPlaceKeysForArea(area: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select("name,area")
    .eq("area", area)
    .limit(500);
  if (error) throw error;
  const rows = (data as { name: string; area: string | null }[] | null) ?? [];
  return new Set(rows.map((r) => dedupeKey(r.name, r.area ?? area)));
}
