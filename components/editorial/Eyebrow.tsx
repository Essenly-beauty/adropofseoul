export function Eyebrow({
  children,
  tone = "accent",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "accent" | "muted";
  className?: string;
}) {
  const color = tone === "accent" ? "text-accent" : "text-text-muted";
  return (
    <p
      className={`text-[11px] font-medium uppercase tracking-label ${color} ${className}`}
    >
      {children}
    </p>
  );
}
