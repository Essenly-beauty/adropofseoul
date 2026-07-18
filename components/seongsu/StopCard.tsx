import { googleMapsUrl, naverMapUrl, type Stop } from "@/lib/seongsu/courses";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span aria-hidden className="text-accent">
      {"★".repeat(full)}
      <span className="text-text-muted/40">{"☆".repeat(5 - full)}</span>
    </span>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2 text-sm">
      <span aria-hidden className="select-none">
        {icon}
      </span>
      <span className="text-text-muted">
        <span className="font-medium text-text">{label}:</span> {value}
      </span>
    </div>
  );
}

// A compact, self-anchoring card for one stop on a Seongsu course. The `id`
// lets in-body prose links (e.g. [Nonfiction](#stop-nonfiction)) jump here.
export function StopCard({ stop }: { stop: Stop }) {
  const numbered = stop.n > 0;
  return (
    <article
      id={`stop-${stop.id}`}
      className="scroll-mt-24 rounded-lg border border-soft-gray bg-porcelain/40 p-5 md:p-6"
    >
      <div className="flex items-start gap-4">
        {numbered && (
          <span
            aria-hidden
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-bg"
          >
            {stop.n}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {stop.time && (
            <p className="text-[11px] uppercase tracking-label text-text-muted">
              {stop.time}
            </p>
          )}
          <h3 className="mt-0.5 font-serif text-2xl leading-tight">
            {stop.nameEn}{" "}
            <span className="text-lg text-text-muted">{stop.nameKr}</span>
          </h3>
          <p className="mt-1.5 text-sm text-text-muted">
            <Stars rating={stop.rating} />{" "}
            <span className="font-semibold text-text">
              {stop.rating.toFixed(1)}
            </span>
            {stop.reviewCount > 0 && (
              <> ({stop.reviewCount.toLocaleString()})</>
            )}{" "}
            · <span aria-hidden>{stop.emoji}</span> {stop.category}
          </p>
        </div>
      </div>

      <p className="mt-4 border-l-2 border-accent pl-3 text-[15px] italic text-text">
        {stop.verdict}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Field icon="💰" label="Price" value={stop.price} />
        <Field icon="⏳" label="Waiting" value={stop.waiting} />
        <Field icon="⏰" label="Break time" value={stop.breakTime} />
        <Field icon="📅" label="Closed" value={stop.closed} />
        <Field icon="🗣️" label="English / ordering" value={stop.english} />
        <Field icon="📣" label="Nearby" value={stop.nearby} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-text-muted">
        <span className="font-medium text-text">What reviewers say: </span>
        {stop.reviews}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={googleMapsUrl(stop)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-text px-4 py-1.5 text-xs font-medium uppercase tracking-label transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
        >
          Google Maps →
        </a>
        <a
          href={naverMapUrl(stop)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-text px-4 py-1.5 text-xs font-medium uppercase tracking-label transition-colors duration-medium ease-editorial hover:border-accent hover:text-accent"
        >
          네이버 지도 →
        </a>
      </div>
    </article>
  );
}
