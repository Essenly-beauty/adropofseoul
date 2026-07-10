import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TagChips } from "./TagChips";

describe("TagChips", () => {
  it("renders a chip per item", () => {
    render(<TagChips items={["Oily", "Acne-Prone"]} />);
    expect(screen.getByText("Oily")).toBeTruthy();
    expect(screen.getByText("Acne-Prone")).toBeTruthy();
  });
  it("renders nothing when empty", () => {
    const { container } = render(<TagChips items={[]} />);
    expect(container.querySelector("span,ul")).toBe(null);
  });
});
