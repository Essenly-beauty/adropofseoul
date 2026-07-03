import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "./Reveal";

describe("Reveal", () => {
  it("renders its children (visible fallback without IntersectionObserver)", () => {
    render(
      <Reveal>
        <p>Featured Story</p>
      </Reveal>
    );
    expect(screen.getByText("Featured Story")).toBeTruthy();
  });
});
