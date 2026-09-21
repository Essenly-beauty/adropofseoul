import Link from "next/link";
import { BEAUTY_NAV_GROUPS } from "@/lib/nav";
import styles from "./SiteHeader.module.css";

export function BeautyNavContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className={styles.beautyMenu}>
      <p className={styles.beautyIntro}>
        A little curiosity, a routine that fits you
      </p>
      <div className={styles.beautyGroups}>
        {BEAUTY_NAV_GROUPS.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h3 className={styles.beautyGroupTitle}>{group.label}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    aria-label={item.label}
                    href={item.href}
                    onClick={onNavigate}
                  >
                    <span className={styles.childTitle}>{item.label}</span>
                    <span className={styles.childDescription}>
                      {item.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className={styles.beautyNote}>
        New to Korean beauty? Start with The Edit, or explore care for your skin
        and hair
      </p>
    </div>
  );
}
