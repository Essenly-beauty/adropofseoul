// Upserts content/place-candidates/*.json into place_candidates and place_evidence.
// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-place-candidates.mjs
// (reads .env.local automatically if the vars are not already set)
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function env(key) {
  if (process.env[key]) return process.env[key];
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split(
    "\n"
  )) {
    if (line.startsWith(key + "="))
      return line
        .slice(key.length + 1)
        .trim()
        .replace(/^"|"$/g, "");
  }
  throw new Error("missing " + key);
}

async function request(path, options = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SRK,
      Authorization: "Bearer " + SRK,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : null;
}

const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SRK = env("SUPABASE_SERVICE_ROLE_KEY");
const dir = join(root, "content/place-candidates");

const files = readdirSync(dir).filter((file) => file.endsWith(".json"));
const batches = files.map((file) =>
  JSON.parse(readFileSync(join(dir, file), "utf8"))
);
const candidates = batches.flatMap((batch) => batch.candidates || []);

const rows = candidates.map((item) => ({
  slug: item.slug,
  name_ko: item.nameKo,
  name_en: item.nameEn,
  category: item.category,
  neighborhood: item.neighborhood,
  candidate_status: item.candidateStatus || "watch",
  local_signal_score: item.scores?.localSignal ?? 0,
  traveler_signal_score: item.scores?.travelerSignal ?? 0,
  editorial_fit_score: item.scores?.editorialFit ?? 0,
  verification_score: item.scores?.verification ?? 0,
  tourist_heavy_score: item.scores?.touristHeavy ?? 0,
  editorial_angle: item.editorialAngle,
  official_url: item.officialUrl,
  instagram_url: item.instagramUrl,
  naver_map_url: item.naverMapUrl,
  kakao_map_url: item.kakaoMapUrl,
  google_map_url: item.googleMapUrl,
  tripadvisor_url: item.tripadvisorUrl,
  reddit_urls: item.redditUrls || [],
  notes: item.notes,
}));

await request("place_candidates?on_conflict=slug", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify(rows),
});

const slugList = candidates.map((item) => `"${item.slug}"`).join(",");
const saved = await request(
  `place_candidates?select=id,slug&slug=in.(${slugList})`
);
const idsBySlug = new Map(saved.map((row) => [row.slug, row.id]));
const ids = saved.map((row) => row.id);

if (ids.length) {
  await request(`place_evidence?place_candidate_id=in.(${ids.join(",")})`, {
    method: "DELETE",
  });
}

const evidenceRows = candidates.flatMap((item) => {
  const placeCandidateId = idsBySlug.get(item.slug);
  return (item.evidence || []).map((evidence) => ({
    place_candidate_id: placeCandidateId,
    source_type: evidence.sourceType,
    source_name: evidence.sourceName,
    url: evidence.url,
    evidence_kind: evidence.evidenceKind,
    observed_value: evidence.observedValue,
    confidence: evidence.confidence || 3,
    notes: evidence.notes,
  }));
});

if (evidenceRows.length) {
  await request("place_evidence", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(evidenceRows),
  });
}

console.log(
  `Seeded ${rows.length} place candidates and ${evidenceRows.length} evidence rows.`
);
