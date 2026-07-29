import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/app/actions/profile", () => ({
  saveQuizResponse: vi.fn(),
  completeQuizAttempt: vi.fn(),
  updateQuizProgress: vi.fn(),
}));
vi.mock("@/lib/analytics/events", () => ({
  profileQuizStepViewed: vi.fn(),
  profileQuizStepCompleted: vi.fn(),
  profileQuizCompleted: vi.fn(),
}));

import { QuizRunner } from "./QuizRunner";
import { PLACEHOLDER_HAIR_QUIZ } from "@/lib/profile/quiz-definition";
import * as actions from "@/app/actions/profile";
import * as events from "@/lib/analytics/events";

const ATTEMPT = "11111111-1111-4111-8111-111111111111";
const nextBtn = () => screen.getByRole("button", { name: "Next" });

function renderRunner() {
  return render(
    <QuizRunner
      definition={PLACEHOLDER_HAIR_QUIZ}
      attemptId={ATTEMPT}
      domain="hair"
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(actions.saveQuizResponse).mockResolvedValue({
    ok: true,
    questionKey: "wash_frequency",
    status: "in_progress",
  });
  vi.mocked(actions.completeQuizAttempt).mockResolvedValue({
    ok: true,
    resultId: "snap-1",
    status: "completed",
    firstCompletion: true,
    durationBucket: "1_3m",
  });
  vi.mocked(actions.updateQuizProgress).mockResolvedValue({
    ok: true,
    currentStep: 0,
  });
});

describe("QuizRunner wiring", () => {
  it("emits step_viewed with the domain + version context on mount", () => {
    renderRunner();
    expect(events.profileQuizStepViewed).toHaveBeenCalledWith({
      domain: "hair",
      quizVersion: 0,
      stepKey: "intro",
      stepIndex: 0,
    });
  });

  it("persists step position via updateQuizProgress as the user advances (resume-on-refresh)", async () => {
    renderRunner();
    // fires for the initial step on mount...
    await waitFor(() =>
      expect(actions.updateQuizProgress).toHaveBeenCalledWith(ATTEMPT, 0)
    );
    fireEvent.click(nextBtn());
    await screen.findByText("Step 2 of 5");
    // ...and again for the step advanced to
    await waitFor(() =>
      expect(actions.updateQuizProgress).toHaveBeenCalledWith(ATTEMPT, 1)
    );
  });

  it("autosaves an answer through saveQuizResponse and emits step_completed", async () => {
    renderRunner();
    fireEvent.click(nextBtn()); // intro (info) → no save
    await screen.findByText("Step 2 of 5");
    expect(actions.saveQuizResponse).not.toHaveBeenCalled();
    expect(events.profileQuizStepCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ stepKey: "intro", stepIndex: 0 })
    );

    fireEvent.click(screen.getByRole("radio", { name: "Every other day" }));
    fireEvent.click(nextBtn());
    await waitFor(() =>
      expect(actions.saveQuizResponse).toHaveBeenCalledWith(
        ATTEMPT,
        "wash_frequency",
        "alt"
      )
    );
    await screen.findByText("Step 3 of 5");
  });

  it("completes through completeQuizAttempt and emits completed only on firstCompletion", async () => {
    renderRunner();
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

    await waitFor(() =>
      expect(actions.completeQuizAttempt).toHaveBeenCalledWith(ATTEMPT)
    );
    expect(events.profileQuizCompleted).toHaveBeenCalledWith({
      domain: "hair",
      quizVersion: 0,
      durationBucket: "1_3m",
    });
    expect(await screen.findByText("Your answers are saved.")).toBeTruthy();
  });

  it("does NOT emit completed on an idempotent replay (firstCompletion=false)", async () => {
    vi.mocked(actions.completeQuizAttempt).mockResolvedValue({
      ok: true,
      resultId: "snap-1",
      status: "completed",
      firstCompletion: false,
      durationBucket: "1_3m",
    });
    renderRunner();
    // jump to last step quickly
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

    await waitFor(() => expect(actions.completeQuizAttempt).toHaveBeenCalled());
    expect(events.profileQuizCompleted).not.toHaveBeenCalled();
  });
});
