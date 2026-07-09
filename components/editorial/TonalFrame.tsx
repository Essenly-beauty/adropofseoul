import Image from "next/image";

const PLACEHOLDER_BG =
  "radial-gradient(120% 120% at 70% 15%, #E9D6CF 0%, rgba(233,214,207,0) 55%), linear-gradient(155deg, #F2EDE5 0%, #E8E2DA 100%)";
const GRAIN = "radial-gradient(rgba(28,28,28,0.05) 0.5px, transparent 0.6px)";

// Warm "Essenly" brand treatment for editorial thumbnails: a light warmth on
// the photo plus a soft porcelain/blush scrim, so any sourced stock image reads
// as part of the same palette. Kept subtle on purpose. Opt OUT for product
// shots (`branded={false}`) where color accuracy matters.
const BRAND_FILTER =
  "sepia(0.12) saturate(1.05) contrast(1.02) brightness(1.01)";
const BRAND_SCRIM =
  "linear-gradient(180deg, rgba(233,214,207,0.16) 0%, rgba(242,237,229,0.06) 45%, rgba(28,28,28,0.10) 100%)";

export function TonalFrame({
  src,
  alt,
  label,
  ratio = "aspect-[3/2]",
  sizes,
  priority,
  branded = false,
  className = "",
}: {
  src?: string | null;
  alt: string;
  label?: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  branded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm ${ratio} ${className}`}
    >
      {src ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.04]"
            style={branded ? { filter: BRAND_FILTER } : undefined}
          />
          {branded && (
            <div
              aria-hidden
              data-brand-tint
              className="pointer-events-none absolute inset-0 mix-blend-multiply"
              style={{ background: BRAND_SCRIM }}
            />
          )}
        </>
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
