"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./proto.module.css";

const topics = [
  "For you",
  "Neighborhoods",
  "Beauty",
  "Food & coffee",
  "Culture",
];

const neighborhoods = [
  {
    name: "Seongsu",
    hangul: "성수",
    note: "Beauty labs · warehouse cafés",
    image: "/images/seongsu/seongsu-beauty-and-bites.jpg",
  },
  {
    name: "Hannam",
    hangul: "한남",
    note: "Quiet galleries · afternoon tables",
    image: "/images/articles/hannam-afternoon-local-guide.png",
  },
  {
    name: "Seochon",
    hangul: "서촌",
    note: "Hanok lanes · small discoveries",
    image: "/images/about/seoul-courtyard.jpeg",
  },
];

const stories = [
  {
    category: "Seoul note",
    title: "The quiet side of Seoul is closer than you think",
    dek: "Courtyards, slow tables, and a softer route through the city.",
    image: "/images/articles/quiet-side-of-seoul.png",
    time: "6 min",
  },
  {
    category: "Beauty",
    title: "The new generation of Korean beauty brands",
    image: "/images/articles/new-generation-korean-beauty-brands.png",
    time: "8 min",
  },
  {
    category: "Local guide",
    title: "A slow Sunday in Seoul",
    image: "/images/articles/slow-sunday-in-seoul.jpg",
    time: "5 min",
  },
];

const picks = [
  {
    title: "Barrier-first serum",
    note: "Picked for calm, not hype",
    image: "/images/articles/five-k-beauty-serums.png",
  },
  {
    title: "Cooling summer care",
    note: "A lighter Seoul routine",
    image: "/images/articles/korean-summer-cooling-skincare-routine.png",
  },
];

export function ProtoHome() {
  const [topic, setTopic] = useState("For you");
  const [saved, setSaved] = useState<string[]>([]);
  const [nav, setNav] = useState("Home");

  const toggleSave = (title: string) => {
    setSaved((items) =>
      items.includes(title)
        ? items.filter((item) => item !== title)
        : [...items, title]
    );
  };

  return (
    <main className={`${styles.proto} proto-page`}>
      <section className={styles.hero}>
        <Image
          src="/images/articles/hannam-afternoon-local-guide.png"
          alt="A calm afternoon in Seoul"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroShade} />
        <div className={styles.heroStamp}>
          <span>ISSUE 09</span>
          <strong>서울에서</strong>
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>A considered guide to the city</p>
          <h1>
            Seoul,
            <br />
            <em>a drop</em>
            <br />
            at a time.
          </h1>
          <p>
            Beauty, rituals, neighborhoods, and the places worth crossing town
            for.
          </p>
          <a href="#today" className={styles.primaryCta}>
            Start exploring <span>↓</span>
          </a>
        </div>
      </section>

      <nav className={styles.topicNav} aria-label="Explore topics">
        {topics.map((item) => (
          <button
            key={item}
            onClick={() => setTopic(item)}
            className={topic === item ? styles.activeTopic : ""}
          >
            {item}
          </button>
        ))}
      </nav>

      <section id="today" className={styles.section}>
        <div className={styles.sectionTop}>
          <p className={styles.eyebrow}>Today’s drop · 오늘의 한 방울</p>
          <span>01 / 05</span>
        </div>
        <article className={styles.leadStory}>
          <div className={styles.leadImage}>
            <Image
              src="/images/articles/seongsu-beauty-spots.png"
              alt="Seongsu beauty spaces"
              fill
              sizes="(max-width: 768px) 100vw, 65vw"
              className={styles.cover}
            />
            <button
              onClick={() => toggleSave("Seongsu beauty route")}
              className={`${styles.save} ${saved.includes("Seongsu beauty route") ? styles.saved : ""}`}
              aria-label="Save Seongsu beauty route"
            >
              {saved.includes("Seongsu beauty route") ? "Saved ✓" : "Save +"}
            </button>
            <div className={styles.placeTag}>성수 · SEONGSU</div>
          </div>
          <div className={styles.leadText}>
            <p className={styles.storyMeta}>
              The local edit <span>7 min read</span>
            </p>
            <h2>A beauty-first afternoon in Seongsu</h2>
            <p>
              Three thoughtful stops, one good coffee, and no rushing across the
              city.
            </p>
            <Link href="/seongsu" className={styles.textLink}>
              Open the route <span>↗</span>
            </Link>
          </div>
        </article>
      </section>

      <section className={`${styles.section} ${styles.neighborhoodSection}`}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>On the map</p>
            <h2>Choose your neighborhood</h2>
          </div>
          <Link href="/seoul">View all</Link>
        </div>
        <div className={styles.horizontalCards}>
          {neighborhoods.map((place, index) => (
            <article key={place.name} className={styles.neighborhoodCard}>
              <div className={styles.neighborhoodImage}>
                <Image
                  src={place.image}
                  alt=""
                  fill
                  sizes="78vw"
                  className={styles.cover}
                />
                <span>0{index + 1}</span>
              </div>
              <div>
                <h3>
                  {place.name} <small>{place.hangul}</small>
                </h3>
                <p>{place.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.profile}`}>
        <div className={styles.profileMark}>
          水<span>skin / hair</span>
        </div>
        <p className={styles.eyebrow}>Your beauty profile</p>
        <h2>What does your skin actually need in Seoul?</h2>
        <p>A private 3-minute profile for a calmer routine—not a longer one.</p>
        <div className={styles.profileFacts}>
          <span>3 min</span>
          <span>No signup</span>
          <span>Private</span>
        </div>
        <Link href="/beauty-profile" className={styles.darkCta}>
          Find my profile <span>→</span>
        </Link>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Journal · {topic}</p>
            <h2>Stories for your pocket</h2>
          </div>
          <Link href="/stories">All stories</Link>
        </div>
        <article className={styles.featureStory}>
          <Image
            src={stories[0].image}
            alt=""
            width={900}
            height={1100}
            className={styles.featureImage}
          />
          <div className={styles.tape}>Editor’s note</div>
          <p className={styles.storyMeta}>
            {stories[0].category}
            <span>{stories[0].time}</span>
          </p>
          <h3>{stories[0].title}</h3>
          <p>{stories[0].dek}</p>
        </article>
        <div className={styles.storyList}>
          {stories.slice(1).map((story) => (
            <article key={story.title} className={styles.storyRow}>
              <Image src={story.image} alt="" width={220} height={240} />
              <div>
                <p className={styles.storyMeta}>
                  {story.category}
                  <span>{story.time}</span>
                </p>
                <h3>{story.title}</h3>
              </div>
              <button
                onClick={() => toggleSave(story.title)}
                aria-label={`Save ${story.title}`}
              >
                {saved.includes(story.title) ? "●" : "○"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.picksSection}`}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>The shelf</p>
            <h2>Worth bringing home</h2>
          </div>
          <Link href="/skincare/picks">Shop the edit</Link>
        </div>
        <div className={styles.pickGrid}>
          {picks.map((pick) => (
            <article key={pick.title}>
              <div className={styles.pickImage}>
                <Image
                  src={pick.image}
                  alt=""
                  fill
                  sizes="50vw"
                  className={styles.cover}
                />
              </div>
              <p>{pick.note}</p>
              <h3>{pick.title}</h3>
              <button onClick={() => toggleSave(pick.title)}>
                {saved.includes(pick.title) ? "Saved ✓" : "Save for later +"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.closing}>
        <p className={styles.eyebrow}>The list · twice a month</p>
        <h2>
          A little Seoul,
          <br />
          kept close.
        </h2>
        <p>New places, considered picks, and routes worth saving. No noise.</p>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Your email address"
            aria-label="Email address"
          />
          <button type="submit">Join →</button>
        </form>
      </section>

      <div className={styles.reviewNote}>
        <span>PROTO 01</span>
        <p>
          Mobile editorial direction
          <br />
          <small>For review only · Sep 2026</small>
        </p>
      </div>

      <nav className={styles.bottomNav} aria-label="Prototype navigation">
        {[
          { name: "Home", icon: "⌂" },
          { name: "Explore", icon: "⌕" },
          { name: "Saved", icon: "♡" },
          { name: "Profile", icon: "◌" },
        ].map((item) => (
          <button
            key={item.name}
            onClick={() => setNav(item.name)}
            className={nav === item.name ? styles.activeBottom : ""}
          >
            <span>
              {item.icon}
              {item.name === "Saved" && saved.length > 0 && (
                <b>{saved.length}</b>
              )}
            </span>
            {item.name}
          </button>
        ))}
      </nav>
    </main>
  );
}
