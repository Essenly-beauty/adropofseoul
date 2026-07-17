// The SINGLE place status logic lives (admin-cms spec §7 rule 1). The V2
// editorial workflow statuses landed with migration 0003 (agents Track 1).
export const POST_STATUSES: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "research", label: "Research" },
  { value: "ai_review", label: "AI Review" },
  { value: "ready", label: "Ready" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const LIVE_STATUSES = new Set(["published"]);

export function isLive(status: string): boolean {
  return LIVE_STATUSES.has(status);
}

export function statusLabel(status: string): string {
  return POST_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function liveLabel(isPublished: boolean): string {
  return isPublished ? "Published" : "Hidden";
}
