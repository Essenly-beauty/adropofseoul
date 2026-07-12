export type ArticleImageMeta = {
  alt: string;
  caption: string;
  creditName: string;
  creditUrl: string;
  licenseName: string;
  licenseUrl: string;
};

export const ARTICLE_IMAGE_META: Record<string, ArticleImageMeta> = {
  "korean-3-step-skincare-routine": {
    alt: "Woman rinsing her face at a bathroom sink for a simple Korean skincare routine",
    caption:
      "A short routine still needs the essentials: cleanse gently, moisturize, and protect by day.",
    creditName: "Vitoria Santos",
    creditUrl: "https://www.pexels.com/photo/2087954/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-5-step-morning-skincare-routine": {
    alt: "Woman applying a serum drop in front of a mirror during a morning skincare routine",
    caption:
      "The five-step morning routine works best when each layer stays light enough for sunscreen.",
    creditName: "Anna Keibalo",
    creditUrl: "https://www.pexels.com/photo/17891763/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-7-step-evening-skincare-routine": {
    alt: "Bathroom counter with cleansing water, skincare bottles, and a face roller after washing",
    caption:
      "A longer evening routine should start with proper cleansing and end with a calm barrier.",
    creditName: "A Darmel",
    creditUrl: "https://www.pexels.com/photo/8990463/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-skip-care-explained": {
    alt: "Minimal amber dropper bottle on a marble surface with dried leaves",
    caption:
      "Skip-care is edited beauty: fewer products, clearer jobs, and less noise for the skin.",
    creditName: "Vie Studio",
    creditUrl: "https://www.pexels.com/photo/4857813/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "toner-pads-as-mini-masks": {
    alt: "Person wearing a sheet mask as a targeted skincare mini mask ritual",
    caption:
      "Toner pads and small masks work best when they are used by zone, not dragged across every concern.",
    creditName: "Polina Kovaleva",
    creditUrl: "https://www.pexels.com/photo/6619517/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "glass-skin-without-10-steps": {
    alt: "Close-up of serum being dropped into hands against a peach background",
    caption:
      "Glass skin is less about a 10-step count and more about hydration, texture, and light reflection.",
    creditName: "Shiny Diamond",
    creditUrl: "https://www.pexels.com/photo/3762879/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-barrier-repair-routine": {
    alt: "Woman applying moisturizer to her cheek as part of a calming barrier repair routine",
    caption:
      "When the barrier is irritated, the best routine is usually the quietest one.",
    creditName: "Cottonbro Studio",
    creditUrl: "https://www.pexels.com/photo/4672599/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "sunscreen-as-skincare-korean-routine": {
    alt: "Flat lay with a sunscreen tube and letters spelling do not skip the sunscreen",
    caption:
      "In a Korean routine, SPF is not beach gear. It is the daily step that protects every other step.",
    creditName: "Tara Winstead",
    creditUrl: "https://www.pexels.com/photo/8384649/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-summer-cooling-skincare-routine": {
    alt: "Beach towel, sun hat, sunglasses, and sunscreen arranged for a hot summer day",
    caption:
      "Summer skincare has to account for heat, sweat, sunscreen, and humidity before adding glow.",
    creditName: "Helloaesthe",
    creditUrl: "https://www.pexels.com/photo/16770366/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-skincare-30s-slow-aging-routine": {
    alt: "Hands applying skincare serum from a dropper on a warm peach background",
    caption:
      "Slow-aging routines work best when prevention, actives, and barrier support stay balanced.",
    creditName: "Itslauravillela",
    creditUrl: "https://www.pexels.com/photo/33794143/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-clinic-to-home-skincare": {
    alt: "Aesthetician performing a facial treatment in a clean clinic room",
    caption:
      "Clinic-to-home skincare borrows from professional treatment culture, but the home routine still needs restraint.",
    creditName: "Gustavo Fring",
    creditUrl: "https://www.pexels.com/photo/7446659/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-post-treatment-recovery-skincare-routine": {
    alt: "Professional skin treatment with blue light over a calming sheet mask",
    caption:
      "After a treatment, recovery is usually calm hydration, barrier support, sunscreen, and patience.",
    creditName: "Emilio Sanchez Hernandez",
    creditUrl: "https://www.pexels.com/photo/32078961/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
};

export function getArticleImageMeta(
  slug: string
): ArticleImageMeta | undefined {
  return ARTICLE_IMAGE_META[slug];
}
