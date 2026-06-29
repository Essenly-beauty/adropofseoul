import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/services/types";

const base = {
  id: "1",
  name: "Rice Toner",
  brand: "Beauty of Joseon",
  slug: "boj-rice-toner",
  category: "toner",
  description: "A milky toner.",
  price: "$17",
  image: null,
  affiliateUrl: null,
  whereToBuy: null,
  bestFor: null,
  ingredients: null,
  rating: null,
  disclosureRequired: false,
} as Product;

describe("ProductCard", () => {
  it("shows brand, name, and price", () => {
    render(<ProductCard product={base} />);
    expect(screen.getByText("Beauty of Joseon")).toBeTruthy();
    expect(screen.getByText("Rice Toner")).toBeTruthy();
    expect(screen.getByText("$17")).toBeTruthy();
  });
  it("shows a disclosure note only when disclosureRequired", () => {
    const { rerender } = render(<ProductCard product={base} />);
    expect(screen.queryByText(/affiliate/i)).toBeNull();
    rerender(<ProductCard product={{ ...base, disclosureRequired: true }} />);
    expect(screen.getByText(/affiliate/i)).toBeTruthy();
  });
  it("renders an outbound buy link only when affiliateUrl is present", () => {
    const { rerender } = render(<ProductCard product={base} />);
    expect(screen.queryByRole("link", { name: /shop/i })).toBeNull();
    rerender(
      <ProductCard product={{ ...base, affiliateUrl: "https://x.example/p" }} />
    );
    const link = screen.getByRole("link", { name: /shop/i });
    expect(link.getAttribute("href")).toBe("https://x.example/p");
    expect(link.getAttribute("rel")).toContain("nofollow");
  });
});
