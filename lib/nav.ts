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
