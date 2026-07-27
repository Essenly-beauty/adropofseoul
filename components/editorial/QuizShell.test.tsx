import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizShell } from "./QuizShell";
import { PLACEHOLDER_HAIR_QUIZ } from "@/lib/profile/quiz-definition";

// Placeholder quiz shape: [info, single, multi, scale, single] → 5 steps.
function renderShell() {
  return render(<QuizShell definition={PLACEHOLDER_HAIR_QUIZ} />);
}

function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
}

describe("QuizShell", () => {
  it("opens on step 1 with the intro and a disabled Back button", () => {
    renderShell();
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
    expect(screen.getByText(/how the Hair Profile works/i)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Back" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("1");
    expect(bar.getAttribute("aria-valuemax")).toBe("5");
  });

  it("advances past the optional info step without an answer", () => {
    renderShell();
    clickNext();
    expect(screen.getByText("Step 2 of 5")).toBeTruthy();
    expect(screen.getByText("How often do you wash your hair?")).toBeTruthy();
  });

  it("blocks advancing past a required question and announces an error", () => {
    renderShell();
    clickNext(); // to step 2 (required single_select)
    clickNext(); // try to skip without answering
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Step 2 of 5")).toBeTruthy(); // did not advance
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    expect(screen.queryByRole("alert")).toBe(null); // clears on answer
    clickNext();
    expect(screen.getByText("Step 3 of 5")).toBeTruthy();
  });

  it("uses a multi-select-specific message and requires at least one", () => {
    renderShell();
    clickNext();
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    clickNext(); // → step 3 (required multi_select)
    clickNext(); // try to skip
    expect(screen.getByText("Please choose at least one option.")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Frizz" }));
    clickNext();
    expect(screen.getByText("Step 4 of 5")).toBeTruthy();
  });

  it("preserves earlier answers when navigating Back", () => {
    renderShell();
    clickNext();
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    clickNext(); // → step 3
    fireEvent.click(screen.getByRole("button", { name: "Back" })); // → step 2
    expect(
      (
        screen.getByRole("radio", {
          name: "Every other day",
        }) as HTMLInputElement
      ).checked
    ).toBe(true);
  });

  it("labels the final step's action and reaches the preview state", () => {
    renderShell();
    clickNext(); // step 2
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    clickNext(); // step 3
    fireEvent.click(screen.getByRole("checkbox", { name: "Frizz" }));
    clickNext(); // step 4 (scale)
    fireEvent.click(screen.getByRole("radio", { name: "2" }));
    clickNext(); // step 5 (final single_select)
    expect(screen.getByText("Step 5 of 5")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Next" })).toBe(null);
    fireEvent.click(screen.getByRole("radio", { name: "More volume" }));
    fireEvent.click(screen.getByRole("button", { name: "See preview" }));
    expect(screen.getByText("That's the preview.")).toBeTruthy();
  });

  it("can start over from the preview state", () => {
    renderShell();
    // fast-forward to the end
    clickNext();
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    clickNext();
    fireEvent.click(screen.getByRole("checkbox", { name: "Frizz" }));
    clickNext();
    fireEvent.click(screen.getByRole("radio", { name: "2" }));
    clickNext();
    fireEvent.click(screen.getByRole("radio", { name: "More volume" }));
    fireEvent.click(screen.getByRole("button", { name: "See preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByText("Step 1 of 5")).toBeTruthy();
  });
});
