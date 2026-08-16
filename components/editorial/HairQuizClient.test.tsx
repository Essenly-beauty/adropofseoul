import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { HairQuizClient } from "./HairQuizClient";
import { HAIR_QUIZ } from "@/lib/haircare/quiz";

vi.mock("@/lib/analytics/events", () => ({
  profileQuizStarted: vi.fn(),
  profileQuizStepViewed: vi.fn(),
  profileQuizStepCompleted: vi.fn(),
  profileQuizResumed: vi.fn(),
  profileQuizCompleted: vi.fn(),
}));

vi.mock("@/app/actions/profile", () => ({
  startQuizAttempt: vi.fn(),
  saveQuizResponse: vi.fn(),
  completeQuizAttempt: vi.fn(),
}));

const pushed: string[] = [];
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (href: string) => pushed.push(href) }),
}));

import {
  profileQuizStarted,
  profileQuizStepViewed,
  profileQuizCompleted,
} from "@/lib/analytics/events";
import {
  startQuizAttempt,
  saveQuizResponse,
  completeQuizAttempt,
} from "@/app/actions/profile";

const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";
const RESULT_ID = "22222222-2222-4222-8222-222222222222";

/** Persistence available: an attempt is created and completion succeeds. */
function arrangePersistenceUp() {
  vi.mocked(startQuizAttempt).mockResolvedValue({
    ok: true,
    attemptId: ATTEMPT_ID,
    quizVersion: 1,
    status: "in_progress",
    created: true,
  });
  vi.mocked(saveQuizResponse).mockResolvedValue({
    ok: true,
    questionKey: "natural_pattern",
    status: "saved",
  });
  vi.mocked(completeQuizAttempt).mockResolvedValue({
    ok: true,
    resultId: RESULT_ID,
    status: "completed",
    firstCompletion: true,
    durationBucket: "under_1m",
  });
}

/** Persistence unavailable: the flag is off, so no attempt is ever created. */
function arrangePersistenceDown() {
  vi.mocked(startQuizAttempt).mockResolvedValue({
    ok: false,
    error: "FEATURE_DISABLED",
  });
}

/**
 * Answer every question with the option key given, then submit. Advancing is
 * async now (QuizShell awaits the autosave hook), so each step is flushed.
 */
async function answerSteps(
  answers: Record<string, string>,
  from = 0,
  to = HAIR_QUIZ.questions.length
) {
  for (const question of HAIR_QUIZ.questions.slice(from, to)) {
    const key = answers[question.key];
    const option = question.options.find((o) => o.key === key)!;
    const role = question.type === "multi_select" ? "checkbox" : "radio";
    fireEvent.click(screen.getByRole(role, { name: option.label }));
    const last =
      question.key === HAIR_QUIZ.questions[HAIR_QUIZ.questions.length - 1].key;
    const label = last ? "See my result" : "Next";
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: label }));
    });
  }
}

const completeQuiz = (answers: Record<string, string>) => answerSteps(answers);

const HIDDEN_WAVE: Record<string, string> = {
  natural_pattern: "loose_wave",
  strand_thickness: "fine",
  density: "low",
  hair_length: "shoulder_collarbone",
  environment: "none",
  scalp_oiliness_onset: "two_plus_days",
  scalp_concerns: "none",
  wash_frequency: "every_other_day",
  product_response: "varies",
  dry_time: "average",
  humidity_response: "waves_appear",
  chemical_history: "none",
  heat_frequency: "rarely",
  ends_condition: "smooth",
  primary_concern: "curl_definition",
  desired_result: "defined_texture",
};

// The client-only path: persistence is unavailable, so the quiz behaves exactly
// as it did before it could persist anything.
describe("HairQuizClient without persistence", () => {
  beforeEach(() => {
    pushed.length = 0;
    vi.clearAllMocks();
    arrangePersistenceDown();
  });

  it("opens on step 1 of 16 and reports the quiz start once", () => {
    render(<HairQuizClient />);
    expect(screen.getByText("Step 1 of 16")).toBeTruthy();
    expect(profileQuizStarted).toHaveBeenCalledTimes(1);
    expect(profileQuizStarted).toHaveBeenCalledWith({
      domain: "hair",
      quizVersion: 1,
      entrySource: "hair_quiz_page",
    });
  });

  it("reports steps by key, never by answer", () => {
    render(<HairQuizClient />);
    expect(profileQuizStepViewed).toHaveBeenCalledWith({
      domain: "hair",
      quizVersion: 1,
      stepKey: "natural_pattern",
      stepIndex: 0,
    });
  });

  it("scores a completed quiz into a profile result", async () => {
    render(<HairQuizClient />);
    await completeQuiz(HIDDEN_WAVE);
    expect(
      screen.getByRole("heading", { level: 1, name: "The Hidden Wave" })
    ).toBeTruthy();
    expect(screen.getByText("Loose wave")).toBeTruthy();
    expect(profileQuizCompleted).toHaveBeenCalledTimes(1);
    expect(profileQuizCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "hair", quizVersion: 1 })
    );
  });

  it("returns to step 1 on retake", async () => {
    render(<HairQuizClient />);
    await completeQuiz(HIDDEN_WAVE);
    fireEvent.click(screen.getByRole("button", { name: /retake/i }));
    expect(screen.getByText("Step 1 of 16")).toBeTruthy();
  });

  it("never navigates and never tries to save", async () => {
    render(<HairQuizClient />);
    await act(async () => {});
    await completeQuiz(HIDDEN_WAVE);
    expect(
      screen.getByRole("heading", { level: 1, name: "The Hidden Wave" })
    ).toBeTruthy();
    expect(pushed).toEqual([]);
    expect(saveQuizResponse).not.toHaveBeenCalled();
    expect(completeQuizAttempt).not.toHaveBeenCalled();
  });
});

// The persisted path: an attempt lands, answers are saved, and completion hands
// off to the durable result URL.
describe("HairQuizClient with persistence", () => {
  beforeEach(() => {
    pushed.length = 0;
    vi.clearAllMocks();
    arrangePersistenceUp();
  });

  it("renders the first question without waiting for the attempt", () => {
    render(<HairQuizClient />);
    // Rendered synchronously — the bootstrap has not resolved yet.
    expect(screen.getByText("Step 1 of 16")).toBeTruthy();
  });

  it("saves each answer against the attempt as the user advances", async () => {
    render(<HairQuizClient />);
    await act(async () => {});
    await completeQuiz(HIDDEN_WAVE);
    await waitFor(() => expect(saveQuizResponse).toHaveBeenCalled());
    expect(saveQuizResponse).toHaveBeenCalledWith(
      ATTEMPT_ID,
      "natural_pattern",
      "loose_wave"
    );
  });

  it("completes server-side and redirects to the durable result", async () => {
    render(<HairQuizClient />);
    await act(async () => {});
    await completeQuiz(HIDDEN_WAVE);
    await waitFor(() => expect(completeQuizAttempt).toHaveBeenCalled());
    expect(completeQuizAttempt).toHaveBeenCalledWith(ATTEMPT_ID);
    await waitFor(() =>
      expect(pushed).toContain(`/beauty-profile/hair/result/${RESULT_ID}`)
    );
    // The in-page result is not rendered when the durable one takes over.
    expect(
      screen.queryByRole("heading", { level: 1, name: "The Hidden Wave" })
    ).toBe(null);
  });

  it("flushes the answers whose autosave was skipped before the attempt landed", async () => {
    // The attempt lands mid-quiz, so the first steps advanced with nothing to
    // save. Completion must catch them up or the server rejects the whole
    // attempt with MISSING_REQUIRED_RESPONSE.
    let release: (() => void) | undefined;
    vi.mocked(startQuizAttempt).mockReturnValue(
      new Promise((resolve) => {
        release = () =>
          resolve({
            ok: true,
            attemptId: ATTEMPT_ID,
            quizVersion: 1,
            status: "in_progress",
            created: true,
          });
      })
    );
    render(<HairQuizClient />);

    await answerSteps(HIDDEN_WAVE, 0, 3); // three steps, no attempt yet
    expect(saveQuizResponse).not.toHaveBeenCalled();

    await act(async () => {
      release?.();
    });
    await answerSteps(HIDDEN_WAVE, 3); // the rest autosave normally
    await waitFor(() => expect(completeQuizAttempt).toHaveBeenCalled());

    // 13 autosaved + the 3 skipped ones flushed at completion = every answer.
    const saved = vi
      .mocked(saveQuizResponse)
      .mock.calls.map(([, key]) => key as string);
    expect(new Set(saved).size).toBe(16);
    for (const q of HAIR_QUIZ.questions) expect(saved).toContain(q.key);
  });

  it("falls back to the in-page result when completion fails", async () => {
    vi.mocked(completeQuizAttempt).mockResolvedValue({
      ok: false,
      error: "INTERNAL_ERROR",
    });
    render(<HairQuizClient />);
    await act(async () => {});
    await completeQuiz(HIDDEN_WAVE);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "The Hidden Wave" })
      ).toBeTruthy()
    );
    expect(pushed).toEqual([]);
  });

  it("reports the completion once, from the server's duration bucket", async () => {
    render(<HairQuizClient />);
    await act(async () => {});
    await completeQuiz(HIDDEN_WAVE);
    await waitFor(() => expect(profileQuizCompleted).toHaveBeenCalledTimes(1));
    expect(profileQuizCompleted).toHaveBeenCalledWith({
      domain: "hair",
      quizVersion: 1,
      durationBucket: "under_1m",
    });
  });
});
