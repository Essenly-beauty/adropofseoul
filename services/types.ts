export type Post = {
  id: string;
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
  publishedAt: string | null;
};

export type Place = {
  id: string;
  name: string;
  slug: string;
  category: string;
  area: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  whyWeLikeIt: string | null;
  bestFor: string | null;
  priceRange: string | null;
  instagramUrl: string | null;
  naverMapUrl: string | null;
  googleMapUrl: string | null;
  bookingUrl: string | null;
  languages: string[];
  images: string[];
};

export type Ingredient = {
  id: string;
  slug: string;
  name: string;
  inciName: string | null;
  alsoKnownAs: string[];
  functions: string[];
  summary: string | null;
  description: string | null;
  benefits: string | null;
  goodForSkinTypes: string[];
  targetsConcerns: string[];
  caution: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
};

export type Product = {
  id: string;
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
};
