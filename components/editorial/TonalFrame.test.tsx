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
});
