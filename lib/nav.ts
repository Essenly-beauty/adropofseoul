import { SECTIONS, SKINCARE_TABS } from "@/lib/taxonomy";
import { EDITORIAL_TOPICS } from "@/lib/editorial-taxonomy";

export type NavChild = { label: string; href: string; divider?: boolean };
export type NavItem = { label: string; href: string; children?: NavChild[] };
const SECTION_CHILDREN: Record<string, NavChild[]> = {
  explained: EDITORIAL_TOPICS.filter((t) => t.section === "explained").map(
    (t) => ({ label: t.label, href: t.href })
  ),
  places: [
    { label: "All Places", href: "/seoul/places" },
    { label: "Neighborhoods", href: "/seoul/neighborhoods" },
  ],
  beauty: [
    ...SKINCARE_TABS.map((t) => ({ label: t.label, href: t.href })),
    { label: "Beauty Profile", href: "/beauty-profile", divider: true },
  ],
};
export const NAV_ITEMS: NavItem[] = SECTIONS.map((s) => ({
  label: s.label,
  href: s.href,
  children: SECTION_CHILDREN[s.slug],
}));
export const NAV_SECONDARY: NavItem[] = [
  { label: "All Stories", href: "/stories" },
  { label: "About", href: "/about" },
];
export const NAV_CTA = { eyebrow: "Plan your Seoul", label: "My Seoul Drop" };
export { SKINCARE_TABS };

/** Group by the reader's task while preserving every existing destination. */
export const BEAUTY_NAV_GROUPS = [
  {
    label: "Read & discover",
    items: [
      {
        label: "The Edit",
        href: "/beauty/the-edit",
        description: "All our Korean beauty stories and perspectives",
      },
    ],
  },
  {
    label: "Build your routine",
    items: [
      {
        label: "Skincare",
        href: "/skincare",
        description: "Start simple, from cleansing to everyday care",
      },
      {
        label: "Hair & Scalp",
        href: "/haircare",
        description: "Care for your texture, scalp and everyday needs",
      },
      {
        label: "Ingredients",
        href: "/ingredients",
        description: "Make sense of what is in your products",
      },
    ],
  },
  {
    label: "Find your fit",
    items: [
      {
        label: "Picks",
        href: "/skincare/picks",
        description: "Product edits and comparisons to help you choose",
      },
      {
        label: "Beauty Profile",
        href: "/beauty-profile",
        description:
          "Find a starting point for your skin or hair — no signup needed",
      },
    ],
  },
] as const;
