export function readingTime(body: string | null | undefined): number | null {
  if (!body) return null;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return null;
  return Math.max(1, Math.round(words / 200));
}
