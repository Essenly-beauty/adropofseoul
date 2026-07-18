export function TagChips({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-soft-gray px-3 py-1.5 text-[11px] uppercase tracking-label text-text-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
