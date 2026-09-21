import type { Post } from "@/services/types";
import { SECTIONS, isPick, sectionForCategory } from "@/lib/taxonomy";
import assignments from "@/data/editorial-classification.json";

export const EDITORIAL_TOPICS = [
  {
    key: "everyday-life",
    section: "explained",
    label: "Everyday Life",
    href: "/seoul-explained/everyday-life",
  },
  {
    key: "food-drink",
    section: "explained",
    label: "Food & Drink",
    href: "/seoul-explained/food-drink",
  },
  {
    key: "shopping",
    section: "explained",
    label: "Shopping",
    href: "/seoul-explained/shopping",
  },
  { key: "place-guides", section: "places", label: "Places", href: "/seoul" },
  {
    key: "neighborhoods",
    section: "places",
    label: "Neighborhoods",
    href: "/seoul/neighborhoods",
  },
  {
    key: "edit",
    section: "beauty",
    label: "The Edit",
    href: "/beauty/the-edit",
  },
  { key: "skincare", section: "beauty", label: "Skincare", href: "/skincare" },
  {
    key: "hair-scalp",
    section: "beauty",
    label: "Hair & Scalp",
    href: "/haircare",
  },
  {
    key: "ingredients",
    section: "beauty",
    label: "Ingredients",
    href: "/ingredients",
  },
  { key: "picks", section: "beauty", label: "Picks", href: "/skincare/picks" },
] as const;
export type EditorialTopic = (typeof EDITORIAL_TOPICS)[number]["key"];
type ArticleInput = Pick<Post, "slug" | "category" | "tags"> &
  Partial<Pick<Post, "title">>;
type Assignment = { topic: string; keywords?: string[] };
const reviewed: Record<string, Assignment> = assignments;

export function topicForPost(post: ArticleInput) {
  // An explicit CMS selection wins over the launch audit. Brand tags never
  // determine the primary topic, and the article body is never keyword-scanned.
  const selected = post.tags.find((t) => t.startsWith("topic:"))?.slice(6);
  let key =
    EDITORIAL_TOPICS.find((t) => t.key === selected)?.key ??
    reviewed[post.slug]?.topic;
  if (!key) {
    const section = sectionForCategory(post.category).slug;
    key =
      section === "beauty"
        ? isPick(post) || post.category === "products"
          ? "picks"
          : ["hair", "head_spa"].includes(post.category)
            ? "hair-scalp"
            : post.tags.some((t) =>
                  ["editorial", "beauty industry", "interviews"].includes(
                    t.toLowerCase()
                  )
                )
              ? "edit"
              : "skincare"
        : post.category === "shopping"
          ? "shopping"
          : post.category === "wellness"
            ? "everyday-life"
            : "place-guides";
  }
  return EDITORIAL_TOPICS.find((t) => t.key === key) ?? EDITORIAL_TOPICS[3];
}

export function sectionForPost(post: ArticleInput) {
  return SECTIONS.find((s) => s.slug === topicForPost(post).section)!;
}

export const KEYWORDS = [
  {
    key: "daiso",
    label: "Daiso",
    aliases: ["daiso", "daiso korea", "daiso seoul", "korean daiso"],
  },
  {
    key: "olive-young",
    label: "Olive Young",
    aliases: ["olive young", "olive young korea"],
  },
  {
    key: "kpop-demon-hunters",
    label: "KPop Demon Hunters",
    aliases: ["kpop demon hunters"],
  },
  { key: "seongsu", label: "Seongsu", aliases: ["seongsu", "region:seongsu"] },
  { key: "hongdae", label: "Hongdae", aliases: ["hongdae", "region:hongdae"] },
  { key: "yeonnam", label: "Yeonnam", aliases: ["yeonnam"] },
  { key: "hannam", label: "Hannam", aliases: ["hannam", "region:hannam"] },
  {
    key: "myeongdong",
    label: "Myeongdong",
    aliases: ["myeongdong", "region:myeongdong"],
  },
  {
    key: "gangnam-cheongdam",
    label: "Gangnam & Cheongdam",
    aliases: ["gangnam", "cheongdam", "apgujeong", "region:gangnam-cheongdam"],
  },
  {
    key: "jongno",
    label: "Jongno",
    aliases: ["jongno", "bukchon", "seochon", "region:jongno"],
  },
  {
    key: "han-river",
    label: "Han River",
    aliases: ["han river", "hangang", "mangwon", "region:mangwon"],
  },
  {
    key: "shopping",
    label: "Shopping",
    aliases: [
      "shopping",
      "seoul shopping",
      "shopping guide",
      "k-beauty shopping",
      "interest:shopping",
    ],
  },
  {
    key: "souvenirs",
    label: "Souvenirs",
    aliases: ["souvenirs", "seoul souvenirs", "korea gifts"],
  },
  {
    key: "coffee",
    label: "Coffee & Cafés",
    aliases: [
      "coffee",
      "cafés",
      "cafes",
      "seoul cafes",
      "budget coffee",
      "seoul coffee",
      "interest:cafes",
    ],
  },
  {
    key: "food",
    label: "Food",
    aliases: [
      "food",
      "seoul food",
      "gimbap",
      "kimbap",
      "ramyeon",
      "interest:food",
    ],
  },
  {
    key: "wellness",
    label: "Wellness & Rituals",
    aliases: ["wellness", "korean wellness", "healthy habits"],
  },
  {
    key: "jjimjilbang",
    label: "Jjimjilbang",
    aliases: ["jjimjilbang", "korean bathhouse", "bathhouse"],
  },
  {
    key: "slow-aging",
    label: "Slow Aging",
    aliases: ["slow aging", "slow-aging", "healthy aging", "저속노화"],
  },
  {
    key: "scalp-care",
    label: "Scalp Care",
    aliases: ["scalp care", "head spa", "scalp"],
  },
  {
    key: "haircare",
    label: "Haircare",
    aliases: [
      "haircare",
      "korean haircare",
      "korean hair care",
      "hair mask",
      "hair brands",
    ],
  },
  {
    key: "skincare-routines",
    label: "Skincare Routines",
    aliases: ["skincare routine", "routine", "routines", "skip-care"],
  },
  {
    key: "sunscreen",
    label: "Sunscreen",
    aliases: ["sunscreen", "sunscreens", "korean sunscreen", "spf"],
  },
  { key: "serums", label: "Serums", aliases: ["serum", "serums"] },
  {
    key: "skin-barrier",
    label: "Skin Barrier",
    aliases: ["barrier", "sensitive skin", "barrier-repair"],
  },
  {
    key: "beauty-industry",
    label: "Beauty & Brands",
    aliases: [
      "beauty industry",
      "k-beauty brands",
      "indie beauty",
      "beauty trends",
      "brand design",
    ],
  },
  {
    key: "fragrance",
    label: "Fragrance",
    aliases: ["fragrance", "korean fragrance", "perfume"],
  },
  {
    key: "getting-around",
    label: "Getting Around",
    aliases: [
      "getting around",
      "naver map",
      "seoul transport",
      "interest:transport",
    ],
  },
  {
    key: "art-design",
    label: "Art & Design",
    aliases: [
      "interest:art",
      "interest:design",
      "architecture",
      "seoul design",
    ],
  },
] as const;

export function keywordsForPost(post: ArticleInput) {
  const tags = new Set(post.tags.map((t) => t.trim().toLowerCase()));
  const title = (post.title ?? "").toLowerCase();
  const curated = reviewed[post.slug]?.keywords;
  return KEYWORDS.filter((k) => {
    if (tags.has(`keyword:${k.key}`)) return true;
    if (tags.has("keywords:manual")) return false;
    if (curated) return curated.includes(k.key);
    return k.aliases.some(
      (alias) =>
        tags.has(alias) ||
        (!alias.includes(":") &&
          new RegExp(`(?:^|[^a-z])${alias}(?:$|[^a-z])`, "i").test(title))
    );
  });
}

export function keywordHref(key: string) {
  return `/stories?keyword=${encodeURIComponent(key)}`;
}

export function articleBreadcrumbs(post: Post) {
  const section = sectionForPost(post);
  const topic = topicForPost(post);
  return [
    { name: "Home", path: "/" },
    { name: section.label, path: section.href },
    ...(topic.href !== section.href
      ? [{ name: topic.label, path: topic.href }]
      : []),
    { name: post.title, path: `/articles/${post.slug}` },
  ];
}

export function filterEditorialPosts(
  posts: Post[],
  opts: { section?: string; topic?: string; keyword?: string; q?: string } = {}
) {
  const q = opts.q?.trim().toLowerCase();
  return posts.filter(
    (post) =>
      (!opts.section || sectionForPost(post).slug === opts.section) &&
      (!opts.topic || topicForPost(post).key === opts.topic) &&
      (!opts.keyword ||
        keywordsForPost(post).some((k) => k.key === opts.keyword)) &&
      (!q ||
        [post.title, post.excerpt, ...keywordsForPost(post).map((k) => k.label)]
          .join(" ")
          .toLowerCase()
          .includes(q))
  );
}
