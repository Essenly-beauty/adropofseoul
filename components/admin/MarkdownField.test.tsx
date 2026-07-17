import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MarkdownField } from "./MarkdownField";

describe("MarkdownField", () => {
  it("renders a live preview of the markdown", () => {
    render(
      <MarkdownField name="body" label="Body" defaultValue={"## Hello"} />
    );
    expect(screen.getByRole("heading", { name: "Hello" })).toBeTruthy();
  });
  it("updates the preview as you type", () => {
    render(<MarkdownField name="body" label="Body" />);
    const ta = screen.getByLabelText("Body");
    fireEvent.change(ta, { target: { value: "## Fresh" } });
    expect(screen.getByRole("heading", { name: "Fresh" })).toBeTruthy();
  });
});
