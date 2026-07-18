import { SECTIONS } from "@/lib/taxonomy";

export type NavItem = { label: string; href: string };

// Primary GNB: Home + the content sections + About.
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  ...SECTIONS.map((s) => ({ label: s.label, href: s.href })),
  { label: "About", href: "/about" },
];
