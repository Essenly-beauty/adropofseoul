import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { SECTIONS } from "@/lib/taxonomy";
import { MySeoulDropLink } from "./MySeoulDropLink";

const EXPLORE = SECTIONS.map((s) => ({ label: s.label, href: s.href }));

const MORE = [
  { label: "All Stories", href: "/stories" },
  { label: "My Beauty Profile", href: "/beauty-profile" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-soft-gray bg-bg">
      <div className="mx-auto max-w-[1376px] px-5 md:px-12">
        <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-serif text-2xl">
              {SITE_NAME}
            </Link>
            <p className="mt-3.5 max-w-[34ch] text-sm text-text-muted">
              A local perspective on Korean life, culture and beauty, shared
              from Seoul
            </p>
            <MySeoulDropLink
              source="site_footer"
              className="mt-5 inline-block text-[11px] uppercase tracking-label text-accent hover:text-accent-hover"
            >
              Continue to My Seoul Drop ↗
            </MySeoulDropLink>
          </div>
          <FooterColumn title="Explore" items={EXPLORE} />
          <FooterColumn title="More" items={MORE} />
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
