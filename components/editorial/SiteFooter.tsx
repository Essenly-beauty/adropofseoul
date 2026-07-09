import Link from "next/link";
import { SITE_NAME, TAGLINE } from "@/lib/site";

const EXPLORE = [
  { label: "Beauty", href: "/beauty" },
  { label: "Hair", href: "/hair" },
  { label: "Head Spa", href: "/head-spa" },
  { label: "Wellness", href: "/wellness" },
  { label: "Guides", href: "/guides" },
];

const GUIDE = [
  { label: "Places", href: "/places" },
  { label: "Picks", href: "/picks" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-soft-gray bg-porcelain">
      <div className="mx-auto max-w-content px-6">
        <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-serif text-2xl">
              {SITE_NAME}
            </Link>
            <p className="mt-3.5 max-w-[34ch] text-sm text-text-muted">
              {TAGLINE}
            </p>
          </div>
          <FooterColumn title="Explore" items={EXPLORE} />
          <FooterColumn title="The Guide" items={GUIDE} />
        </div>
        <div className="flex flex-wrap justify-between gap-2.5 border-t border-soft-gray py-6 text-xs text-text-muted">
          <span>© {SITE_NAME}. All rights reserved.</span>
          <span>Seoul · Worldwide</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-label text-text-muted">
        {title}
      </h4>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-text-muted transition-colors duration-medium ease-editorial hover:text-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
