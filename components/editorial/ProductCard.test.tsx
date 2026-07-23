import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
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
  offers: [],
  tags: [],
  awardBadge: null,
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

  it("renders one link per active offer with retailer label", () => {
    render(
      <ProductCard
        product={{
          ...product,
          offers: [
            { retailer: "oliveyoung_global", url: "https://oy.example/g" },
            { retailer: "amazon_us", url: "https://amzn.example/x" },
          ],
        }}
      />
    );
    const oy = screen.getByRole("link", { name: /olive young/i });
    expect(oy).toHaveAttribute("href", "https://oy.example/g");
    expect(screen.getByRole("link", { name: /amazon/i })).toHaveAttribute(
      "href",
      "https://amzn.example/x"
    );
  });

  it("falls back to affiliateUrl single Shop link when no offers", () => {
    render(
      <ProductCard
        product={{
          ...product,
          offers: [],
          affiliateUrl: "https://old.example",
        }}
      />
    );
    expect(screen.getByRole("link", { name: /shop/i })).toHaveAttribute(
      "href",
      "https://old.example"
    );
  });

  it("shows at most 3 tags and the award badge", () => {
    render(
      <ProductCard
        product={{
          ...product,
          tags: ["Dry", "Hydration", "Soothing", "Extra"],
          awardBadge: "Olive Young Awards 2024",
        }}
      />
    );
    expect(screen.getByText("Dry · Hydration · Soothing")).toBeInTheDocument();
    expect(screen.queryByText(/Extra/)).not.toBeInTheDocument();
    expect(screen.getByText("Olive Young Awards 2024")).toBeInTheDocument();
  });

  it("never renders a rating number", () => {
    render(<ProductCard product={{ ...product, rating: 4.6 }} />);
    expect(screen.queryByText(/4\.6/)).not.toBeInTheDocument();
  });
});
