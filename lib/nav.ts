import { SECTIONS, SKINCARE_TABS, SEOUL_NEIGHBORHOODS } from "@/lib/taxonomy";

export type NavItem = {
  label: string;
  href: string;
  /** Sub-categories shown in the GNB (mobile toggle list + desktop dropdown). */
  children?: { label: string; href: string }[];
};

// Sub-categories per section. The section link itself covers the landing, so
// children surface the deeper entry points. Haircare leads with the profile
// quiz; Seoul splits into Places (what to do) and Neighborhoods (where to go).
const SECTION_CHILDREN: Record<string, { label: string; href: string }[]> = {
  skincare: [
    { label: "Ingredients", href: "/ingredients" },
    { label: "Picks", href: "/skincare/picks" },
  ],
  haircare: [
    { label: "Hair Profile", href: "/beauty-profile/hair" },
    { label: "Scalp Care", href: "/haircare#scalp-care" },
    { label: "Treatments & Styling", href: "/haircare#treatments" },
    { label: "Ingredients", href: "/ingredients" },
    { label: "Products & Picks", href: "/skincare/picks" },
  ],
  seoul: [
    { label: "Places", href: "/seoul/places" },
    { label: "Neighborhoods", href: "/seoul/neighborhoods" },
    ...SEOUL_NEIGHBORHOODS.map((n) => ({
      label: n.label,
      href: `/seoul/neighborhoods/${n.slug}`,
    })),
  ],
};

// Primary GNB: Home + the content sections + About.
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  ...SECTIONS.map((s) => ({
    label: s.label,
    href: s.href,
    children: SECTION_CHILDREN[s.slug],
  })),
  { label: "About", href: "/about" },
];

// The Hair Profile quiz is the site's flagship interactive feature — surfaced
// as a distinct CTA rather than a plain nav link.
export const NAV_CTA = { label: "My Beauty Profile", href: "/beauty-profile" };

// Skincare tab set, re-exported for the shared SectionTabs switcher.
export { SKINCARE_TABS };
