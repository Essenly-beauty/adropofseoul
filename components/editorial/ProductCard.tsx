import Image from "next/image";
import type { Product } from "@/services/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-lg border border-soft-gray bg-white p-4">
      {product.image && (
        <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-soft-gray">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
      )}
      {product.brand && (
        <p className="text-xs uppercase tracking-wide text-text-muted">
          {product.brand}
        </p>
      )}
      <h3 className="font-serif text-lg">{product.name}</h3>
      <div className="mt-1 flex items-center justify-between">
        {product.price && <span className="text-sm">{product.price}</span>}
        {product.affiliateUrl && (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-sm text-accent hover:text-accent-hover"
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
