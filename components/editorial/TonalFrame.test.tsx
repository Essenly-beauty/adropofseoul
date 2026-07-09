import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TonalFrame } from "./TonalFrame";

describe("TonalFrame", () => {
  it("renders a placeholder label when no src is given", () => {
    render(<TonalFrame alt="Head spa" label="Seongsu" />);
    expect(screen.getByText("Seongsu")).toBeTruthy();
    expect(screen.queryByRole("img")).toBe(null);
  });
  it("renders an image with alt text when src is given", () => {
    render(
      <TonalFrame src="/x.jpg" alt="Head spa" sizes="100vw" label="Seongsu" />
    );
    expect(screen.getByAltText("Head spa")).toBeTruthy();
    expect(screen.queryByText("Seongsu")).toBe(null);
  });
  it("applies the brand tint only when branded", () => {
    const plain = render(<TonalFrame src="/x.jpg" alt="Serum" sizes="25vw" />);
    expect(plain.container.querySelector("[data-brand-tint]")).toBe(null);
    expect(
      (plain.getByAltText("Serum").getAttribute("style") || "").includes(
        "sepia"
      )
    ).toBe(false);

    const branded = render(
      <TonalFrame src="/y.jpg" alt="Head spa" sizes="55vw" branded />
    );
    expect(branded.container.querySelector("[data-brand-tint]")).toBeTruthy();
    expect(
      (branded.getByAltText("Head spa").getAttribute("style") || "").includes(
        "sepia"
      )
    ).toBe(true);
  });
});
