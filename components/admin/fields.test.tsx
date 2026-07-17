import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";
import { StatusField } from "./StatusField";
import { FormError } from "./FormError";
import { SlugField } from "./SlugField";

describe("primitives", () => {
  it("TextField renders a labelled input and an error", () => {
    render(<TextField name="title" label="Title" error="Required." required />);
    expect(screen.getByLabelText(/Title/)).toBeTruthy();
    expect(screen.getByText("Required.")).toBeTruthy();
  });
  it("SelectField renders its options", () => {
    render(
      <SelectField
        name="category"
        label="Category"
        options={[{ value: "beauty", label: "Beauty" }]}
      />
    );
    expect(screen.getByRole("option", { name: "Beauty" })).toBeTruthy();
  });
  it("StatusField defaults to draft and offers published", () => {
    render(<StatusField />);
    expect(screen.getByRole("option", { name: "Published" })).toBeTruthy();
  });
  it("FormError renders nothing without a message", () => {
    const { container } = render(<FormError />);
    expect(container.firstChild).toBeNull();
  });
  it("SlugField generates a slug from the source input", () => {
    render(
      <>
        <input id="title" defaultValue="Hello World!" readOnly />
        <SlugField sourceId="title" />
      </>
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect((screen.getByLabelText(/Slug/) as HTMLInputElement).value).toBe(
      "hello-world"
    );
  });
});
