import type { Product } from "@/services/types";
import { TonalFrame } from "./TonalFrame";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group">
      <TonalFrame
        src={product.image}
        alt={product.name}
        label={product.category ?? undefined}
        ratio="aspect-square"
        sizes="(max-width: 768px) 50vw, 25vw"
      />
      {product.brand && (
        <p className="mt-3.5 text-[10.5px] uppercase tracking-label text-text-muted">
          {product.brand}
        </p>
      )}
      <h3 className="mt-1 font-serif text-lg leading-tight">{product.name}</h3>
      <div className="mt-2 flex items-center justify-between">
        {product.price && (
          <span className="text-sm tabular-nums">{product.price}</span>
        )}
        {product.affiliateUrl && (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-[11px] uppercase tracking-label text-accent transition-colors duration-medium ease-editorial hover:text-accent-hover"
          >
            Shop →
          </a>
        )}
      </div>
      {product.disclosureRequired && (
        <p className="mt-2 text-[11px] text-text-muted">
          Contains affiliate links. We may earn a commission.
        </p>
      )}
    </div>
  );
}
