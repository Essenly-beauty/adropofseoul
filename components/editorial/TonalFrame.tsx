import Image from "next/image";

const PLACEHOLDER_BG =
  "radial-gradient(120% 120% at 70% 15%, #E9D6CF 0%, rgba(233,214,207,0) 55%), linear-gradient(155deg, #F2EDE5 0%, #E8E2DA 100%)";
const GRAIN = "radial-gradient(rgba(28,28,28,0.05) 0.5px, transparent 0.6px)";

export function TonalFrame({
  src,
  alt,
  label,
  ratio = "aspect-[3/2]",
  sizes,
  priority,
  className = "",
}: {
  src?: string | null;
  alt: string;
  label?: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm ${ratio} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.04]"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: PLACEHOLDER_BG }}
        >
          <div
            className="absolute inset-0 opacity-50"
            style={{ backgroundImage: GRAIN, backgroundSize: "4px 4px" }}
          />
          {label && (
            <span
              className="absolute bottom-3.5 left-4 text-[10.5px] uppercase tracking-label"
              style={{ color: "rgba(28,28,28,0.34)" }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
