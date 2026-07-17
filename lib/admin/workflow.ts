// The SINGLE place status logic lives. V2 extends POST_STATUSES here (plus an
// additive `ALTER TYPE post_status ADD VALUE` migration) — see spec §7.
export const POST_STATUSES: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
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
