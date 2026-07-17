// Option lists mirroring the DB enums (migration 0001).
export const POST_CATEGORIES: { value: string; label: string }[] = [
  { value: "beauty", label: "Beauty" },
  { value: "hair", label: "Hair" },
  { value: "head_spa", label: "Head Spa" },
  { value: "places", label: "Places" },
  { value: "wellness", label: "Wellness" },
  { value: "products", label: "Products" },
  { value: "guides", label: "Guides" },
];

export const PLACE_CATEGORIES: { value: string; label: string }[] = [
  { value: "head_spa", label: "Head Spa" },
  { value: "salon", label: "Salon" },
  { value: "cafe", label: "Cafe" },
  { value: "clinic", label: "Clinic" },
  { value: "shop", label: "Shop" },
  { value: "wellness", label: "Wellness" },
];

export const POST_CATEGORY_VALUES = POST_CATEGORIES.map((c) => c.value);
export const PLACE_CATEGORY_VALUES = PLACE_CATEGORIES.map((c) => c.value);
