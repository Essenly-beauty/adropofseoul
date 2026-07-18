import type { CourseId } from "@/lib/seongsu/courses";

// Embeds the self-contained interactive course map (public/seongsu_map.html).
// The `course` prop sets which course the map opens on via the ?course= query
// param; the in-map toggle still switches between both courses. Kept as an
// <iframe> (not a React port) so the map stays a single portable artifact and
// its Leaflet/CARTO stack is fully isolated from the app bundle.
export function SeongsuMap({
  course,
  className = "",
}: {
  course: CourseId;
  className?: string;
}) {
  return (
    <figure className={`not-prose my-10 ${className}`}>
      <div className="overflow-hidden rounded-lg border border-soft-gray shadow-sm">
        <iframe
          src={`/seongsu_map.html?course=${course}`}
          title={`Seongsu walking course ${course} — interactive map`}
          loading="lazy"
          className="block h-[640px] w-full border-0"
        />
      </div>
      <figcaption className="mt-2 text-center text-xs text-text-muted">
        Tap a pin or a stop to jump to it — switch between Course 1 and Course 2
        with the toggle.
      </figcaption>
    </figure>
  );
}
