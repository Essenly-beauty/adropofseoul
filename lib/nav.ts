import { SECTIONS, SKINCARE_TABS, SEOUL_NEIGHBORHOODS } from "@/lib/taxonomy";

/** A GNB entry; children may nest one further level (e.g. Neighborhoods → areas). */
export type NavChild = {
  label: string;
  href: string;
  children?: NavChild[];
};

export type NavItem = {
  label: string;
  href: string;
  /** Sub-categories shown in the GNB (mobile toggle list + desktop dropdown). */
  children?: NavChild[];
};

// Sub-categories per section. The section link itself covers the landing, so
// children surface the deeper entry points. Haircare leads with the profile
// quiz; Seoul splits into Places (what to do) and Neighborhoods (where to go),
// with the individual neighborhoods nested under Neighborhoods.
const SECTION_CHILDREN: Record<string, NavChild[]> = {
  skincare: [
    { label: "Skin Profile", href: "/beauty-profile/skin" },
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
    {
      label: "Neighborhoods",
      href: "/seoul/neighborhoods",
      children: SEOUL_NEIGHBORHOODS.map((n) => ({
        label: n.label,
        href: `/seoul/neighborhoods/${n.slug}`,
      })),
    },
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

// My Seoul Drop is the companion planning product. Its two-line label explains
// the job before naming the service, so first-time visitors do not need to infer
// the relationship from two similar brand names.
export const NAV_CTA = {
  eyebrow: "Plan your Seoul",
  label: "My Seoul Drop",
};

// Skincare tab set, re-exported for the shared SectionTabs switcher.
export { SKINCARE_TABS };
