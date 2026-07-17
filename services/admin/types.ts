export type PostInput = {
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string;
  tags: string[];
  featuredImage: string | null;
  author: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  status: string;
  publishedAt: string | null;
};

export type PlaceInput = {
  name: string;
  nameKr: string | null;
  slug: string;
  category: string;
  area: string | null;
  address: string | null;
  geoLat: number | null;
  geoLng: number | null;
  priceMinKrw: number | null;
  priceMaxKrw: number | null;
  bookingChannel: string | null;
  depositPolicy: string | null;
  editorialStatus: string;
  lastVerifiedAt: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  whyWeLikeIt: string | null;
  bestFor: string | null;
  priceRange: string | null;
  instagramUrl: string | null;
  naverMapUrl: string | null;
  googleMapUrl: string | null;
  bookingUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  languages: string[];
  isPublished: boolean;
  notes: string | null;
};

export type ProductInput = {
  name: string;
  brand: string | null;
  slug: string;
  category: string | null;
  description: string | null;
  price: string | null;
  image: string | null;
  affiliateUrl: string | null;
  whereToBuy: string | null;
  bestFor: string | null;
  ingredients: string | null;
  rating: number | null;
  disclosureRequired: boolean;
  isPublished: boolean;
};

export type AdminPost = PostInput & { id: string; updatedAt: string };
export type AdminPlace = PlaceInput & { id: string; updatedAt: string };
export type AdminProduct = ProductInput & { id: string; updatedAt: string };

export type WriteResult =
  | { ok: true; id?: string }
  | { ok: false; code: string | null; message: string };

export type Counts = { total: number; live: number; hidden: number };
