// The six hair profiles that anchor the Haircare hub and the (forthcoming)
// Hair Profile quiz. Content is adapted from the restructure spec (§9, §12).
// Profiles are code-defined — they're editorial hubs, not DB posts — and each
// one is a stable SEO landing at /haircare/profiles/<slug>.

export type HairProfile = {
  slug: string;
  name: string;
  /** One-line summary shown on cards and the result header. */
  tagline: string;
  /** Who tends to land here (2–4 short traits). */
  traits: string[];
  /** The core care approach for this profile (3–5 priorities). */
  care: string[];
  /** Ingredient families worth looking for. */
  lookFor: string[];
  /** What to use sparingly. */
  useCarefully: string[];
  /** The pillar guide this profile reads into (title only until authored). */
  pillarGuide: string;
  /** Supporting article topics that build out the hub. */
  guides: string[];
};

export const HAIR_PROFILES: HairProfile[] = [
  {
    slug: "lightweight-balancer",
    name: "The Lightweight Balancer",
    tagline:
      "Fine hair that gets weighed down fast — your routine should stay light at the roots.",
    traits: [
      "Fine strands",
      "Loses volume easily",
      "Sensitive to heavy products",
      "Roots go flat or oily",
    ],
    care: [
      "Light, low-residue cleansing",
      "Weightless conditioning, mid-lengths to ends",
      "Keep roots and lengths on separate routines",
      "Minimize heavy oils and butters",
    ],
    lookFor: [
      "Lightweight emollients",
      "Humectants",
      "Volumizing rinse-out care",
    ],
    useCarefully: ["Rich butters", "Heavy leave-in oils", "Root-level masks"],
    pillarGuide: "The Complete Guide to Fine Hair That Gets Weighed Down",
    guides: [
      "Why Fine Hair Gets Oily Fast",
      "How to Condition Fine Hair Without Losing Volume",
      "Hair Oil vs. Hair Serum for Fine Hair",
      "How to Get Lightweight Glass Hair",
    ],
  },
  {
    slug: "dense-glass-seeker",
    name: "The Dense Glass Seeker",
    tagline:
      "Thick, dense hair chasing a smooth glass finish without going flat.",
    traits: [
      "Medium-to-coarse strands",
      "High density",
      "Straight or a soft wave",
      "Reads frizzy, dull, or lacks shine",
    ],
    care: [
      "Surface smoothing and slip",
      "Friction reduction through the lengths",
      "Weekly conditioner or mask",
      "Heat protection and a finishing serum",
    ],
    lookFor: [
      "Film-formers and silicones",
      "Fatty alcohols",
      "Lightweight shine serums",
    ],
    useCarefully: ["Over-washing", "Repeated high-heat styling"],
    pillarGuide: "How to Care for Thick, Dense Hair That Looks Dry or Frizzy",
    guides: [
      "Korean Glass Hair for Thick Hair",
      "Hair Mask vs. Conditioner for Dense Hair",
      "How to Smooth Thick Hair Without Flattening It",
      "Why Thick Hair Can Still Be Damaged",
    ],
  },
  {
    slug: "oily-scalp-dry-ends",
    name: "The Oily Scalp, Dry Ends",
    tagline:
      "A scalp that needs regular cleansing and lengths that need targeted conditioning.",
    traits: [
      "Scalp oils up quickly",
      "Ends are dry or damaged",
      "Needs a split routine",
    ],
    care: [
      "Cleanse the scalp on its own schedule",
      "Condition and mask from the mid-lengths down",
      "Keep scalp and length routines separate",
      "Go easy on heavy products at the roots",
    ],
    lookFor: [
      "Cationic conditioners",
      "Humectants",
      "Lightweight emollients for ends",
    ],
    useCarefully: ["Root-level oils", "Masks applied to the scalp"],
    pillarGuide: "How to Care for an Oily Scalp and Dry Ends",
    guides: [
      "Should You Shampoo Your Ends?",
      "Where to Apply Conditioner and Hair Masks",
      "Can You Use Hair Oil with an Oily Scalp?",
      "How Often Should You Wash an Oily Scalp?",
    ],
  },
  {
    slug: "hidden-wave",
    name: "The Hidden Wave",
    tagline:
      "Reads as frizzy straight hair — but air-dries into an S-shaped wave.",
    traits: [
      "Looks straight when brushed",
      "Waves surface when damp or left alone",
      "Frizz-prone when dry",
    ],
    care: [
      "Enhance the wave instead of fighting it",
      "Minimize dry-brushing frizz",
      "Light leave-in with a soft hold",
      "Choose a glass-hair or natural-wave routine, not both",
    ],
    lookFor: ["Light gels", "Humectants", "Soft-hold leave-ins"],
    useCarefully: ["Dry brushing", "Heavy smoothing that flattens the wave"],
    pillarGuide: "You May Not Have Frizzy Straight Hair — You May Have Waves",
    guides: [
      "How to Test Your Natural Wave Pattern",
      "Why Brushing Makes Wavy Hair Frizzy",
      "Korean Hair Care for Wavy Hair",
      "Glass Hair vs. Natural Waves",
    ],
  },
  {
    slug: "moisture-seeking-curl",
    name: "The Moisture-Seeking Curl",
    tagline:
      "Defined waves, curls, or coils that thrive on moisture and gentle handling.",
    traits: [
      "Clear waves, curls, or coils",
      "Prone to dryness and breakage",
      "Curl definition is the goal",
    ],
    care: [
      "Layer in enough moisture",
      "Use a leave-in and a curl cream or gel",
      "Detangle gently, with less friction",
      "Minimize high-heat styling",
    ],
    lookFor: [
      "Rich humectants",
      "Curl creams and gels",
      "Leave-in conditioners",
    ],
    useCarefully: ["Aggressive detangling", "Frequent heat styling"],
    pillarGuide: "A Practical Hair-Care Guide for Curly and Coily Hair",
    guides: [
      "Moisture vs. Product Buildup",
      "How to Detangle with Less Breakage",
      "Choosing Leave-In Products",
      "Curly Hair Care in Korea",
    ],
  },
  {
    slug: "treated-fragile",
    name: "The Treated & Fragile",
    tagline:
      "Colored, bleached, permed, or straightened — condition comes before pattern.",
    traits: [
      "Recent chemical treatments",
      "Breakage, splitting, or brittleness",
      "Current state matters more than natural pattern",
    ],
    care: [
      "Weekly mask",
      "Leave-in and heat protection",
      "Reduce friction everywhere",
      "Balance protein with softening ingredients",
      "Space out further chemical services",
    ],
    lookFor: [
      "Hydrolyzed proteins, when needed",
      "Fatty alcohols",
      "Heat protectants",
    ],
    useCarefully: [
      "Frequent high heat",
      "Stacking chemical treatments too close together",
    ],
    pillarGuide:
      "How to Care for Bleached, Permed, or Chemically Straightened Hair",
    guides: [
      "Hair Mask vs. Conditioner",
      "Protein in Hair Care",
      "Heat Protection Explained",
      "How Korean Salon Treatments Work",
    ],
  },
];

export function getHairProfile(slug: string): HairProfile | undefined {
  return HAIR_PROFILES.find((p) => p.slug === slug);
}

export const HAIR_PROFILE_SLUGS = HAIR_PROFILES.map((p) => p.slug);
