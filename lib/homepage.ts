/** Fixed editorial assets, separate from the CMS-driven Latest Drops feed. */
export const HOMEPAGE = {
  hero: {
    src: "/images/home/seoul-neighborhood-hero.png",
    alt: "An illustrated Seoul neighborhood street, with people walking downhill and Namsan in the distance",
    desktopPosition: "center 54%",
    mobilePosition: "64% center",
  },
  perspective: {
    src: "/images/articles/seoul-rainy-day.png",
    alt: "A view through a café window of people walking with umbrellas along a rainy Seoul street",
    position: "center 55%",
  },
  categories: [
    {
      href: "/seoul-explained",
      description: "The habits, food and small details of Korean life",
      src: "/images/seongsu/seongsu-beauty-and-bites.jpg",
      alt: "People walking past a small eatery and shop in Seongsu",
      position: "center 55%",
    },
    {
      href: "/seoul",
      description: "Our corner of Korea, one neighborhood at a time",
      src: "/images/articles/quiet-side-of-seoul.png",
      alt: "A quiet courtyard where traditional architecture meets the Seoul skyline",
      position: "center 55%",
    },
    {
      href: "/beauty",
      description: "Korean beauty, from everyday rituals to your own routine",
      src: "/images/articles/korean-skip-care-explained.jpg",
      alt: "A glass skincare dropper and amber bottle on a pale stone surface",
      position: "center 61%",
    },
  ],
} as const;
