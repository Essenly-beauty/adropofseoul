import type { Product } from "@/services/types";
import { TonalFrame } from "./TonalFrame";

const RETAILER_LABELS: Record<string, string> = {
  oliveyoung_global: "Olive Young",
  amazon_us: "Amazon",
};

export function ProductCard({ product }: { product: Product }) {
  const shopLinks =
    product.offers.length > 0
      ? product.offers.map((o) => ({
          label: RETAILER_LABELS[o.retailer] ?? "Shop",
          url: o.url,
        }))
      : product.affiliateUrl
        ? [{ label: "Shop", url: product.affiliateUrl }]
        : [];

  return (
    <div className="group">
      <div className="relative">
        <TonalFrame
          src={product.image}
          alt={product.name}
          label={product.category ?? undefined}
          ratio="aspect-square"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {product.awardBadge && (
          <span className="absolute left-2 top-2 rounded-sm bg-white/90 px-2 py-1 text-[10px] uppercase tracking-label">
            {product.awardBadge}
          </span>
        )}
      </div>
      {product.brand && (
        <p className="mt-3.5 text-[10.5px] uppercase tracking-label text-text-muted">
          {product.brand}
        </p>
      )}
      <h3 className="mt-1 font-serif text-lg leading-tight">{product.name}</h3>
      {product.tags.length > 0 && (
        <p className="mt-1 text-[11px] text-text-muted">
          {product.tags.slice(0, 3).join(" · ")}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        {product.price && (
          <span className="text-sm tabular-nums">{product.price}</span>
        )}
        {shopLinks.length > 0 && (
          <span className="flex flex-wrap justify-end gap-x-3 gap-y-1">
            {shopLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-[11px] uppercase tracking-label text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
              >
                {l.label} →
              </a>
            ))}
          </span>
        )}
      </div>
      {product.disclosureRequired && (
        <p className="mt-2 text-[11px] text-text-muted">
          Contains affiliate links. The editor of this site may personally earn
          a commission at no extra cost to you.
        </p>
      )}
    </div>
  );
}
