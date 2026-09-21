import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/services/types";
import { sectionForPost } from "@/lib/editorial-taxonomy";
import { HOMEPAGE } from "@/lib/homepage";
import styles from "./Homepage.module.css";

const STARTERS = [
  {
    section: "explained",
    slug: "the-2000-won-coffee-that-powers-seoul",
    label: "A little everyday Korea",
    title: "The ₩2,000 coffee habit",
    reason: "Start with the coffee habit that says so much about daily life",
    fallback: "The small details of Korean life",
  },
  {
    section: "places",
    slug: "seongsu-warehouse-cafes",
    label: "Somewhere to wander",
    title: "A café walk through Seongsu",
    reason: "Get to know a neighborhood through its cafés and shared spaces",
    fallback: "Get to know our neighborhoods",
  },
  {
    section: "beauty",
    slug: "korean-skip-care-explained",
    label: "A ritual for you",
    title: "Korean skincare, simplified",
    reason: "Explore a simpler way into Korean skincare, wherever you live",
    fallback: "Find your way into Korean beauty",
  },
] as const;

export function StartHere({ posts }: { posts: Post[] }) {
  return (
    <section
      id="start-here"
      aria-labelledby="start-here-title"
      className={`${styles.container} ${styles.startHere}`}
    >
      <div className={styles.startHeading}>
        <div>
          <p className={styles.eyebrow}>New here?</p>
          <h2 id="start-here-title" className={styles.sectionTitle}>
            Find your first story
          </h2>
        </div>
        <p>
          Three ways into Korean life, whether you’re dreaming of a trip or
          simply curious
        </p>
      </div>
      <div className={styles.starterGrid}>
        {STARTERS.map((entry, index) => {
          const post =
            posts.find((p) => p.slug === entry.slug) ??
            posts.find((p) => sectionForPost(p).slug === entry.section);
          const category = HOMEPAGE.categories[index];
          const image = post?.featuredImage || category.src;
          return (
            <article key={entry.section} className={styles.starterCard}>
              <p className={styles.starterLabel}>
                <span>0{index + 1}</span> {entry.label}
              </p>
              <Link href={post ? `/articles/${post.slug}` : category.href}>
                <div className={styles.starterImage}>
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 96px, 33vw"
                  />
                </div>
                <h3 className={styles.starterTitle}>
                  {post?.slug === entry.slug
                    ? entry.title
                    : (post?.title ?? entry.fallback)}
                </h3>
                <p className={styles.starterReason}>
                  {post?.slug === entry.slug
                    ? entry.reason
                    : category.description}
                </p>
                <span className={styles.starterAction}>
                  {post ? "Read the story" : "Explore the stories"}{" "}
                  <span aria-hidden="true">⟶</span>
                </span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
