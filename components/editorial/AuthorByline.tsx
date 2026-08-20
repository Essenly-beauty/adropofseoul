import Link from "next/link";

const EDITORIAL_BYLINES = new Set([
  "A Drop of Seoul Editorial",
  "Editorial Team",
]);

export function AuthorByline({
  author,
  publishedAt,
}: {
  author?: string | null;
  publishedAt?: string | null;
}) {
  if (!author && !publishedAt) return null;

  return (
    <p className="text-sm text-text-muted">
      {author && (
        <>
          By{" "}
          {EDITORIAL_BYLINES.has(author) ? (
            <Link
              href="/editorial-standards"
              className="underline decoration-soft-gray underline-offset-2 transition-colors hover:text-accent"
            >
              {author}
            </Link>
          ) : (
            author
          )}
        </>
      )}
      {author && publishedAt && " · "}
      {publishedAt && (
        <time dateTime={publishedAt}>
          {new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          }).format(new Date(publishedAt))}
        </time>
      )}
    </p>
  );
}

export function EditorialNote() {
  return (
    <aside className="mt-10 border-t border-soft-gray pt-5 text-xs leading-relaxed text-text-muted">
      We distinguish firsthand experience from researched recommendations and
      update time-sensitive details when they change. Read our{" "}
      <Link
        href="/editorial-standards"
        className="text-accent hover:text-accent-hover"
      >
        editorial and sourcing standards
      </Link>
      .
    </aside>
  );
}
