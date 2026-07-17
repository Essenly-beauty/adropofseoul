import { describe, it, expect } from "vitest";
import { validatePost, validatePlace, validateProduct } from "./validate";

const basePost = {
  title: "Hello",
  slug: "hello",
  subtitle: null,
  excerpt: null,
  body: null,
  category: "beauty",
  tags: [],
  featuredImage: null,
  author: null,
  seoTitle: null,
  metaDescription: null,
  status: "draft",
  publishedAt: null,
};

describe("validatePost", () => {
  it("passes a valid post", () => {
    expect(validatePost(basePost)).toEqual({});
  });
  it("requires title, slug, and a known category", () => {
    const e = validatePost({
      ...basePost,
      title: "  ",
      slug: "",
      category: "nope",
    });
    expect(e.title).toBeTruthy();
    expect(e.slug).toBeTruthy();
    expect(e.category).toBeTruthy();
  });
  it("rejects a malformed slug", () => {
    expect(validatePost({ ...basePost, slug: "Has Spaces" }).slug).toBeTruthy();
  });
  it("rejects a non-URL featured image", () => {
    expect(
      validatePost({ ...basePost, featuredImage: "not-a-url" }).featuredImage
    ).toBeTruthy();
  });
  it("rejects an unknown status", () => {
    expect(validatePost({ ...basePost, status: "weird" }).status).toBeTruthy();
  });
});

const basePlace = {
  name: "Sool Loft",
  slug: "sool-loft",
  category: "head_spa",
  area: null,
  address: null,
  shortDescription: null,
  longDescription: null,
  whyWeLikeIt: null,
  bestFor: null,
  priceRange: null,
  instagramUrl: null,
  naverMapUrl: null,
  googleMapUrl: null,
  bookingUrl: null,
  contactEmail: null,
  contactPhone: null,
  languages: [],
  isPublished: false,
  notes: null,
};

describe("validatePlace", () => {
  it("passes a valid place", () => {
    expect(validatePlace(basePlace)).toEqual({});
  });
  it("requires name, slug, known category", () => {
    const e = validatePlace({ ...basePlace, name: "", category: "nope" });
    expect(e.name).toBeTruthy();
    expect(e.category).toBeTruthy();
  });
  it("rejects a bad map URL and a bad contact email", () => {
    const e = validatePlace({
      ...basePlace,
      googleMapUrl: "x",
      contactEmail: "y",
    });
    expect(e.googleMapUrl).toBeTruthy();
    expect(e.contactEmail).toBeTruthy();
  });
});

const baseProduct = {
  name: "Rice Toner",
  brand: null,
  slug: "rice-toner",
  category: null,
  description: null,
  price: null,
  image: null,
  affiliateUrl: null,
  whereToBuy: null,
  bestFor: null,
  ingredients: null,
  rating: null,
  disclosureRequired: false,
  isPublished: false,
};

describe("validateProduct", () => {
  it("passes a valid product", () => {
    expect(validateProduct(baseProduct)).toEqual({});
  });
  it("requires name and slug", () => {
    const e = validateProduct({ ...baseProduct, name: "", slug: "" });
    expect(e.name).toBeTruthy();
    expect(e.slug).toBeTruthy();
  });
  it("rejects a rating outside 0–5 and a bad affiliate URL", () => {
    const e = validateProduct({
      ...baseProduct,
      rating: 9,
      affiliateUrl: "nope",
    });
    expect(e.rating).toBeTruthy();
    expect(e.affiliateUrl).toBeTruthy();
  });
  it("rejects a NaN rating (non-numeric form input)", () => {
    expect(
      validateProduct({ ...baseProduct, rating: NaN }).rating
    ).toBeTruthy();
  });
});
