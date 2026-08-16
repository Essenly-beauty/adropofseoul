import Link from "next/link";

export function SectionHeading({
  title,
  eyebrow,
  href,
  as: Tag = "h2",
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  /** Landing pages whose section title *is* the page title pass "h1". */
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
        )}
        <Tag className="font-serif text-3xl">{title}</Tag>
      </div>
      {href && (
        <Link href={href} className="text-sm text-text-muted hover:text-accent">
          View all →
        </Link>
      )}
    </div>
  );
}
