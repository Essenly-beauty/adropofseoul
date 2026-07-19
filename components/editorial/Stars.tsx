// Five-glyph star rating, shared by course stop cards and the places
// directory. Rounds to the nearest whole star.
export function Stars({ rating }: { rating: number }) {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span aria-hidden className="text-accent">
      {"★".repeat(full)}
      <span className="text-text-muted/40">{"☆".repeat(5 - full)}</span>
    </span>
  );
}
