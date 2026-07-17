import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagsField } from "./TagsField";

describe("TagsField", () => {
  it("seeds chips from defaultValue and serializes to a hidden input", () => {
    const { container } = render(
      <TagsField name="tags" label="Tags" defaultValue={["k-beauty"]} />
    );
    expect(screen.getByText("k-beauty")).toBeTruthy();
    const hidden = container.querySelector('input[type="hidden"][name="tags"]');
    expect((hidden as HTMLInputElement).value).toBe("k-beauty");
  });
  it("adds a chip on Enter and updates the hidden value", () => {
    const { container } = render(<TagsField name="tags" label="Tags" />);
    const input = screen.getByLabelText("Tags") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "serum" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("serum")).toBeTruthy();
    const hidden = container.querySelector('input[type="hidden"][name="tags"]');
    expect((hidden as HTMLInputElement).value).toBe("serum");
  });
});
