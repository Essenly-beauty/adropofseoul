import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Eyebrow } from "./Eyebrow";

describe("Eyebrow", () => {
  it("renders label text with uppercase tracking", () => {
    render(<Eyebrow>This Week</Eyebrow>);
    const el = screen.getByText("This Week");
    expect(el.className.includes("uppercase")).toBe(true);
    expect(el.className.includes("tracking-label")).toBe(true);
  });
  it("uses muted tone when requested", () => {
    render(<Eyebrow tone="muted">7 min read</Eyebrow>);
    expect(
      screen.getByText("7 min read").className.includes("text-text-muted")
    ).toBe(true);
  });
});
