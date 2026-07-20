import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductForm } from "./ProductForm";
import type { AdminProduct } from "@/services/admin/products";

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    useFormState: (_action: unknown, initial: unknown) => [initial, vi.fn()],
  };
});

vi.mock("@/app/admin/products/actions", () => ({
  createProductAction: vi.fn(),
  updateProductAction: vi.fn(),
  deleteProductAction: vi.fn(),
}));

const product: AdminProduct = {
  id: "1",
  name: "Test Serum",
  brand: "Test Brand",
  slug: "test-serum",
  category: "serum",
  description: "A test serum",
  price: "$20",
  image: null,
  affiliateUrl: null,
  whereToBuy: null,
  bestFor: null,
  ingredients: null,
  rating: 4.5,
  disclosureRequired: false,
  isPublished: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("ProductForm", () => {
  it("renders core fields prefilled in edit mode with read-only slug", () => {
    render(<ProductForm mode="edit" product={product} />);
    expect((screen.getByLabelText(/^Name$/i) as HTMLInputElement).value).toBe(
      "Test Serum"
    );
    const slug = screen.getByLabelText(/Slug/i) as HTMLInputElement;
    expect(slug.value).toBe("test-serum");
    expect(slug.readOnly).toBe(true);
    // delete button shows only in edit mode
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
  });

  it("shows an editable slug and no delete button in create mode", () => {
    render(<ProductForm mode="create" />);
    const slug = screen.getByLabelText(/Slug/i) as HTMLInputElement;
    expect(slug.readOnly).toBe(false);
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });
});
