import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteButton } from "./DeleteButton";

async function noop() {
  "use server";
}

describe("DeleteButton", () => {
  it("hides the confirm control until Delete is clicked", () => {
    render(<DeleteButton action={noop} />);
    expect(
      screen.queryByRole("button", { name: /confirm delete/i })
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(
      screen.getByRole("button", { name: /confirm delete/i })
    ).toBeTruthy();
  });
  it("Cancel returns to the idle state", () => {
    render(<DeleteButton action={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("button", { name: /confirm delete/i })
    ).toBeNull();
  });
});
