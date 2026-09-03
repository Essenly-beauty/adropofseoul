import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Prose } from "./Prose";

describe("Prose", () => {
  it("renders markdown headings and paragraphs", () => {
    render(<Prose markdown={"## A heading\n\nSome body text."} />);
    expect(screen.getByRole("heading", { name: "A heading" })).toBeTruthy();
    expect(screen.getByText("Some body text.")).toBeTruthy();
  });
  it("does not render embedded raw script tags as executable HTML", () => {
    const { container } = render(
      <Prose markdown={"Hi <script>window.x=1</script> there"} />
    );
    expect(container.querySelector("script")).toBeNull();
  });

  it("gives shopping picks, metadata and verdicts distinct hierarchy", () => {
    render(
      <Prose
        shoppingEdit
        markdown={
          "## 3. Boncept Ampoule\n\n**₩5,000 · Item No. 1061918**\n\n**ADoS VERDICT — TRY**"
        }
      />
    );
    expect(
      screen.getByRole("heading", { name: "3. Boncept Ampoule" })
    ).toBeTruthy();
    expect(screen.getByText("₩5,000 · Item No. 1061918")).toBeTruthy();
    expect(screen.getByText("ADoS verdict")).toBeTruthy();
    expect(screen.getByText("TRY")).toBeTruthy();
  });
});
