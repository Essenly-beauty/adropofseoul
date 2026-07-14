export type NavItem = {
  label: string;
  href: string;
  items?: { label: string; href: string }[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Beauty",
    href: "/beauty",
    items: [
      { label: "Skincare", href: "/beauty/skincare" },
      { label: "Ingredients", href: "/ingredients" },
      { label: "Hair", href: "/beauty/hair" },
      { label: "Scalp", href: "/beauty/scalp" },
      { label: "Treatments", href: "/beauty/treatments" },
    ],
  },
  {
    label: "Places",
    href: "/places",
    items: [
      { label: "Hair Salons", href: "/places/hair-salons" },
      { label: "Head Spas", href: "/places/head-spas" },
      { label: "Skin Clinics", href: "/places/skin-clinics" },
      { label: "Beauty Stores", href: "/places/beauty-stores" },
    ],
  },
  {
    label: "Guides",
    href: "/guides",
    items: [
      { label: "Best of Seoul", href: "/guides/best-of-seoul" },
      { label: "Neighborhood Guides", href: "/guides/neighborhoods" },
      { label: "Beauty Itineraries", href: "/guides/itineraries" },
      { label: "How-To Guides", href: "/guides/how-to" },
    ],
  },
  {
    label: "The Edit",
    href: "/the-edit",
    items: [
      { label: "Products", href: "/the-edit/products" },
      { label: "New & Noteworthy", href: "/the-edit/new-and-noteworthy" },
      { label: "Editor's Picks", href: "/the-edit/editors-picks" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Search", href: "/articles" },
];
