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
    alt: "East Asian woman in a white robe opening a moisturizer jar for a simple skincare routine",
    caption:
      "A short routine still needs the essentials: cleanse gently, moisturize, and protect by day.",
    creditName: "Polina Tankilevitch",
    creditUrl: "https://www.pexels.com/photo/5468646/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-5-step-morning-skincare-routine": {
    alt: "East Asian woman applying serum from a dropper against a soft pink studio background",
    caption:
      "The five-step morning routine works best when each layer stays light enough for sunscreen.",
    creditName: "Shvets Production",
    creditUrl: "https://www.pexels.com/photo/9774785/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-7-step-evening-skincare-routine": {
    alt: "Asian woman applying face cream while looking into a handheld mirror at home",
    caption:
      "A longer evening routine should start with proper cleansing and end with a calm barrier.",
    creditName: "RDNE Stock project",
    creditUrl: "https://www.pexels.com/photo/12322901/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-skip-care-explained": {
    alt: "East Asian man reading a skincare bottle label in a tiled bathroom",
    caption:
      "Skip-care is edited beauty: fewer products, clearer jobs, and less noise for the skin.",
    creditName: "Ron Lach",
    creditUrl: "https://www.pexels.com/photo/8159665/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "toner-pads-as-mini-masks": {
    alt: "Asian woman with under-eye patches and hair curlers during a targeted skincare ritual",
    caption:
      "Toner pads and small masks work best when they are used by zone, not dragged across every concern.",
    creditName: "Gabby K",
    creditUrl: "https://www.pexels.com/photo/6978058/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "glass-skin-without-10-steps": {
    alt: "East Asian woman applying a glossy skincare cream to her cheek",
    caption:
      "Glass skin is less about a 10-step count and more about hydration, texture, and light reflection.",
    creditName: "Shvets Production",
    creditUrl: "https://www.pexels.com/photo/9774669/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-barrier-repair-routine": {
    alt: "Asian woman applying a gentle skincare product to her neck during a barrier care routine",
    caption:
      "When the barrier is irritated, the best routine is usually the quietest one.",
    creditName: "Mart Production",
    creditUrl: "https://www.pexels.com/photo/8076212/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "sunscreen-as-skincare-korean-routine": {
    alt: "Asian man wiping his face during a light daily skincare routine",
    caption:
      "In a Korean routine, SPF is not beach gear. It is the daily step that protects every other step.",
    creditName: "Gabby K",
    creditUrl: "https://www.pexels.com/photo/6977734/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-summer-cooling-skincare-routine": {
    alt: "Asian woman wearing a hydrating sheet mask for a cooling skincare routine",
    caption:
      "Summer skincare has to account for heat, sweat, sunscreen, and humidity before adding glow.",
    creditName: "Polina Kovaleva",
    creditUrl: "https://www.pexels.com/photo/6543629/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-skincare-30s-slow-aging-routine": {
    alt: "East Asian woman using a skincare tool and serum as part of a slow-aging routine",
    caption:
      "Slow-aging routines work best when prevention, actives, and barrier support stay balanced.",
    creditName: "Shvets Production",
    creditUrl: "https://www.pexels.com/photo/9774551/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-clinic-to-home-skincare": {
    alt: "Asian woman applying a facial mask at home as part of clinic-inspired skincare",
    caption:
      "Clinic-to-home skincare borrows from professional treatment culture, but the home routine still needs restraint.",
    creditName: "Mart Production",
    creditUrl: "https://www.pexels.com/photo/8076172/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  "korean-post-treatment-recovery-skincare-routine": {
    alt: "Young Asian woman applying eye patches in a bright bedroom for gentle recovery skincare",
    caption:
      "After a treatment, recovery is usually calm hydration, barrier support, sunscreen, and patience.",
    creditName: "Ron Lach",
    creditUrl: "https://www.pexels.com/photo/9642840/",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
};

export function getArticleImageMeta(
  slug: string
): ArticleImageMeta | undefined {
  return ARTICLE_IMAGE_META[slug];
}
