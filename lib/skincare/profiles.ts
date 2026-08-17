export type SkinRoutineStep = { step: string; detail: string };

export type SkinGuideProfile = {
  slug:
    | "hydration-seeker"
    | "sensitive-comfort"
    | "oil-water-balancer"
    | "texture-reset"
    | "steady-radiance"
    | "balanced-basics";
  name: string;
  tagline: string;
  startingPoints: string[];
  lookFor: string[];
  useCarefully: string[];
  routine: SkinRoutineStep[];
};

export const SKIN_GUIDE_PROFILES: SkinGuideProfile[] = [
  {
    slug: "hydration-seeker",
    name: "The Hydration Seeker",
    tagline:
      "Skin that often feels tight or depleted and benefits from steady, layered hydration.",
    startingPoints: [
      "Keep cleansing gentle and comfortable",
      "Layer hydration before sealing it in",
      "Adjust richness to the season",
    ],
    lookFor: ["Humectant toners or serums", "Barrier-supportive moisturizers"],
    useCarefully: ["Harsh cleansing", "Too many exfoliating steps at once"],
    routine: [
      {
        step: "Cleanse",
        detail: "Choose a cleanser that does not leave skin feeling tight.",
      },
      {
        step: "Hydrate",
        detail: "Apply a hydrating toner or serum to slightly damp skin.",
      },
      {
        step: "Seal",
        detail: "Follow with a moisturizer that feels comfortable, not heavy.",
      },
      {
        step: "Protect",
        detail: "Finish the morning routine with broad-spectrum sunscreen.",
      },
    ],
  },
  {
    slug: "sensitive-comfort",
    name: "The Sensitive Comfort Seeker",
    tagline:
      "Skin that reacts unpredictably and does best with a calm, low-change routine.",
    startingPoints: [
      "Keep the routine short and consistent",
      "Introduce one new product at a time",
      "Prioritize comfort over active intensity",
    ],
    lookFor: [
      "Simple soothing formulas",
      "Fragrance-free options when preferred",
    ],
    useCarefully: ["Stacked actives", "Frequent product switching"],
    routine: [
      {
        step: "Cleanse",
        detail: "Use a mild cleanser only as often as your skin needs.",
      },
      {
        step: "Comfort",
        detail: "Add one simple hydrating or soothing layer.",
      },
      {
        step: "Moisturize",
        detail: "Use a familiar moisturizer with a comfortable finish.",
      },
      {
        step: "Protect",
        detail: "Choose a sunscreen you can wear consistently.",
      },
    ],
  },
  {
    slug: "oil-water-balancer",
    name: "The Oil–Water Balancer",
    tagline:
      "Skin balancing visible shine with enough hydration to stay comfortable.",
    startingPoints: [
      "Avoid treating oiliness with aggressive cleansing",
      "Keep hydration light and consistent",
      "Use richer products only where needed",
    ],
    lookFor: [
      "Light hydrating layers",
      "Fast-absorbing gel or lotion textures",
    ],
    useCarefully: [
      "Stripping cleansers",
      "Heavy layers across the entire face",
    ],
    routine: [
      {
        step: "Cleanse",
        detail: "Cleanse the skin without chasing a squeaky finish.",
      },
      {
        step: "Hydrate",
        detail: "Use a light toner or serum across the face.",
      },
      {
        step: "Balance",
        detail: "Apply moisturizer selectively or choose a light gel-cream.",
      },
      { step: "Protect", detail: "Finish with a comfortable sunscreen." },
    ],
  },
  {
    slug: "texture-reset",
    name: "The Texture Reset",
    tagline:
      "A steady approach to uneven-looking texture and visible pores without over-correcting.",
    startingPoints: [
      "Build consistency before adding exfoliation",
      "Change only one treatment step at a time",
      "Support the skin between active days",
    ],
    lookFor: ["Gentle exfoliating options", "Hydrating support products"],
    useCarefully: [
      "Daily exfoliation by default",
      "Multiple strong actives in one routine",
    ],
    routine: [
      {
        step: "Cleanse",
        detail: "Start with a dependable, non-stripping cleanser.",
      },
      {
        step: "Treat",
        detail: "Use one texture-focused step at a conservative frequency.",
      },
      {
        step: "Recover",
        detail: "Keep non-treatment days simple and moisturizing.",
      },
      {
        step: "Protect",
        detail: "Wear sunscreen consistently, especially with exfoliation.",
      },
    ],
  },
  {
    slug: "steady-radiance",
    name: "The Steady Radiance",
    tagline:
      "Skin focused on an even, rested-looking glow through patient daily care.",
    startingPoints: [
      "Treat radiance as a long-term routine",
      "Pair targeted care with daily protection",
      "Avoid changing several brightening steps together",
    ],
    lookFor: [
      "Antioxidant or tone-supporting serums",
      "Comfortable daily sunscreen",
    ],
    useCarefully: [
      "Fast-result promises",
      "Combining too many targeted serums",
    ],
    routine: [
      {
        step: "Cleanse",
        detail: "Use a gentle cleanser that supports daily consistency.",
      },
      {
        step: "Support",
        detail: "Choose one radiance-focused serum and use it steadily.",
      },
      {
        step: "Moisturize",
        detail: "Maintain hydration with a finish you enjoy.",
      },
      {
        step: "Protect",
        detail: "Make sunscreen the non-negotiable morning step.",
      },
    ],
  },
  {
    slug: "balanced-basics",
    name: "The Balanced Basics",
    tagline:
      "Mostly comfortable skin that benefits from a simple routine and thoughtful adjustments.",
    startingPoints: [
      "Keep what is already working",
      "Add products only for a clear reason",
      "Adjust texture rather than rebuilding the routine",
    ],
    lookFor: ["Reliable everyday essentials", "Balanced, versatile textures"],
    useCarefully: [
      "Trend-driven overhauls",
      "Adding steps without a specific goal",
    ],
    routine: [
      {
        step: "Cleanse",
        detail: "Use a straightforward cleanser suited to the time of day.",
      },
      {
        step: "Support",
        detail: "Add one optional serum for your current priority.",
      },
      {
        step: "Moisturize",
        detail: "Choose a balanced moisturizer and adjust seasonally.",
      },
      {
        step: "Protect",
        detail: "Finish mornings with broad-spectrum sunscreen.",
      },
    ],
  },
];

export const SKIN_GUIDE_PROFILE_SLUGS = SKIN_GUIDE_PROFILES.map(
  (profile) => profile.slug
);

export function getSkinGuideProfile(slug: string) {
  return SKIN_GUIDE_PROFILES.find((profile) => profile.slug === slug);
}
