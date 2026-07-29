import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

// ---------------------------------------------------------------------------
// Server-backed mode (M2b-2b): autosave, resume, server completion, analytics.
// ---------------------------------------------------------------------------
const okSave = () => vi.fn().mockResolvedValue({ ok: true });
const nextBtn = () => screen.getByRole("button", { name: "Next" });

describe("QuizShell (server-backed)", () => {
  it("does not autosave an info step, but autosaves an answered question before advancing", async () => {
    const onSaveResponse = okSave();
    render(
      <QuizShell
        definition={PLACEHOLDER_HAIR_QUIZ}
        onSaveResponse={onSaveResponse}
        onComplete={vi.fn().mockResolvedValue({ ok: true })}
      />
    );
    fireEvent.click(nextBtn()); // intro (info) → no save
    expect(await screen.findByText("Step 2 of 5")).toBeTruthy();
    expect(onSaveResponse).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    fireEvent.click(nextBtn());
    await waitFor(() =>
      expect(onSaveResponse).toHaveBeenCalledWith("wash_frequency", "alt")
    );
    expect(await screen.findByText("Step 3 of 5")).toBeTruthy();
  });

  it("blocks advancing and shows a mapped error when a save fails", async () => {
    const onSaveResponse = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "ATTEMPT_EXPIRED" });
    render(
      <QuizShell
        definition={PLACEHOLDER_HAIR_QUIZ}
        onSaveResponse={onSaveResponse}
        onComplete={vi.fn()}
      />
    );
    fireEvent.click(nextBtn());
    await screen.findByText("Step 2 of 5");
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    fireEvent.click(nextBtn());
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/expired/i)).toBeTruthy();
    expect(screen.getByText("Step 2 of 5")).toBeTruthy(); // did not advance
  });

  it("completes via onComplete on the last step and shows the server done state", async () => {
    const onComplete = vi.fn().mockResolvedValue({ ok: true });
    render(
      <QuizShell
        definition={PLACEHOLDER_HAIR_QUIZ}
        onSaveResponse={okSave()}
        onComplete={onComplete}
      />
    );
    fireEvent.click(nextBtn());
    await screen.findByText("Step 2 of 5");
    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    fireEvent.click(nextBtn());
    await screen.findByText("Step 3 of 5");
    fireEvent.click(screen.getByRole("checkbox", { name: "Frizz" }));
    fireEvent.click(nextBtn());
    await screen.findByText("Step 4 of 5");
    fireEvent.click(screen.getByRole("radio", { name: "2" }));
    fireEvent.click(nextBtn());
    await screen.findByText("Step 5 of 5");
    fireEvent.click(screen.getByRole("radio", { name: "More volume" }));
    fireEvent.click(screen.getByRole("button", { name: "See my result" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Your answers are saved.")).toBeTruthy();
  });

  it("resumes from server state: seeds the answer, fires resumed + initial step_viewed", () => {
    const onResumed = vi.fn();
    const onStepView = vi.fn();
    render(
      <QuizShell
        definition={PLACEHOLDER_HAIR_QUIZ}
        onComplete={vi.fn()}
        initialResponses={{ wash_frequency: "alt" }}
        initialStep={1}
        onResumed={onResumed}
        onStepView={onStepView}
      />
    );
    expect(screen.getByText("Step 2 of 5")).toBeTruthy();
    expect(
      (
        screen.getByRole("radio", {
          name: "Every other day",
        }) as HTMLInputElement
      ).checked
    ).toBe(true);
    expect(onResumed).toHaveBeenCalledTimes(1);
    expect(onStepView).toHaveBeenCalledWith("wash_frequency", 1);
  });

  it("fires step_viewed on advance and step_completed after a successful save", async () => {
    const onStepView = vi.fn();
    const onStepCompleted = vi.fn();
    render(
      <QuizShell
        definition={PLACEHOLDER_HAIR_QUIZ}
        onSaveResponse={okSave()}
        onComplete={vi.fn()}
        onStepView={onStepView}
        onStepCompleted={onStepCompleted}
      />
    );
    expect(onStepView).toHaveBeenCalledWith("intro", 0);
    fireEvent.click(nextBtn());
    await screen.findByText("Step 2 of 5");
    expect(onStepCompleted).toHaveBeenCalledWith("intro", 0, 0);
    expect(onStepView).toHaveBeenCalledWith("wash_frequency", 1);
  });

  it("does not fire resumed for a fresh start (no initial responses)", () => {
    const onResumed = vi.fn();
    render(
      <QuizShell
        definition={PLACEHOLDER_HAIR_QUIZ}
        onComplete={vi.fn()}
        onResumed={onResumed}
      />
    );
    expect(onResumed).not.toHaveBeenCalled();
  });
});
