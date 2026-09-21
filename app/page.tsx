import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listEditorialPosts } from "@/services/editorial";
import type { Post } from "@/services/types";
import { StartHere } from "@/components/editorial/StartHere";
import { Hero } from "@/components/editorial/Hero";
import { canonical } from "@/lib/seo";
import { HOME_TITLE } from "@/lib/site";
import { HOMEPAGE } from "@/lib/homepage";
import { NAV_ITEMS } from "@/lib/nav";
import { getArticleImageMeta } from "@/lib/article-images";
import { sectionForPost, topicForPost } from "@/lib/editorial-taxonomy";
import { readingTime } from "@/lib/reading-time";
import styles from "@/components/editorial/Homepage.module.css";

const description =
  "Small stories about Korean life, culture and beauty, seen from Seoul.";
export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description,
  alternates: { canonical: canonical("/") },
  openGraph: {
    title: HOME_TITLE,
    description,
    url: canonical("/"),
    type: "website",
  },
};
export const revalidate = 300;

export default async function HomePage() {
  let posts: Post[] = [];
  try {
    posts = await listEditorialPosts();
  } catch (err) {
    console.error("home: latest posts fetch failed", err);
  }

  return (
    <main className={styles.page}>
      <Hero />
      <section
        aria-labelledby="latest-drops"
        className={`${styles.container} ${styles.latest}`}
      >
        <div className={styles.sectionHeading}>
          <h2 id="latest-drops" className={styles.sectionTitle}>
            Latest Drops
          </h2>
          <Link href="/stories" className={styles.textLink}>
            See all stories <span aria-hidden="true">⟶</span>
          </Link>
        </div>
        {posts.length > 0 ? (
          <div className={styles.storyGrid}>
            {posts.slice(0, 4).map((post) => {
              const topic = topicForPost(post);
              const section = sectionForPost(post);
              const minutes = readingTime(post.body);
              return (
                <article key={post.slug} className={styles.story}>
                  <Link href={`/articles/${post.slug}`}>
                    <div className={styles.storyImage}>
                      {post.featuredImage && (
                        <Image
                          src={post.featuredImage}
                          alt={
                            getArticleImageMeta(post.slug)?.alt ?? post.title
                          }
                          fill
                          sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1099px) 45vw, (max-width: 1376px) 23vw, 301px"
                        />
                      )}
                    </div>
                    <p className={styles.storyMeta}>
                      <span>{topic.label}</span>
                      <span aria-hidden="true">·</span>
                      <span>{section.label}</span>
                    </p>
                    <h3 className={styles.storyTitle}>
                      {post.title.replace(/\.$/, "")}
                    </h3>
                    {post.excerpt && (
                      <p className={styles.storyExcerpt}>{post.excerpt}</p>
                    )}
                    {minutes && (
                      <p className={styles.readTime}>{minutes} min read</p>
                    )}
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-sm text-text-muted">
            Our latest stories are taking a moment to arrive.{" "}
            <Link href="/stories" className="underline underline-offset-4">
              Browse the journal
            </Link>
          </p>
        )}
      </section>

      <StartHere posts={posts} />

      <section aria-labelledby="our-perspective" className={styles.perspective}>
        <div className={styles.perspectiveImage}>
          <Image
            src={HOMEPAGE.perspective.src}
            alt={HOMEPAGE.perspective.alt}
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            style={{ objectPosition: HOMEPAGE.perspective.position }}
          />
        </div>
        <div className={styles.perspectiveCopy}>
          <p className={styles.eyebrow}>Our Perspective</p>
          <h2 id="our-perspective" className={styles.perspectiveTitle}>
            What Makes Seoul, Seoul?
          </h2>
          <div className={styles.perspectiveBody}>
            <p>Seoul isn’t just palaces, skincare and K-pop.</p>
            <p>
              It’s the budget coffee you grab on the way to work, the subway
              that gets you almost anywhere, the Olive Young you somehow end up
              in again—and the little habits that feel ordinary until someone
              asks about them.
            </p>
          </div>
          <div className={styles.perspectiveRule} aria-hidden="true" />
          <Link href="/about" className={styles.textLink}>
            Read our story <span aria-hidden="true">⟶</span>
          </Link>
        </div>
      </section>

      <section
        id="explore"
        aria-labelledby="explore-title"
        className={`${styles.container} ${styles.categories}`}
      >
        <h2 id="explore-title" className={styles.sectionTitle}>
          Explore by Category
        </h2>
        <div className={styles.categoryGrid}>
          {HOMEPAGE.categories.map((category) => {
            const nav = NAV_ITEMS.find((item) => item.href === category.href)!;
            return (
              <article key={category.href}>
                <Link href={category.href} className={styles.categoryImage}>
                  <Image
                    src={category.src}
                    alt={category.alt}
                    fill
                    sizes="(max-width: 767px) calc(100vw - 40px), 33vw"
                    style={{ objectPosition: category.position }}
                  />
                  <h3 className={styles.categoryTitle}>{nav.label}</h3>
                  <span className={styles.categoryArrow} aria-hidden="true">
                    ⟶
                  </span>
                </Link>
                <p className={styles.categoryDescription}>
                  {category.description}
                </p>
                <nav
                  className={styles.categoryLinks}
                  aria-label={`${nav.label} topics`}
                >
                  {nav.children?.map((child) => (
                    <Link key={child.href} href={child.href}>
                      {child.label}
                    </Link>
                  ))}
                </nav>
              </article>
            );
          })}
        </div>
      </section>
      <section className={styles.closing} aria-label="A final thought">
        <div className={`${styles.container} ${styles.closingInner}`}>
          <p className={styles.closingQuote}>
            Little things make a big city feel human
          </p>
          <p className={styles.closingBrand}>A Drop of Seoul</p>
        </div>
      </section>
    </main>
  );
}
