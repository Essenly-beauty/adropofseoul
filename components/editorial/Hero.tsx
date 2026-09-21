import Image from "next/image";
import type { CSSProperties } from "react";
import { HOMEPAGE } from "@/lib/homepage";
import styles from "./Homepage.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="home-headline">
      <Image
        src={HOMEPAGE.hero.src}
        alt={HOMEPAGE.hero.alt}
        fill
        priority
        sizes="100vw"
        className={styles.heroImage}
        style={
          {
            "--desktop-position": HOMEPAGE.hero.desktopPosition,
            "--mobile-position": HOMEPAGE.hero.mobilePosition,
          } as CSSProperties
        }
      />
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>A Drop of Seoul</p>
          <h1 id="home-headline" className={styles.heroTitle}>
            <span>A city is</span> <span>made of stories</span>
          </h1>
          <p className={styles.heroSubtitle}>Here are ours from Seoul</p>
          <p className={styles.heroDescription}>
            Small stories about Korean life, culture and beauty,
            <br className="hidden sm:block" /> seen from Seoul
          </p>
          <a href="#start-here" className={styles.heroCta}>
            Find your first story <span aria-hidden="true">⟶</span>
          </a>
        </div>
        <p className={styles.signature}>For my friends</p>
      </div>
    </section>
  );
}
