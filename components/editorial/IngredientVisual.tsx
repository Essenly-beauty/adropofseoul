import type { Ingredient } from "@/services/types";
import { functionLabel } from "@/lib/beauty";

const PALETTES: Record<string, string> = {
  humectant:
    "radial-gradient(120% 90% at 18% 18%, rgba(176, 212, 214, 0.86) 0%, rgba(176, 212, 214, 0) 54%), linear-gradient(145deg, #F4F0E8 0%, #DCE8E2 100%)",
  emollient:
    "radial-gradient(110% 90% at 80% 20%, rgba(225, 205, 170, 0.82) 0%, rgba(225, 205, 170, 0) 56%), linear-gradient(145deg, #F5EEE4 0%, #E8DED0 100%)",
  antioxidant:
    "radial-gradient(120% 90% at 18% 18%, rgba(174, 196, 158, 0.82) 0%, rgba(174, 196, 158, 0) 54%), linear-gradient(145deg, #F1EDE2 0%, #DDE4D0 100%)",
  exfoliant:
    "radial-gradient(120% 90% at 80% 18%, rgba(220, 186, 150, 0.78) 0%, rgba(220, 186, 150, 0) 56%), linear-gradient(145deg, #F4EADF 0%, #E9D8C4 100%)",
  brightening:
    "radial-gradient(120% 90% at 80% 18%, rgba(239, 221, 143, 0.72) 0%, rgba(239, 221, 143, 0) 56%), linear-gradient(145deg, #F7F2E3 0%, #E8E2D1 100%)",
  soothing:
    "radial-gradient(120% 90% at 18% 18%, rgba(179, 208, 184, 0.82) 0%, rgba(179, 208, 184, 0) 56%), linear-gradient(145deg, #EEF0E8 0%, #DCE6DA 100%)",
  barrier_support:
    "radial-gradient(110% 90% at 80% 20%, rgba(207, 176, 160, 0.8) 0%, rgba(207, 176, 160, 0) 58%), linear-gradient(145deg, #F2ECE7 0%, #E1D8D1 100%)",
  sebum_control:
    "radial-gradient(120% 90% at 20% 18%, rgba(168, 194, 183, 0.82) 0%, rgba(168, 194, 183, 0) 56%), linear-gradient(145deg, #EEF1EA 0%, #D7E0DA 100%)",
  anti_aging:
    "radial-gradient(120% 90% at 80% 18%, rgba(202, 177, 204, 0.72) 0%, rgba(202, 177, 204, 0) 56%), linear-gradient(145deg, #F0EAEF 0%, #DED8E4 100%)",
};

const GRAIN = "radial-gradient(rgba(28,28,28,0.05) 0.5px, transparent 0.6px)";

export function IngredientVisual({
  ingredient,
  ratio = "aspect-[3/2]",
  className = "",
}: {
  ingredient: Ingredient;
  ratio?: string;
  className?: string;
}) {
  const primary = ingredient.functions[0] ?? "soothing";
  const label = functionLabel(primary);
  const initials = ingredient.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`relative overflow-hidden rounded-sm ${ratio} ${className}`}
      aria-hidden
      style={{
        background: PALETTES[primary] ?? PALETTES.soothing,
      }}
    >
      <div
        className="absolute inset-0 opacity-55"
        style={{ backgroundImage: GRAIN, backgroundSize: "4px 4px" }}
      />
      <div className="absolute inset-x-5 bottom-5 top-5 flex flex-col justify-between">
        <span className="w-fit rounded-full border border-text/10 bg-bg/30 px-3 py-1.5 text-[10px] uppercase tracking-label text-text/55 backdrop-blur">
          {label}
        </span>
        <div>
          <span className="font-serif text-5xl leading-none text-text/20">
            {initials || "IN"}
          </span>
          {ingredient.inciName && (
            <p className="mt-2 line-clamp-1 text-[10px] uppercase tracking-label text-text/40">
              {ingredient.inciName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
