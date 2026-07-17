/** Candidates below this combined confidence need extra editor scrutiny;
 * evidence-less candidates are capped beneath it by construction. */
export const APPROVAL_THRESHOLD = 0.6;

const NO_EVIDENCE_CAP = APPROVAL_THRESHOLD - 0.1;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Blends the model's self-reported confidence with corroboration signals:
 * each extra independent source adds a diminishing bonus, and a candidate
 * with no verbatim evidence quote can never look approval-ready.
 */
export function combinedConfidence({
  modelConfidence,
  sourceCount,
  hasEvidence,
}: {
  modelConfidence: number;
  sourceCount: number;
  hasEvidence: boolean;
}): number {
  const base = clamp01(modelConfidence);
  // 1 source: +0; each additional source adds a halving bonus (max ~+0.15).
  const corroboration =
    0.15 * (1 - Math.pow(0.5, Math.max(0, sourceCount - 1)));
  const score = clamp01(base * 0.85 + corroboration);
  return hasEvidence ? score : Math.min(score, NO_EVIDENCE_CAP);
}
