/* eslint-disable @next/next/no-img-element -- arbitrary external hosts;
   optimization happens after the editor uploads picks to Storage. */
import type { ImageCandidate } from "@/services/agents/images";
import { approveImage, rejectImage } from "@/app/admin/actions/candidates";

const LICENSE_LABEL: Record<ImageCandidate["license"], string> = {
  "commercial-ok": "License OK",
  "attribution-required": "Credit required",
  unverified: "Rights unverified",
};

const LICENSE_STYLE: Record<ImageCandidate["license"], string> = {
  "commercial-ok": "bg-green-100 text-green-800",
  "attribution-required": "bg-amber-100 text-amber-800",
  unverified: "bg-red-100 text-red-800",
};

export function ImageCandidateGrid({ images }: { images: ImageCandidate[] }) {
  if (images.length === 0) return null;
  return (
    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((img) => (
        <figure
          key={img.id}
          className="overflow-hidden rounded-lg border border-soft-gray bg-white"
        >
          <img
            src={img.url}
            alt={img.description ?? "image candidate"}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
          <figcaption className="space-y-1 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded-full px-2 py-0.5 ${LICENSE_STYLE[img.license]}`}
              >
                {LICENSE_LABEL[img.license]}
              </span>
              <span className="text-text-muted">
                {img.sourceType} · {img.suggestedUse}
              </span>
            </div>
            {img.attribution && (
              <p className="text-text-muted">Credit: {img.attribution}</p>
            )}
            <a
              href={img.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-accent hover:underline"
            >
              {img.sourceUrl}
            </a>
            {img.status === "new" && (
              <div className="flex items-center gap-3 pt-1">
                <form action={approveImage.bind(null, img.id)}>
                  <button type="submit" className="text-accent hover:underline">
                    Approve
                  </button>
                </form>
                <form action={rejectImage.bind(null, img.id)}>
                  <button
                    type="submit"
                    className="text-red-600 hover:underline"
                  >
                    Reject
                  </button>
                </form>
              </div>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
