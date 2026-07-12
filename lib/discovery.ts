export type DiscoveryLink = {
  label: string;
  href: string;
};

export type GuideSeriesLink = {
  title: string;
  deck: string;
  href: string;
  status: "planned" | "researching" | "draft" | "published";
};

export type PlaceType =
  "hair-salon" | "head-spa" | "skin-clinic" | "beauty-store";

export type Place = {
  slug: string;
  name: string;
  type: PlaceType;
  neighborhood: string;
  summary: string;
  overview: string;
  whyGo: string[];
  bestFor: string[];
  signatureServices: string[];
  priceRange?: string;
  englishAvailable?: boolean | "unknown";
  address?: string;
  openingHours?: string;
  bookingUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  mapUrl?: string;
  googleMapUrl?: string;
  naverMapUrl?: string;
  kakaoMapUrl?: string;
  image: string | null;
  imageAlt: string;
  practicalTips: string[];
  nearbyPlaceSlugs: string[];
  relatedGuideSlugs: string[];
  ctaLabel: string;
  ctaUrl?: string;
  lastVerified: string;
  featured?: boolean;
  sample?: boolean;
};

export type Neighborhood = {
  slug: string;
  name: string;
  image: string | null;
  imageAlt: string;
  positioning: string;
  introduction: string;
  whyVisit: string[];
  bestExperiences: string[];
  itinerary: string[];
  featuredPlaceSlugs: string[];
  relatedGuideSlugs: string[];
};

export type GuideCategorySlug =
  "best-of-seoul" | "neighborhoods" | "itineraries" | "how-to";

export type GuideRecommendation = {
  placeSlug: string;
  editorNote: string;
};

export type Guide = {
  slug: string;
  category: GuideCategorySlug;
  title: string;
  deck: string;
  intro: string;
  sections?: { title: string; body: string[] }[];
  relatedSeries?: GuideSeriesLink[];
  lastUpdated: string;
  heroImage: string | null;
  heroAlt: string;
  whoFor: string[];
  quickRecommendations: string[];
  recommendations: GuideRecommendation[];
  comparison: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
  relatedNeighborhoodSlugs: string[];
  relatedStorySlugs: string[];
};

export type EditSectionSlug =
  "products" | "new-and-noteworthy" | "editors-picks";

export type Product = {
  slug: string;
  brand: string;
  name: string;
  category: string;
  note: string;
  price: string;
  image: string | null;
  imageAlt: string;
  retailerUrl?: string;
  disclosureRequired?: boolean;
  section: EditSectionSlug;
};

export type CategoryLanding = {
  slug: string;
  title: string;
  intro: string;
  featuredStorySlug?: string;
  featuredGuideSlug?: string;
  featuredPlaceSlugs: string[];
  related: DiscoveryLink[];
};

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  "hair-salon": "Hair Salon",
  "head-spa": "Head Spa",
  "skin-clinic": "Skin Clinic",
  "beauty-store": "Beauty Store",
};

export const PLACE_TYPE_ROUTES: Record<PlaceType, string> = {
  "hair-salon": "/places/hair-salons",
  "head-spa": "/places/head-spas",
  "skin-clinic": "/places/skin-clinics",
  "beauty-store": "/places/beauty-stores",
};

export const PLACES: Place[] = [
  {
    slug: "soonsiki-hair-hongdae",
    name: "Soonsiki Hair Hongdae",
    type: "hair-salon",
    neighborhood: "Hongdae",
    summary: "Creative color, layered cuts, and youth-culture energy.",
    overview:
      "A sample listing for the kind of salon international visitors often need: style-forward, easy to understand, and useful for planning a beauty day around Hongdae.",
    whyGo: ["Color-forward hair mood", "Good fit for trend-led cuts"],
    bestFor: ["Creative cuts", "Color consults", "First Seoul salon visit"],
    signatureServices: ["Layered cut", "Color design", "Styling"],
    priceRange: "$$",
    englishAvailable: "unknown",
    image: null,
    imageAlt: "Bathroom counter with beauty tools and bottles",
    practicalTips: ["Bring reference images.", "Confirm color pricing first."],
    nearbyPlaceSlugs: ["myeongdong-olive-young-flagship"],
    relatedGuideSlugs: ["english-speaking-hair-salons-seoul"],
    ctaLabel: "Check Booking Options",
    lastVerified: "2026-07-12",
    featured: true,
    sample: true,
  },
  {
    slug: "aman-salon-hannam",
    name: "Aman Salon Hannam",
    type: "hair-salon",
    neighborhood: "Hannam",
    summary: "Quiet, polished salon energy for refined cuts and styling.",
    overview:
      "A Hannam sample for premium salon discovery, designed for visitors who want a calmer, less tourist-heavy appointment.",
    whyGo: ["Quiet luxury mood", "Strong match for polished styling"],
    bestFor: ["Soft layers", "Blowouts", "Low-key luxury"],
    signatureServices: ["Cut", "Treatment", "Styling"],
    priceRange: "$$$",
    englishAvailable: "unknown",
    image: null,
    imageAlt: "Person applying skincare serum in a calm bathroom",
    practicalTips: ["Book ahead for weekends.", "Ask about consultation time."],
    nearbyPlaceSlugs: ["hannam-curated-beauty-store"],
    relatedGuideSlugs: ["english-speaking-hair-salons-seoul"],
    ctaLabel: "Visit Official Website",
    lastVerified: "2026-07-12",
    featured: true,
    sample: true,
  },
  {
    slug: "sool-loft-head-spa-seongsu",
    name: "Sool Loft Head Spa Seongsu",
    type: "head-spa",
    neighborhood: "Seongsu",
    summary: "A slow scalp-care stop for a beauty itinerary in Seongsu.",
    overview:
      "A sample head spa profile for Seoul discovery pages, with the fields needed for future booking and map integrations.",
    whyGo: ["Scalp care as ritual", "Pairs well with a Seongsu afternoon"],
    bestFor: ["Scalp reset", "Relaxed itinerary", "First head spa"],
    signatureServices: ["Scalp analysis", "Head spa", "Hair treatment"],
    priceRange: "$$",
    englishAvailable: "unknown",
    image: null,
    imageAlt: "Minimal amber beauty bottle on a marble surface",
    practicalTips: [
      "Allow extra time after the treatment.",
      "Avoid tight hats after.",
    ],
    nearbyPlaceSlugs: ["seongsu-indie-beauty-studio"],
    relatedGuideSlugs: ["best-head-spas-in-seoul"],
    ctaLabel: "View on Map",
    lastVerified: "2026-07-12",
    featured: true,
    sample: true,
  },
  {
    slug: "gangnam-skin-booster-clinic",
    name: "Gangnam Skin Booster Clinic",
    type: "skin-clinic",
    neighborhood: "Gangnam",
    summary:
      "Clinic discovery sample for glow, texture, and recovery planning.",
    overview:
      "A structured clinic listing model for treatment research. Final listings should be verified against official clinic information before publication.",
    whyGo: ["Treatment culture context", "Useful for comparison guides"],
    bestFor: ["Skin boosters", "Consultation planning", "Recovery routines"],
    signatureServices: [
      "Skin booster consult",
      "Laser consult",
      "Recovery care",
    ],
    priceRange: "$$$",
    englishAvailable: "unknown",
    image: null,
    imageAlt: "Aesthetician performing a facial treatment in a clinic room",
    practicalTips: ["Confirm downtime.", "Ask what aftercare is included."],
    nearbyPlaceSlugs: ["apgujeong-treatment-lounge"],
    relatedGuideSlugs: ["seoul-skin-clinic-first-visit"],
    ctaLabel: "Check Booking Options",
    lastVerified: "2026-07-12",
    featured: true,
    sample: true,
  },
  {
    slug: "myeongdong-olive-young-flagship",
    name: "Myeongdong K-Beauty Flagship",
    type: "beauty-store",
    neighborhood: "Myeongdong",
    summary: "One-stop browsing for first-time Korean beauty shopping.",
    overview:
      "A sample beauty-store listing for visitors who want efficient product discovery without turning the site into a hard-sell shopping page.",
    whyGo: ["Easy first stop", "Good for comparing textures"],
    bestFor: ["First-time visitors", "Sunscreen browsing", "Toner pads"],
    signatureServices: [
      "Product browsing",
      "Tax-free shopping",
      "Trend scouting",
    ],
    priceRange: "$-$$",
    englishAvailable: true,
    image: null,
    imageAlt: "Sunscreen and beauty objects arranged on a flat lay",
    practicalTips: [
      "Go early to avoid crowds.",
      "Patch test before buying multiples.",
    ],
    nearbyPlaceSlugs: ["soonsiki-hair-hongdae"],
    relatedGuideSlugs: ["myeongdong-beauty-shopping-guide"],
    ctaLabel: "View on Map",
    lastVerified: "2026-07-12",
    featured: true,
    sample: true,
  },
  {
    slug: "apgujeong-treatment-lounge",
    name: "Apgujeong Treatment Lounge",
    type: "skin-clinic",
    neighborhood: "Apgujeong",
    summary: "An elevated treatment-planning sample for Apgujeong beauty days.",
    overview:
      "A sample listing for premium treatment discovery, built to support future verified services, prices, and booking links.",
    whyGo: ["Premium beauty district", "Good for treatment comparison"],
    bestFor: [
      "Slow-aging consults",
      "Laser research",
      "Clinic-to-home aftercare",
    ],
    signatureServices: [
      "Laser consult",
      "Lifting consult",
      "Post-treatment care",
    ],
    priceRange: "$$$$",
    englishAvailable: "unknown",
    image: null,
    imageAlt: "Professional skin treatment with blue light",
    practicalTips: [
      "Avoid stacking treatments.",
      "Plan recovery time into the trip.",
    ],
    nearbyPlaceSlugs: ["gangnam-skin-booster-clinic"],
    relatedGuideSlugs: ["seoul-skin-clinic-first-visit"],
    ctaLabel: "Visit Official Website",
    lastVerified: "2026-07-12",
    featured: true,
    sample: true,
  },
  {
    slug: "hannam-curated-beauty-store",
    name: "Hannam Curated Beauty Store",
    type: "beauty-store",
    neighborhood: "Hannam",
    summary:
      "A quieter product stop for edited skincare and fragrance browsing.",
    overview:
      "A sample store listing for more selective product discovery beyond the highest-traffic shopping streets.",
    whyGo: ["Curated shelves", "Less overwhelming product discovery"],
    bestFor: ["Gift shopping", "Niche brands", "Quiet browsing"],
    signatureServices: ["Product edit", "Fragrance browsing", "Gift selection"],
    priceRange: "$$-$$$",
    englishAvailable: "unknown",
    image: null,
    imageAlt: "Serum texture being dropped into hands",
    practicalTips: [
      "Ask what is new locally.",
      "Check return policies before buying.",
    ],
    nearbyPlaceSlugs: ["aman-salon-hannam"],
    relatedGuideSlugs: ["hannam-beauty-guide"],
    ctaLabel: "View on Map",
    lastVerified: "2026-07-12",
    sample: true,
  },
  {
    slug: "seongsu-indie-beauty-studio",
    name: "Seongsu Indie Beauty Studio",
    type: "beauty-store",
    neighborhood: "Seongsu",
    summary: "Independent beauty mood and emerging product ideas.",
    overview:
      "A sample Seongsu listing for the kind of small studio or store that makes a neighborhood guide feel discoverable.",
    whyGo: ["Emerging trends", "Good editorial browsing"],
    bestFor: ["New brands", "Texture discovery", "Trend scouting"],
    signatureServices: [
      "Product edit",
      "Pop-up browsing",
      "Beauty culture stop",
    ],
    priceRange: "$$",
    englishAvailable: "unknown",
    image: null,
    imageAlt: "Summer beauty objects arranged with sunscreen",
    practicalTips: [
      "Check Instagram before visiting.",
      "Hours can change for pop-ups.",
    ],
    nearbyPlaceSlugs: ["sool-loft-head-spa-seongsu"],
    relatedGuideSlugs: ["seongsu-beauty-guide"],
    ctaLabel: "Visit Official Website",
    lastVerified: "2026-07-12",
    sample: true,
  },
];

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    slug: "seongsu",
    name: "Seongsu",
    image: null,
    imageAlt: "Summer beauty essentials arranged on a bright surface",
    positioning: "Beauty flagships, pop-ups, coffee, and design-led browsing",
    introduction:
      "Seongsu is where beauty browsing sits beside design stores, coffee, fragrance, pop-ups, and slower side streets rather than a single checklist stop.",
    whyVisit: ["Beauty pop-ups", "Concept stores", "Cafe-friendly routes"],
    bestExperiences: [
      "One beauty anchor",
      "Concept-store browsing",
      "Seoul Forest finish",
    ],
    itinerary: [
      "Start near Seongsu Station.",
      "Browse concept stores before peak crowds.",
      "Drift toward Seoul Forest after one beauty anchor.",
    ],
    featuredPlaceSlugs: [
      "sool-loft-head-spa-seongsu",
      "seongsu-indie-beauty-studio",
    ],
    relatedGuideSlugs: ["seongsu-beauty-guide"],
  },
  {
    slug: "hannam",
    name: "Hannam",
    image: null,
    imageAlt: "Calm morning beauty routine with serum",
    positioning: "Quiet luxury, premium salons, and curated spaces",
    introduction:
      "Hannam is for visitors who want beauty discovery to feel quieter, more edited, and less rushed.",
    whyVisit: ["Premium salons", "Curated stores", "Low-key luxury"],
    bestExperiences: [
      "Polished salon visit",
      "Selective shopping",
      "Slow afternoon",
    ],
    itinerary: [
      "Book a salon appointment.",
      "Browse an edited store.",
      "Keep the evening open.",
    ],
    featuredPlaceSlugs: ["aman-salon-hannam", "hannam-curated-beauty-store"],
    relatedGuideSlugs: ["hannam-beauty-guide"],
  },
  {
    slug: "gangnam",
    name: "Gangnam",
    image: null,
    imageAlt: "Aesthetic treatment room for clinic research",
    positioning: "Clinics, flagship stores, and high-performance treatments",
    introduction:
      "Gangnam is the most useful district for comparing clinic culture, treatments, and high-performance beauty services.",
    whyVisit: ["Clinic density", "Flagship stores", "Treatment research"],
    bestExperiences: [
      "Clinic consultation",
      "Slow-aging planning",
      "Flagship browsing",
    ],
    itinerary: [
      "Start with a consultation.",
      "Leave time for aftercare.",
      "Keep shopping gentle.",
    ],
    featuredPlaceSlugs: ["gangnam-skin-booster-clinic"],
    relatedGuideSlugs: ["seoul-skin-clinic-first-visit"],
  },
  {
    slug: "apgujeong",
    name: "Apgujeong",
    image: null,
    imageAlt: "Professional skin recovery treatment light",
    positioning: "Celebrity salons and elevated beauty experiences",
    introduction:
      "Apgujeong brings the polished side of Seoul beauty into focus: salons, treatments, and premium service culture.",
    whyVisit: [
      "Premium treatments",
      "Celebrity-salon mood",
      "Elevated experiences",
    ],
    bestExperiences: [
      "Treatment consult",
      "Premium hair",
      "Post-treatment skincare planning",
    ],
    itinerary: [
      "Schedule the consult first.",
      "Keep the rest of the day easy.",
      "Shop for recovery basics.",
    ],
    featuredPlaceSlugs: ["apgujeong-treatment-lounge"],
    relatedGuideSlugs: ["seoul-skin-clinic-first-visit"],
  },
  {
    slug: "hongdae",
    name: "Hongdae",
    image: null,
    imageAlt: "Beauty bottles and tools on a bathroom counter",
    positioning: "Youth culture, creative hair, and accessible treatments",
    introduction:
      "Hongdae is a practical district for more playful hair ideas, accessible beauty stops, and trend-led browsing.",
    whyVisit: ["Creative hair", "Youth trends", "Accessible pricing"],
    bestExperiences: ["Color consult", "Layered cut", "Casual beauty browsing"],
    itinerary: [
      "Bring hair references.",
      "Book enough time.",
      "Explore nearby stores after.",
    ],
    featuredPlaceSlugs: ["soonsiki-hair-hongdae"],
    relatedGuideSlugs: ["english-speaking-hair-salons-seoul"],
  },
  {
    slug: "myeongdong",
    name: "Myeongdong",
    image: null,
    imageAlt: "Sunscreen and beauty shopping essentials",
    positioning: "One-stop K-beauty shopping for first-time visitors",
    introduction:
      "Myeongdong is the easiest first stop for product discovery, sunscreen browsing, and comparing Korean beauty textures quickly.",
    whyVisit: ["First-time shopping", "Large beauty stores", "Easy comparison"],
    bestExperiences: ["K-beauty shopping", "Sunscreen browsing", "Gift buying"],
    itinerary: [
      "Make a short product list.",
      "Swatch textures.",
      "Avoid buying too many actives at once.",
    ],
    featuredPlaceSlugs: ["myeongdong-olive-young-flagship"],
    relatedGuideSlugs: ["myeongdong-beauty-shopping-guide"],
  },
];

export const GUIDES: Guide[] = [
  {
    slug: "best-head-spas-in-seoul",
    category: "best-of-seoul",
    title: "Best Head Spas in Seoul for a Slow Scalp-Care Reset",
    deck: "Where to start if you want the head spa experience to feel calm, practical, and worth planning around.",
    intro:
      "This guide helps first-time visitors understand what to compare before booking a Seoul head spa: neighborhood, service style, language comfort, and how much time to leave in the day.",
    lastUpdated: "2026-07-12",
    heroImage: null,
    heroAlt: "Minimal beauty bottle for a calm scalp-care guide",
    whoFor: [
      "First-time head spa visitors",
      "Travelers planning a relaxed beauty day",
      "Readers comparing scalp-care services",
    ],
    quickRecommendations: [
      "Choose Seongsu for a softer itinerary.",
      "Leave 90 minutes if the menu includes scalp analysis.",
      "Avoid tight hats immediately after treatment.",
    ],
    recommendations: [
      {
        placeSlug: "sool-loft-head-spa-seongsu",
        editorNote: "Best sample pick for a Seongsu beauty afternoon.",
      },
    ],
    comparison: [
      { label: "Best neighborhood to start", value: "Seongsu" },
      { label: "Typical planning window", value: "60-120 minutes" },
      {
        label: "Booking comfort",
        value: "Confirm language support before visiting",
      },
    ],
    faqs: [
      {
        question: "What is a Korean head spa?",
        answer:
          "A Korean head spa is a scalp-focused treatment that may include cleansing, massage, analysis, steam, and hair treatment depending on the location.",
      },
      {
        question: "Should I wash my hair before a head spa?",
        answer:
          "Usually no, because cleansing is often part of the service. Confirm with the salon if you are coming after styling products or a workout.",
      },
    ],
    relatedNeighborhoodSlugs: ["seongsu", "hannam"],
    relatedStorySlugs: [
      "korean-skip-care-explained",
      "korean-clinic-to-home-skincare",
    ],
  },
  {
    slug: "english-speaking-hair-salons-seoul",
    category: "how-to",
    title: "How to Choose an English-Friendly Hair Salon in Seoul",
    deck: "A practical guide to booking cuts, color, and treatments without losing the nuance of your reference photos.",
    intro:
      "International visitors do not just need a famous salon; they need a salon where consultation, pricing, timing, and style expectations are clear.",
    lastUpdated: "2026-07-12",
    heroImage: null,
    heroAlt: "Calm mirror routine for a Seoul salon planning guide",
    whoFor: [
      "Travelers booking a salon appointment",
      "Readers planning color work",
      "People nervous about consultation language",
    ],
    quickRecommendations: [
      "Bring three reference images.",
      "Ask for a price range before color work.",
      "Avoid booking major color changes on a tight travel day.",
    ],
    recommendations: [
      {
        placeSlug: "soonsiki-hair-hongdae",
        editorNote: "Useful sample for creative hair and Hongdae energy.",
      },
      {
        placeSlug: "aman-salon-hannam",
        editorNote: "Useful sample for a calmer, premium appointment.",
      },
    ],
    comparison: [
      { label: "Creative hair", value: "Hongdae" },
      { label: "Polished styling", value: "Hannam or Apgujeong" },
      { label: "Best prep", value: "Reference images plus clear budget" },
    ],
    faqs: [
      {
        question: "How do I book a hair salon in Seoul as a foreigner?",
        answer:
          "Start by checking the salon's official booking channel, then confirm language support, price range, and service time before the appointment.",
      },
      {
        question: "Should I tip at a Korean hair salon?",
        answer:
          "Tipping is not generally expected in Korea. If a salon has a specific policy for international bookings, follow the booking instructions.",
      },
    ],
    relatedNeighborhoodSlugs: ["hongdae", "hannam", "apgujeong"],
    relatedStorySlugs: ["korean-5-step-morning-skincare-routine"],
  },
  {
    slug: "seongsu-beauty-guide",
    category: "neighborhoods",
    title: "Where to Go in Seongsu: Beauty, Coffee & Concept Stores",
    deck: "A walkable neighborhood guide to Seoul's warehouse district: beauty flagships, pop-ups, coffee, design stores, and the slower side streets locals actually use.",
    intro:
      "Seongsu is not best understood as one place to pin on a map. It is a neighborhood to move through: old factory blocks, beauty flagships, pop-ups that change by the month, design stores, coffee spaces big enough to feel like galleries, and quieter side streets where the day suddenly gets better.",
    sections: [
      {
        title: "Why Seongsu works for beauty",
        body: [
          "Seongsu rewards people who like to browse. It is flatter and more walkable than Hongdae, less clinic-coded than Gangnam, and more design-led than Myeongdong. Beauty here usually does not feel like a pure shopping errand. It sits beside fashion, fragrance, coffee, lifestyle stores, and pop-ups, which makes it one of the easiest neighborhoods for seeing how Korean beauty culture actually lives in Seoul.",
          "The trade-off is that Seongsu is no longer hidden. Weekend afternoons can feel like a slow parade. The most posted cafes and flagship stores often have lines, and the neighborhood is not especially cheap. Come for the full route and the mood of discovery, not for bargain hunting.",
        ],
      },
      {
        title: "How to walk Seongsu",
        body: [
          "The easiest mistake is treating Seongsu like a checklist. Start around Seongsu Station, walk the concept-store and pop-up streets before the crowd builds, add one beauty anchor instead of five, take a coffee break, then drift toward Seoul Forest if you want the calmer version of the neighborhood.",
          "This keeps the day from becoming a shopping marathon. Seongsu is strongest when you let beauty, coffee, design, and wandering sit together.",
        ],
      },
      {
        title: "Add one beauty anchor",
        body: [
          "For beauty, Seongsu works best with one intentional stop. That might be a brand showroom, a multi-brand store near Seoul Forest, a temporary product pop-up, or a scalp-care appointment if you want the slower version of the day.",
          "Our internal research queue currently flags Amore Seongsu, Olive Young Seoul Forest Station Branch, and Banila Co Seongsu Branch for verification. The public guide should not overpromise any of them until official pages, map listings, hours, and recent local signals are checked.",
        ],
      },
      {
        title: "Coffee is part of the route",
        body: [
          "Seongsu has one of Seoul's densest cafe scenes, and the cafes are not just resting points. They are part of the neighborhood's identity: converted warehouses, concrete interiors, large-format spaces, and queues that can become the defining experience if you arrive too late.",
          "Many famous Seongsu cafes are worth visiting for the room more than the menu. If you only have time for one, pick the space that fits your route instead of chasing the most viral dessert.",
        ],
      },
      {
        title: "A half-day Seongsu route",
        body: [
          "10:30am: arrive at Seongsu Station and walk the main concept-store streets before the crowds build. 11:00am-12:15pm: browse one flagship or pop-up, then spend the rest of the time on side streets. 12:15pm-1:15pm: choose one cafe for the space and location. 1:30pm-2:15pm: add one beauty anchor. 2:15pm-3:30pm: walk toward Seoul Forest for a calmer finish.",
          "If you want the full beauty-day version, book a scalp, hair, or skin-care appointment for late afternoon, not the beginning of the day.",
        ],
      },
    ],
    relatedSeries: [
      {
        title: "Seongsu Beauty Spots",
        deck: "A verified shortlist of beauty flagships, pop-ups, fragrance stops, scalp care, and practical product browsing around Seongsu.",
        href: "/guides/seongsu-beauty-spots",
        status: "researching",
      },
      {
        title: "Seongsu Cafes For A Beauty Break",
        deck: "Cafes chosen for route usefulness: where to pause, sit, reset your feet, and keep the day from becoming a queue marathon.",
        href: "/guides/seongsu-cafes-beauty-break",
        status: "planned",
      },
      {
        title: "Seongsu Concept Stores And Pop-Ups",
        deck: "A rotating guide to design-led stores and temporary brand spaces that explain why Seongsu feels like Seoul's retail lab.",
        href: "/guides/seongsu-concept-stores-popups",
        status: "planned",
      },
      {
        title: "What's New In Seongsu",
        deck: "A monthly or seasonal update powered by source accounts, local map checks, and traveler-friction review.",
        href: "/guides/whats-new-in-seongsu",
        status: "planned",
      },
    ],
    lastUpdated: "2026-07-12",
    heroImage: null,
    heroAlt: "Bright summer beauty objects for a Seongsu guide",
    whoFor: [
      "First-time Seongsu visitors",
      "Readers who want a neighborhood route, not one famous stop",
      "Travelers curious about beauty, coffee, pop-ups, and design stores",
    ],
    quickRecommendations: [
      "Start near Seongsu Station and drift toward Seoul Forest.",
      "Choose one beauty anchor instead of trying to complete every stop.",
      "Avoid weekend afternoons if you want the neighborhood to feel enjoyable.",
    ],
    recommendations: [
      {
        placeSlug: "sool-loft-head-spa-seongsu",
        editorNote:
          "Optional late-afternoon reset, not the whole reason to visit.",
      },
      {
        placeSlug: "seongsu-indie-beauty-studio",
        editorNote:
          "Use as a placeholder for the kind of verified beauty anchor this guide should support.",
      },
    ],
    comparison: [
      {
        label: "Best for",
        value: "Beauty browsing, pop-ups, fragrance, design, and coffee",
      },
      { label: "Best starting point", value: "Seongsu Station" },
      { label: "Best finish", value: "Seoul Forest side streets" },
      { label: "Pace", value: "Half-day, 3-4 hours" },
    ],
    faqs: [
      {
        question: "How much time do you need in Seongsu?",
        answer:
          "Half a day is enough for the main concept-store streets, one cafe, one beauty stop, and a walk toward Seoul Forest. A full day only makes sense if you add a booked treatment, a longer lunch, or several pop-ups.",
      },
      {
        question: "Is Seongsu worth it if I have already done Hongdae?",
        answer:
          "Yes. Hongdae is louder, younger, and better for music, street fashion, and budget browsing. Seongsu is more design-led and brand-experience focused, with beauty, fragrance, coffee, and lifestyle retail sitting close together.",
      },
      {
        question: "Is Seongsu good for K-beauty shopping?",
        answer:
          "Yes, but not in the same way as Myeongdong. Seongsu is better for brand experiences, pop-ups, fragrance, design-led retail, and a few practical product stops. Myeongdong is better if your goal is a fast product haul.",
      },
      {
        question: "Should I book a beauty treatment in Seongsu?",
        answer:
          "Only if it fits the day. A scalp, hair, or skin-care appointment can be a good ending to a Seongsu route, but the neighborhood guide should still work without one.",
      },
    ],
    relatedNeighborhoodSlugs: ["seongsu", "hannam"],
    relatedStorySlugs: ["korean-summer-cooling-skincare-routine"],
  },
  {
    slug: "one-day-k-beauty-itinerary",
    category: "itineraries",
    title: "One-Day K-Beauty Itinerary in Seoul",
    deck: "A gentle route for combining a service, shopping, and recovery-minded skincare without overbooking the day.",
    intro:
      "The best Seoul beauty day has one anchor appointment, one discovery stop, and enough breathing room to enjoy the neighborhood.",
    lastUpdated: "2026-07-12",
    heroImage: null,
    heroAlt: "Sunscreen and travel-friendly beauty objects",
    whoFor: [
      "First-time Seoul visitors",
      "Travelers with one open beauty day",
      "Readers who want a realistic route",
    ],
    quickRecommendations: [
      "Pick one main appointment.",
      "Do product shopping after, not before.",
      "Do not schedule high-downtime treatments before flights.",
    ],
    recommendations: [
      {
        placeSlug: "sool-loft-head-spa-seongsu",
        editorNote: "A low-downtime anchor for a beauty day.",
      },
      {
        placeSlug: "myeongdong-olive-young-flagship",
        editorNote: "A practical product comparison stop.",
      },
    ],
    comparison: [
      { label: "Low downtime", value: "Head spa or salon" },
      { label: "More research needed", value: "Skin clinic treatments" },
      { label: "Best final step", value: "Sunscreen and barrier basics" },
    ],
    faqs: [
      {
        question: "Can I do a clinic treatment and shopping on the same day?",
        answer:
          "It depends on the treatment. For anything with downtime, follow the clinic's aftercare and keep shopping light.",
      },
      {
        question: "What should I not schedule before a flight?",
        answer:
          "Avoid unfamiliar treatments, strong exfoliation, or anything with expected redness unless your provider says it is appropriate.",
      },
    ],
    relatedNeighborhoodSlugs: ["seongsu", "myeongdong", "gangnam"],
    relatedStorySlugs: ["korean-post-treatment-recovery-skincare-routine"],
  },
  {
    slug: "seoul-skin-clinic-first-visit",
    category: "how-to",
    title: "How to Plan a First Skin Clinic Visit in Seoul",
    deck: "What to compare before booking a clinic consult, from downtime and language support to aftercare.",
    intro:
      "A first clinic visit should start with clarity: what concern you are addressing, what downtime is realistic, and what aftercare you can follow while traveling.",
    lastUpdated: "2026-07-12",
    heroImage: null,
    heroAlt: "Aesthetician performing a facial treatment in a clinic room",
    whoFor: [
      "Travelers comparing skin clinics",
      "Readers curious about Korean treatments",
      "People planning recovery time",
    ],
    quickRecommendations: [
      "Ask about downtime before booking.",
      "Keep the routine simple after treatment.",
      "Do not schedule unfamiliar procedures right before a flight.",
    ],
    recommendations: [
      {
        placeSlug: "gangnam-skin-booster-clinic",
        editorNote: "Useful sample for treatment comparison in Gangnam.",
      },
      {
        placeSlug: "apgujeong-treatment-lounge",
        editorNote: "Useful sample for premium clinic planning.",
      },
    ],
    comparison: [
      { label: "Best for", value: "Consultation planning and aftercare" },
      { label: "Avoid", value: "Stacking multiple new treatments" },
      { label: "Bring", value: "Current routine and medication notes" },
    ],
    faqs: [
      {
        question: "Can foreigners go to skin clinics in Seoul?",
        answer:
          "Yes, many clinics work with international visitors, but language support, booking method, and aftercare instructions should be confirmed before visiting.",
      },
      {
        question: "What should I avoid after a clinic treatment?",
        answer:
          "Follow the provider's instructions first. In general, avoid retinol, exfoliating acids, scrubs, and strong actives until the skin is calm.",
      },
    ],
    relatedNeighborhoodSlugs: ["gangnam", "apgujeong"],
    relatedStorySlugs: ["korean-post-treatment-recovery-skincare-routine"],
  },
  {
    slug: "hannam-beauty-guide",
    category: "neighborhoods",
    title: "Hannam Beauty Guide: Quiet Luxury and Curated Spaces",
    deck: "A calmer Seoul beauty route for polished salons, edited shopping, and slower browsing.",
    intro:
      "Hannam is best for readers who want beauty discovery to feel selective and quiet rather than crowded or overly commercial.",
    lastUpdated: "2026-07-12",
    heroImage: null,
    heroAlt: "Calm morning skincare routine with serum",
    whoFor: ["Luxury-leaning travelers", "Salon visitors", "Quiet shoppers"],
    quickRecommendations: [
      "Book one anchor salon visit.",
      "Leave time for browsing.",
      "Prioritize edited spaces over quantity.",
    ],
    recommendations: [
      {
        placeSlug: "aman-salon-hannam",
        editorNote: "A sample salon anchor for a Hannam beauty day.",
      },
      {
        placeSlug: "hannam-curated-beauty-store",
        editorNote: "A sample retail stop for quieter product discovery.",
      },
    ],
    comparison: [
      { label: "Pace", value: "Slow afternoon" },
      { label: "Best for", value: "Premium salons and curated shopping" },
      { label: "Pair with", value: "A cafe or gallery stop" },
    ],
    faqs: [
      {
        question: "Is Hannam good for beauty appointments?",
        answer:
          "Yes, Hannam is useful for a calmer appointment or curated shopping stop, especially if you prefer less crowded neighborhoods.",
      },
      {
        question: "Is Hannam better than Myeongdong for shopping?",
        answer:
          "Hannam is better for a quieter edit, while Myeongdong is better for fast product comparison and first-time K-beauty shopping.",
      },
    ],
    relatedNeighborhoodSlugs: ["hannam", "seongsu"],
    relatedStorySlugs: ["korean-5-step-morning-skincare-routine"],
  },
  {
    slug: "myeongdong-beauty-shopping-guide",
    category: "neighborhoods",
    title: "Myeongdong Beauty Shopping Guide for First-Time Visitors",
    deck: "How to shop Korea's most convenient beauty district without buying every viral product at once.",
    intro:
      "Myeongdong is useful because it is dense, convenient, and easy to compare. The trick is arriving with a short list and leaving room for texture testing.",
    lastUpdated: "2026-07-12",
    heroImage: null,
    heroAlt: "Sunscreen and beauty objects arranged for shopping context",
    whoFor: [
      "First-time K-beauty shoppers",
      "Travelers with limited time",
      "Readers comparing sunscreens and toner pads",
    ],
    quickRecommendations: [
      "Start with sunscreen and barrier basics.",
      "Avoid buying multiple strong actives at once.",
      "Check luggage rules for liquids before overbuying.",
    ],
    recommendations: [
      {
        placeSlug: "myeongdong-olive-young-flagship",
        editorNote: "A practical sample stop for broad product comparison.",
      },
    ],
    comparison: [
      { label: "Best for", value: "One-stop shopping" },
      { label: "Watch out for", value: "Impulse buying too many actives" },
      { label: "Good first category", value: "Sunscreen" },
    ],
    faqs: [
      {
        question: "Is Myeongdong good for K-beauty shopping?",
        answer:
          "Yes, Myeongdong is one of the easiest places for first-time K-beauty shopping because many stores are close together.",
      },
      {
        question: "What should I buy first in Myeongdong?",
        answer:
          "Start with products you can use consistently, such as sunscreen, gentle cleanser, moisturizer, or toner pads that match your skin.",
      },
    ],
    relatedNeighborhoodSlugs: ["myeongdong", "hongdae"],
    relatedStorySlugs: ["sunscreen-as-skincare-korean-routine"],
  },
];

export const PRODUCTS: Product[] = [
  {
    slug: "beauty-of-joseon-relief-sun",
    brand: "Beauty of Joseon",
    name: "Relief Sun: Rice + Probiotics",
    category: "Sunscreen",
    note: "A soft daily SPF example for readers who want sunscreen to feel like skincare.",
    price: "$$",
    image: null,
    imageAlt: "Sunscreen tube in a flat lay",
    section: "products",
  },
  {
    slug: "anua-heartleaf-toner-pads",
    brand: "Anua",
    name: "Heartleaf Toner Pads",
    category: "Toner Pads",
    note: "Useful context for the toner-pad-as-mini-mask habit, especially when skin wants calming rather than scrubbing.",
    price: "$$",
    image: null,
    imageAlt: "Sheet mask skincare moment",
    section: "new-and-noteworthy",
  },
  {
    slug: "mixsoon-bean-essence",
    brand: "Mixsoon",
    name: "Bean Essence",
    category: "Essence",
    note: "A texture-led product example for readers exploring glow without building a 10-step routine.",
    price: "$$",
    image: null,
    imageAlt: "Serum being dropped into hands",
    section: "editors-picks",
  },
  {
    slug: "dr-forhair-scalp-tonic",
    brand: "Dr.FORHAIR",
    name: "Scalp Tonic",
    category: "Scalp Care",
    note: "A scalp-care example that connects hair routines with Korea's head spa culture.",
    price: "$$",
    image: null,
    imageAlt: "Minimal amber beauty bottle",
    section: "products",
  },
];

export const CATEGORY_LANDINGS: CategoryLanding[] = [
  {
    slug: "skincare",
    title: "Skincare",
    intro:
      "Korean skincare routines, ingredients, sunscreen habits, barrier care, and the product context that helps readers choose less but better.",
    featuredStorySlug: "korean-5-step-morning-skincare-routine",
    featuredGuideSlug: "one-day-k-beauty-itinerary",
    featuredPlaceSlugs: [
      "myeongdong-olive-young-flagship",
      "seongsu-indie-beauty-studio",
    ],
    related: [
      { label: "Treatments", href: "/beauty/treatments" },
      { label: "The Edit", href: "/the-edit/products" },
    ],
  },
  {
    slug: "hair",
    title: "Hair",
    intro:
      "Salon planning, Korean hair treatments, color references, and the practical details visitors need before booking.",
    featuredGuideSlug: "english-speaking-hair-salons-seoul",
    featuredPlaceSlugs: ["soonsiki-hair-hongdae", "aman-salon-hannam"],
    related: [
      { label: "Hair Salons", href: "/places/hair-salons" },
      { label: "Scalp", href: "/beauty/scalp" },
    ],
  },
  {
    slug: "scalp",
    title: "Scalp",
    intro:
      "Head spas, scalp care, and the slower rituals that make Korean hair wellness easier to understand.",
    featuredGuideSlug: "best-head-spas-in-seoul",
    featuredPlaceSlugs: ["sool-loft-head-spa-seongsu"],
    related: [
      { label: "Head Spas", href: "/places/head-spas" },
      { label: "Hair", href: "/beauty/hair" },
    ],
  },
  {
    slug: "treatments",
    title: "Treatments",
    intro:
      "Clinic culture, treatment explainers, post-treatment skincare, and realistic planning for Seoul beauty appointments.",
    featuredStorySlug: "korean-post-treatment-recovery-skincare-routine",
    featuredGuideSlug: "seoul-skin-clinic-first-visit",
    featuredPlaceSlugs: [
      "gangnam-skin-booster-clinic",
      "apgujeong-treatment-lounge",
    ],
    related: [
      { label: "Skin Clinics", href: "/places/skin-clinics" },
      { label: "Skincare", href: "/beauty/skincare" },
    ],
  },
];

export const GUIDE_CATEGORIES: {
  slug: GuideCategorySlug;
  title: string;
  intro: string;
}[] = [
  {
    slug: "best-of-seoul",
    title: "Best of Seoul",
    intro:
      "Selective guides for the beauty places and experiences worth shortlisting first.",
  },
  {
    slug: "neighborhoods",
    title: "Neighborhood Guides",
    intro:
      "Beauty discovery organized by how Seoul actually feels on the ground.",
  },
  {
    slug: "itineraries",
    title: "Beauty Itineraries",
    intro:
      "Practical routes for planning a beauty day without overbooking the trip.",
  },
  {
    slug: "how-to",
    title: "How-To Guides",
    intro:
      "Clear planning advice for booking, shopping, comparing, and recovering well.",
  },
];

export const EDIT_SECTIONS: {
  slug: EditSectionSlug;
  title: string;
  intro: string;
}[] = [
  {
    slug: "products",
    title: "Products",
    intro:
      "Product context for Korean beauty and haircare, chosen for usefulness rather than hype.",
  },
  {
    slug: "new-and-noteworthy",
    title: "New & Noteworthy",
    intro:
      "Emerging products, textures, and categories worth watching without turning every trend into a must-buy.",
  },
  {
    slug: "editors-picks",
    title: "Editor's Picks",
    intro:
      "A tighter edit of products and ideas that fit the A Drop of Seoul point of view.",
  },
];

export function getPlaceBySlug(slug: string) {
  return PLACES.find((place) => place.slug === slug);
}

export function getPlacesByType(type: PlaceType) {
  return PLACES.filter((place) => place.type === type);
}

export function getNeighborhoodBySlug(slug: string) {
  return NEIGHBORHOODS.find((neighborhood) => neighborhood.slug === slug);
}

export function getGuideBySlug(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug);
}

export function getGuidesByCategory(category: GuideCategorySlug) {
  return GUIDES.filter((guide) => guide.category === category);
}

export function getGuideCategoryBySlug(slug: string) {
  return GUIDE_CATEGORIES.find((category) => category.slug === slug);
}

export function getEditSectionBySlug(slug: string) {
  return EDIT_SECTIONS.find((section) => section.slug === slug);
}

export function getProductsBySection(section: EditSectionSlug) {
  return PRODUCTS.filter((product) => product.section === section);
}

export function getCategoryLandingBySlug(slug: string) {
  return CATEGORY_LANDINGS.find((category) => category.slug === slug);
}

export function getRelatedPlaces(slugs: string[]) {
  return slugs.map(getPlaceBySlug).filter((place): place is Place => !!place);
}

export function getRelatedGuides(slugs: string[]) {
  return slugs.map(getGuideBySlug).filter((guide): guide is Guide => !!guide);
}

export function formatEnglishAvailability(value: Place["englishAvailable"]) {
  if (value === true) return "English available";
  if (value === false) return "Korean only";
  return "English unknown";
}
