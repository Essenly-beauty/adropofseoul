// Canonical data for the Seongsu series (Ep. 1 & Ep. 2).
//
// Single source of truth for the per-stop cards rendered on each guide page.
// The self-contained interactive map (public/seongsu_map.html) intentionally
// duplicates the numeric fields (lat/lng, rating, order) because it ships as a
// standalone artifact that runs inside an <iframe> and cannot import TypeScript.
// If you edit a stop's coordinates or ordering here, mirror it there.
//
// Korean names were recovered from the place-id-paired Google queries in the
// original store-cards file, so `nameKr` + `placeId` always resolve to the
// exact venue on both Google Maps and Naver.

export type CourseId = 1 | 2;

export type Stop = {
  /** Anchor slug used for on-page links, e.g. `#stop-nonfiction`. */
  id: string;
  /** Position within its course (matches the numbered map pin). */
  n: number;
  /** Suggested arrival time, e.g. "11:00 AM". */
  time: string;
  /** Day part grouping: "Morning" | "Afternoon" | "Evening". */
  part: string;
  nameEn: string;
  nameKr: string;
  /** Short category tag, e.g. "Fragrance flagship". */
  category: string;
  /** Leading emoji for the category tag. */
  emoji: string;
  rating: number;
  reviewCount: number;
  lat: number;
  lng: number;
  /** Google Maps place id — pins the exact venue regardless of the query text. */
  placeId: string;
  price: string;
  waiting: string;
  breakTime: string;
  closed: string;
  /** English support + how you order. */
  english: string;
  nearby: string;
  /** One-line ADS-team verdict. */
  verdict: string;
  /** 2–3 sentence synthesis of Google reviews (paraphrased). */
  reviews: string;
};

/** Google Maps deep link — search by Korean name, pinned by place id. */
export function googleMapsUrl(stop: Stop): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    stop.nameKr
  )}&query_place_id=${stop.placeId}`;
}

/** Naver Map search link (Naver place ids are not available here). */
export function naverMapUrl(stop: Stop): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(stop.nameKr)}`;
}

// ---------------------------------------------------------------------------
// Course 1 · Yeonmujang-gil — beauty flagships + local eats
// ---------------------------------------------------------------------------
export const COURSE_1_STOPS: Stop[] = [
  {
    id: "nonfiction",
    n: 1,
    time: "11:00 AM",
    part: "Morning",
    nameEn: "Nonfiction Seongsu",
    nameKr: "낫픽션 성수",
    category: "Fragrance flagship",
    emoji: "🧴",
    rating: 5.0,
    reviewCount: 22,
    lat: 37.5437945,
    lng: 127.0504107,
    placeId: "ChIJSzsYAwClfDURZ-TRKwKg2sM",
    price: "₩₩₩ · perfume & home scent",
    waiting: "Minor entry queue at peak",
    breakTime: "None",
    closed: "Open daily · 11:00–20:30",
    english: "Excellent — staff fluent in English (some Mandarin too)",
    nearby: "Tamburins (2 min)",
    verdict:
      "The most tourist-friendly perfume house in Seongsu — they'll walk you through every scent in English.",
    reviews:
      "Reviewers overwhelmingly single out the staff — repeated mentions of fluent English and patient, thoughtful scent guidance that became a trip highlight. The clean, minimalist space makes it easy to browse without pressure.",
  },
  {
    id: "tamburins",
    n: 2,
    time: "11:40 AM",
    part: "Morning",
    nameEn: "Tamburins Seongsu",
    nameKr: "탬버린즈 성수",
    category: "Perfume flagship",
    emoji: "🧴",
    rating: 4.5,
    reviewCount: 249,
    lat: 37.5437671,
    lng: 127.0526044,
    placeId: "ChIJYaYyExWlfDURaI0QfIIWBHo",
    price: "₩₩₩ · perfume & hand cream",
    waiting: "Short entry queue (moves fast)",
    breakTime: "None",
    closed: "Open daily · 11:00–21:00",
    english: "OK — visual, minimal talking needed",
    nearby: "Nonfiction (2 min), Somunnan Gamjatang (5 min)",
    verdict:
      "Go for the building as much as the perfume — it's the most photographed beauty space in Seongsu.",
    reviews:
      "Visitors describe it less as a shop than an art installation — a raw industrial shell opening into a dramatic scented interior with a giant scent-diffusing centerpiece. Expect a brief queue and premium prices; most say it's worth visiting for the atmosphere even if you don't buy.",
  },
  {
    id: "somunnan",
    n: 3,
    time: "12:30 PM",
    part: "Afternoon",
    nameEn: "Somunnan Seongsu Gamjatang",
    nameKr: "소문난 성수 감자탕",
    category: "Pork-bone stew",
    emoji: "🍲",
    rating: 4.1,
    reviewCount: 6101,
    lat: 37.5428241,
    lng: 127.0543732,
    placeId: "ChIJtftAMZGkfDUR-dM7GT6Vl3g",
    price: "₩ · ~₩10,000",
    waiting: "Queue at peak, turns over fast",
    breakTime: "None — open 24 hours",
    closed: "Never (24h)",
    english: "Limited — point-and-order, very local",
    nearby: "Olive Young N (2 min), MiDoin (2 min)",
    verdict:
      "Where the neighborhood's working crowd refuels — hearty, cheap, open around the clock. Save it for after your beauty stops.",
    reviews:
      "A neighborhood institution (6,000+ reviews) for deep, spicy pork-bone stew with tender fall-off-the-bone meat and generous portions, served fast even under heavy volume. Regulars warn the strong aroma clings to your clothes, and rice-based sides can sell out late in the evening.",
  },
  {
    id: "olive-young",
    n: 4,
    time: "2:00 PM",
    part: "Afternoon",
    nameEn: "Olive Young N Seongsu",
    nameKr: "올리브영N 성수",
    category: "K-beauty megastore",
    emoji: "🛍️",
    rating: 4.3,
    reviewCount: 512,
    lat: 37.5441151,
    lng: 127.054556,
    placeId: "ChIJ14znQAClfDURT1IQuqyAwlA",
    price: "₩–₩₩₩ · all budgets",
    waiting: "Crowded but efficient; skin-analysis needs an early line-up",
    breakTime: "None",
    closed: "Open daily · 10:00–22:00",
    english: "Excellent — passport tax refund at register, clear signage",
    nearby: "Somunnan Gamjatang (2 min), Jayeondo (3 min)",
    verdict:
      "The one-stop K-beauty haul — bring your passport for the tax refund, come early if you want the skin analysis.",
    reviews:
      "The flagship reads more like a beauty theme park than a drugstore: multiple floors, hands-on skin-analysis and testing stations, and on-the-spot tax refunds for foreign passports. It gets very crowded — for the skin analysis, reviewers line up well before opening since daily slots cap out fast.",
  },
  {
    id: "jayeondo",
    n: 5,
    time: "3:30 PM",
    part: "Afternoon",
    nameEn: "Jayeondo Salt Bread",
    nameKr: "자연도소금빵 성수",
    category: "Salt-bread bakery",
    emoji: "🥐",
    rating: 4.3,
    reviewCount: 854,
    lat: 37.5423017,
    lng: 127.0554582,
    placeId: "ChIJqW7Uqo2lfDURHss_BAbwIkk",
    price: "₩ · box ₩12,000",
    waiting: "Line looks long but moves quickly",
    breakTime: "None",
    closed: "Open daily · 09:00–22:00",
    english: "Easy — kiosk order, single item",
    nearby: "Olive Young N (3 min), Zodiac (3 min)",
    verdict:
      "One thing, done perfectly — grab a bag to go and eat it warm on the walk.",
    reviews:
      "A single-product bakery that draws a line for good reason: order and pay at the kiosk, then collect a bag of warm, crisp-shelled salt bread with a soft, buttery core. Reviewers note the queue moves fast and the bread stays good even a day later.",
  },
  {
    id: "amore",
    n: 6,
    time: "4:00 PM",
    part: "Afternoon",
    nameEn: "Amore Seongsu",
    nameKr: "아모레 성수",
    category: "Beauty flagship",
    emoji: "💄",
    rating: 4.8,
    reviewCount: 873,
    lat: 37.5444101,
    lng: 127.0591197,
    placeId: "ChIJsy6u20mlfDURQOlVT0xmv6U",
    price: "₩₩–₩₩₩ · experiences vary",
    waiting: "Consultations can have a short wait",
    breakTime: "None",
    closed: "⚠ Closed Mondays · Tue–Sun 10:30–20:30",
    english: "Good — consultation-based, staff attentive",
    nearby: "Olive Young N (8 min, east end of route)",
    verdict:
      "Book time for the custom lipstick — it's the one beauty souvenir you can't get anywhere else.",
    reviews:
      "The signature draw is the make-it-yourself experience — custom lipstick and foundation shade-matching with patient, no-pressure staff in a calm, beautifully designed space. Reviewers repeatedly say to budget real time for it and enjoy the unhurried consultation.",
  },
  {
    id: "zodiac",
    n: 7,
    time: "6:30 PM",
    part: "Evening",
    nameEn: "Zodiac",
    nameKr: "성수 바 조디악",
    category: "Cocktail bar",
    emoji: "🍸",
    rating: 4.9,
    reviewCount: 122,
    lat: 37.5418621,
    lng: 127.0545552,
    placeId: "ChIJW3BKHPKlfDURMVEX8qlX1XY",
    price: "₩₩",
    waiting: "Small room — can fill up",
    breakTime: "None",
    closed: "Open daily · 18:00–02:00 (evenings only)",
    english: "OK",
    nearby: "Jayeondo (3 min); bridges east to bd Burger / Daelim (5–7 min)",
    verdict:
      "End the day with your star-sign cocktail — small, stylish, and rated Seongsu's best (4.9).",
    reviews:
      "A tiny, cozy bar built around a horoscope theme, with beautifully presented star-sign signature cocktails that reviewers rate very highly. Bartenders come across as friendly and skilled, though a couple of foreign guests at the counter noted less small talk — likely a language thing.",
  },
];

// ---------------------------------------------------------------------------
// Course 2 · Seongsu-ro East — warehouse cafés & dessert
// ---------------------------------------------------------------------------
export const COURSE_2_STOPS: Stop[] = [
  {
    id: "bd-burger",
    n: 1,
    time: "12:00 PM",
    part: "Afternoon",
    nameEn: "bd Burger Seongsu",
    nameKr: "bd버거 성수",
    category: "Smashburger",
    emoji: "🍔",
    rating: 4.8,
    reviewCount: 733,
    lat: 37.5410589,
    lng: 127.0564084,
    placeId: "ChIJnQhJ2ZOkfDURatV1_omsUeg",
    price: "₩ · ₩10,000–13,000",
    waiting: "Popular; line at peak",
    breakTime: "None",
    closed: "Open daily · 11:30–21:15",
    english: "OK — visual menu, pay at seat",
    nearby: "Daelim Changgo (1 min, same block)",
    verdict:
      "Showed up on every list we cross-checked — get the wasabi shrimp burger, don't skip the eggplant fries.",
    reviews:
      "A cult burger spot that appears across multiple independent local guides, known for thick, juicy patties and a standout shrimp burger, with sides like the eggplant fries drawing special mention. It's on the second floor — easy to miss — and you pay right at your seat.",
  },
  {
    id: "daelim",
    n: 2,
    time: "1:30 PM",
    part: "Afternoon",
    nameEn: "Daelim Changgo",
    nameKr: "대림창고",
    category: "Warehouse café",
    emoji: "☕",
    rating: 4.2,
    reviewCount: 2826,
    lat: 37.5418384,
    lng: 127.0564636,
    placeId: "ChIJi_M445OkfDURBV_ePY2qCHo",
    price: "₩₩–₩₩₩ · atmosphere premium",
    waiting: "Large space — usually seatable",
    breakTime: "None",
    closed: "Open daily · 11:00–22:00",
    english: "OK",
    nearby: "bd Burger (1 min); Zodiac (5–7 min west)",
    verdict:
      "The OG warehouse café — come for the cathedral-like space, not the coffee, and know it's a photo destination.",
    reviews:
      "The original warehouse-turned-café that defined industrial Seongsu: soaring ceilings, exposed brick, live bean roasting, and cinematic afternoon light through huge old windows. Reviewers are candid that coffee and bakery are average and pricey and the music runs loud — you're paying for the space, and most feel it's worth it.",
  },
  {
    id: "standard-bread",
    n: 3,
    time: "3:00 PM",
    part: "Afternoon",
    nameEn: "Standard Bread Seongsu",
    nameKr: "스탠다드브레드 성수",
    category: "Brunch bakery",
    emoji: "🥐",
    rating: 4.8,
    reviewCount: 2986,
    lat: 37.5416845,
    lng: 127.0612531,
    placeId: "ChIJf5seGgClfDURTfd1UENPyV8",
    price: "₩₩",
    waiting: "Online waitlist (explore while you wait)",
    breakTime: "None",
    closed: "Open daily · 09:00–21:00",
    english: "Good — online waitlist, self-service counter",
    nearby: "LCDC Seoul (1 min)",
    verdict:
      "The brunch anchor for the east side — put your name on the online list, then shop LCDC while you wait.",
    reviews:
      "A brunch-and-bakery favorite (4.8, ~3,000 reviews) whose crème brûlée French toast and 'tissue bread' get the most love. You join an online waitlist, wander the nearby shops, then order self-service at the counter; the recipe-covered walls make it a pretty, relaxed sit-down.",
  },
  {
    id: "lcdc",
    n: 4,
    time: "4:30 PM",
    part: "Afternoon",
    nameEn: "LCDC Seoul",
    nameKr: "LCDC SEOUL",
    category: "Concept store + café",
    emoji: "🏬",
    rating: 4.3,
    reviewCount: 207,
    lat: 37.5415795,
    lng: 127.0614594,
    placeId: "ChIJM_O6RYqlfDURu7rlx8Fvdtg",
    price: "₩₩ · shops vary",
    waiting: "Walk-in",
    breakTime: "None",
    closed: "Open daily · 10:00–20:00",
    english: "OK",
    nearby: "Standard Bread (1 min)",
    verdict:
      "One building, many little brands plus a quiet café — the natural pause point on the east-side crawl.",
    reviews:
      "A curated concept building stacking small independent shops, rotating art exhibitions, and a calm café (Ephemera) for a mid-crawl break — reviewers enjoy it as a one-building browse. Paid valet is available and shoppers get an hour of free parking.",
  },
];

// ---------------------------------------------------------------------------
// Course 1 alternates — same walkable cluster, swap in when a line is too long.
// ---------------------------------------------------------------------------
export const COURSE_1_ALTERNATES: Stop[] = [
  {
    id: "seongsu-jokbal",
    n: 0,
    time: "",
    part: "More eats in the core",
    nameEn: "Seongsu Jokbal",
    nameKr: "성수족발",
    category: "Braised pig's feet",
    emoji: "🐷",
    rating: 4.4,
    reviewCount: 0,
    lat: 37.5449,
    lng: 127.0546,
    placeId: "ChIJscppWpakfDUReDe90u9D0HE",
    price: "₩ · ₩10,000–20,000",
    waiting: "Small space — expect a queue",
    breakTime: "None",
    closed: "Open daily · 12:00–22:00",
    english: "Limited — very local",
    nearby: "5 min north of the Olive Young / Boseung Hoegwan core",
    verdict:
      "Braised jokbal that converts skeptics — a small room, worth the wait.",
    reviews:
      "Frequently called one of Seoul's best jokbal spots — tender, perfectly seasoned meat with an ideal meat-to-skin ratio and refreshing sides, praised even by longtime residents. The room is small so waits are common, and staff can get pulled toward heavy delivery orders at busy times.",
  },
  {
    id: "midoin",
    n: 0,
    time: "",
    part: "More eats in the core",
    nameEn: "MiDoin Seongsu",
    nameKr: "미도인 성수점",
    category: "Japanese steak & pork bowls",
    emoji: "🥩",
    rating: 4.4,
    reviewCount: 0,
    lat: 37.5427,
    lng: 127.0541,
    placeId: "ChIJwfXUspClfDURvohRdnYkI64",
    price: "₩ · ~₩10,000 pp",
    waiting: "~30 min at peak; this branch quieter",
    breakTime: "None",
    closed: "Open daily · 11:30–21:00",
    english: "Good — foreigner-welcoming staff",
    nearby: "Somunnan Gamjatang (2 min)",
    verdict:
      "Cheap, cozy Japanese steak bowls — the easy sit-down lunch when the gamjatang line is too long.",
    reviews:
      "A casual favorite for Japanese-style steak and pork bowls at around $10 a head, with most praising balanced flavors, kind staff, and this branch being less packed than others. A minority found the steak itself underwhelming, so set expectations at 'reliable casual' rather than fine dining.",
  },
  {
    id: "boseung-hoegwan",
    n: 0,
    time: "",
    part: "More eats in the core",
    nameEn: "Boseung Hoegwan Seongsu",
    nameKr: "보승회관 성수역점",
    category: "Dwaeji gukbap",
    emoji: "🍚",
    rating: 4.3,
    reviewCount: 0,
    lat: 37.5445,
    lng: 127.0555,
    placeId: "ChIJkZ37NAClfDURhTeNj8TSI3c",
    price: "₩ · ~₩10,000",
    waiting: "Usually walk-in",
    breakTime: "None — effectively 24h",
    closed: "Roughly 24h (Sun until 22:00)",
    english: "OK — iPad ordering",
    nearby: "Olive Young N (2 min)",
    verdict:
      "Warm pork gukbap for solo diners — order on the tablet and grab a counter seat.",
    reviews:
      "A comforting pork-and-rice soup spot by the station with rich, clean broth and good sliced pork, tablet-based ordering, and counter seats well suited to solo diners. Some note the side dishes are modest and each person is required to order a soup.",
  },
  {
    id: "menchuru",
    n: 0,
    time: "",
    part: "More eats in the core",
    nameEn: "Menchuru Seongsu",
    nameKr: "멘츠루 성수",
    category: "Japanese ramen",
    emoji: "🍜",
    rating: 4.3,
    reviewCount: 0,
    lat: 37.5432,
    lng: 127.0548,
    placeId: "ChIJ1SkVGgClfDUR6-eYvX0JDTE",
    price: "₩ · ₩10,000–11,000",
    waiting: "Moderate",
    breakTime: "None",
    closed: "Open daily · ~11:00–21:00",
    english: "Limited — kiosk ordering",
    nearby: "Somunnan Gamjatang (3 min)",
    verdict:
      "A reliable ramen fix on the block — kiosk ordering makes it easy despite the language gap.",
    reviews:
      "A tidy ramen bar where the shoyu broth reads light but flavorful (you can ask staff to adjust the saltiness), with karaage and takoyaki earning repeat praise and well-cooked noodles throughout. Staff English is limited, but ordering is by kiosk, and it doubles as a good spot for an evening beer.",
  },
];

// ---------------------------------------------------------------------------
// Deep-local detours — don't sit in either walkable cluster; standalone callouts.
// ---------------------------------------------------------------------------
export const DEEP_LOCAL_DETOURS: Stop[] = [
  {
    id: "sigoljib",
    n: 0,
    time: "",
    part: "Deep-local detour",
    nameEn: "Sigoljib",
    nameKr: "뚝도시장 시골집",
    category: "No-menu market eatery",
    emoji: "🍶",
    rating: 4.3,
    reviewCount: 0,
    lat: 37.5471,
    lng: 127.0486,
    placeId: "ChIJF-CKDg-lfDURy_Cm4l5kZpQ",
    price: "₩ · sides ~₩10,000, soju ₩3,000",
    waiting: "Small; casual",
    breakTime: "None",
    closed: "Hours vary — call ahead",
    english: "None — no menu, very local",
    nearby: "Ttukdo Market (south of the core, ~10 min)",
    verdict:
      "No menu, no English, no frills — the deep-local drinking spot for the truly adventurous.",
    reviews:
      "A menu-less market eatery where you simply tell the owner what you feel like and she cooks it — cheap, unpretentious, now run by the founder's daughter, and loved for old-school drinking. One skeptic cautions against arriving expecting retro romance; it's honest food, not a themed experience.",
  },
  {
    id: "heideun",
    n: 0,
    time: "",
    part: "Deep-local detour",
    nameEn: "Heideun",
    nameKr: "헤이든 성수",
    category: "Sashimi & soju hideout",
    emoji: "🐟",
    rating: 4.6,
    reviewCount: 0,
    lat: 37.5449,
    lng: 127.0447,
    placeId: "ChIJgb18NAClfDURTTOWKmLBkcg",
    price: "₩₩",
    waiting: "Small; late-night friendly",
    breakTime: "None",
    closed: "Hours vary — call ahead",
    english: "Limited",
    nearby: "Seoul Forest side (west of the core, ~15 min)",
    verdict:
      "A hidden sashimi-and-drinks nook near Seoul Forest — worth the detour for a quiet local night.",
    reviews:
      "A tucked-away seafood-and-soju hideout where daily sashimi and melt-in-the-mouth aged tuna draw praise, alongside creative touches like yuzu tomatoes and clam kalguksu. The owner is warm and it suits a low-key late drink, though one visitor found a few dishes uneven.",
  },
];

export type Course = {
  id: CourseId;
  title: string;
  subtitle: string;
  walk: string;
  stops: Stop[];
};

export const COURSES: Record<CourseId, Course> = {
  1: {
    id: 1,
    title: "Yeonmujang-gil",
    subtitle: "Beauty flagships + local eats",
    walk: "~1.2 km · all a 10-min walk apart",
    stops: COURSE_1_STOPS,
  },
  2: {
    id: 2,
    title: "Seongsu-ro East",
    subtitle: "Warehouse cafés & dessert",
    walk: "~0.8 km · a slower, shorter crawl",
    stops: COURSE_2_STOPS,
  },
};

export function getCourse(id: CourseId): Course {
  return COURSES[id];
}
