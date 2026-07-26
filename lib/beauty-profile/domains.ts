// The two Beauty Profile domains (Essenly Phase 1). "Beauty Profile" is the
// umbrella; Skin Profile and Hair Profile are its domains (docs/00 §6.3,
// docs/04 §8). Hair is live today as a profile chooser (the six hair
// archetypes in lib/haircare/profiles); Skin's taxonomy is not yet approved,
// so it renders a "coming soon" state rather than invented content.

export type BeautyProfileDomainStatus = "available" | "coming_soon";

export type BeautyProfileDomain = {
  slug: "skin" | "hair";
  label: string;
  href: string;
  status: BeautyProfileDomainStatus;
  blurb: string;
  estimatedTime: string;
};

export const BEAUTY_PROFILE_DOMAINS: BeautyProfileDomain[] = [
  {
    slug: "hair",
    label: "Hair Profile",
    href: "/beauty-profile/hair",
    status: "available",
    blurb:
      "Your scalp, strands, damage level, and ideal routine — through the lens of Korean hair care.",
    estimatedTime: "About 2 minutes",
  },
  {
    slug: "skin",
    label: "Skin Profile",
    href: "/beauty-profile/skin",
    status: "coming_soon",
    blurb:
      "Your skin's tendencies, sensitivities, and goals — matched to a Korean skincare approach.",
    estimatedTime: "About 2 minutes",
  },
];

export function getBeautyProfileDomain(
  slug: string
): BeautyProfileDomain | undefined {
  return BEAUTY_PROFILE_DOMAINS.find((d) => d.slug === slug);
}
