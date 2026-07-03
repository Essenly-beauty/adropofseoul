import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/services/types";

const product = {
  id: "1",
  name: "Rice Toner",
  brand: "Beauty of Joseon",
  slug: "boj-rice-toner",
  category: "toner",
  description: "A milky, brightening toner.",
  price: "$17",
  image: null,
  affiliateUrl: "https://example.com/buy",
  whereToBuy: null,
  bestFor: "dull skin",
  ingredients: null,
  rating: null,
  disclosureRequired: true,
} as Product;

describe("ProductCard", () => {
  it("shows brand, name, price, and an affiliate shop link", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText("Beauty of Joseon")).toBeTruthy();
    expect(screen.getByText("Rice Toner")).toBeTruthy();
    expect(screen.getByText("$17")).toBeTruthy();
    const shop = screen.getByRole("link", { name: /Shop/ });
    expect(shop.getAttribute("href")).toBe("https://example.com/buy");
  });
  it("shows the affiliate disclosure when required", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText(/affiliate links/i)).toBeTruthy();
  });
});
