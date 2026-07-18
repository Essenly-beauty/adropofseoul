import {
  SECTIONS,
  BEAUTY_TABS,
  AROUND_SEOUL_NEIGHBORHOODS,
} from "@/lib/taxonomy";

export type NavItem = {
  label: string;
  href: string;
  /** Sub-categories shown in the GNB (mobile toggle list + desktop dropdown). */
  children?: { label: string; href: string }[];
};

// Sub-categories per section. The section link itself covers "All", so the
// Beauty children skip the "all" tab; Places surfaces its two live type
// filters; Around Seoul lists neighborhoods + the Common tab.
const SECTION_CHILDREN: Record<string, { label: string; href: string }[]> = {
  beauty: BEAUTY_TABS.filter((t) => t.key !== "all").map((t) => ({
    label: t.label,
    href: t.href,
  })),
  places: [
    { label: "Head Spa", href: "/places?type=head-spa" },
    { label: "Salons", href: "/places?type=salon" },
  ],
  "around-seoul": [
    ...AROUND_SEOUL_NEIGHBORHOODS.map((n) => ({
      label: n.label,
      href: `/around-seoul/${n.slug}`,
    })),
    { label: "Common", href: "/around-seoul/common" },
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
