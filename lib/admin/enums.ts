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

// Booking-readiness enums (migration 0005). editorial_status tracks DATA
// verification only — partnership lives in partnership_status.
export const BOOKING_CHANNELS: { value: string; label: string }[] = [
  { value: "naver", label: "Naver Booking" },
  { value: "online", label: "Own website / online" },
  { value: "phone", label: "Phone" },
  { value: "instagram", label: "Instagram DM" },
  { value: "walk_in", label: "Walk-in" },
];

export const EDITORIAL_STATUSES: { value: string; label: string }[] = [
  { value: "sample", label: "Sample (data unverified)" },
  { value: "verified", label: "Verified" },
];

export const POST_CATEGORY_VALUES = POST_CATEGORIES.map((c) => c.value);
export const PLACE_CATEGORY_VALUES = PLACE_CATEGORIES.map((c) => c.value);
export const BOOKING_CHANNEL_VALUES = BOOKING_CHANNELS.map((c) => c.value);
export const EDITORIAL_STATUS_VALUES = EDITORIAL_STATUSES.map((c) => c.value);
