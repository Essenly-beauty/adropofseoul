import Link from "next/link";

export function SectionHeading({
  title,
  eyebrow,
  href,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="text-sm text-text-muted hover:text-accent">
          View all →
        </Link>
      )}
    </div>
  );
}
