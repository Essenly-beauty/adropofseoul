import type { Stop } from "@/lib/seongsu/courses";
import { StopCard } from "./StopCard";

// A titled section of stop cards (the numbered walk, plus optional alternates
// and deep-local detours). Rendered outside the prose column so the cards get
// full width.
export function StopSection({
  title,
  intro,
  stops,
  eyebrow,
}: {
  title: string;
  intro?: string;
  stops: Stop[];
  eyebrow?: string;
}) {
  if (stops.length === 0) return null;
  return (
    <section className="not-prose my-12">
      {eyebrow && (
        <p className="text-[11px] font-medium uppercase tracking-label text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 font-serif text-3xl">{title}</h2>
      {intro && <p className="mt-2 max-w-2xl text-text-muted">{intro}</p>}
      <div className="mt-6 grid gap-5">
        {stops.map((stop) => (
          <StopCard key={stop.id} stop={stop} />
        ))}
      </div>
    </section>
  );
}
