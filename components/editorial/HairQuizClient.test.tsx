import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HairQuizClient } from "./HairQuizClient";
import { HAIR_QUIZ } from "@/lib/haircare/quiz";

vi.mock("@/lib/analytics/events", () => ({
  profileQuizStarted: vi.fn(),
  profileQuizStepViewed: vi.fn(),
  profileQuizStepCompleted: vi.fn(),
  profileQuizCompleted: vi.fn(),
}));

import {
  profileQuizStarted,
  profileQuizStepViewed,
  profileQuizCompleted,
} from "@/lib/analytics/events";

/** Answer every question with the option key given, then submit. */
function completeQuiz(answers: Record<string, string>) {
  for (const question of HAIR_QUIZ.questions) {
    const key = answers[question.key];
    const option = question.options.find((o) => o.key === key)!;
    const role = question.type === "multi_select" ? "checkbox" : "radio";
    fireEvent.click(screen.getByRole(role, { name: option.label }));
    const last =
      question.key === HAIR_QUIZ.questions[HAIR_QUIZ.questions.length - 1].key;
    fireEvent.click(
      screen.getByRole("button", { name: last ? "See my result" : "Next" })
    );
  }
}

const HIDDEN_WAVE: Record<string, string> = {
  natural_pattern: "loose_wave",
  strand_thickness: "fine",
  density: "low",
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

describe("HairQuizClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens on step 1 of 14 and reports the quiz start once", () => {
    render(<HairQuizClient />);
    expect(screen.getByText("Step 1 of 14")).toBeTruthy();
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

  it("scores a completed quiz into a profile result", () => {
    render(<HairQuizClient />);
    completeQuiz(HIDDEN_WAVE);
    expect(
      screen.getByRole("heading", { level: 1, name: "The Hidden Wave" })
    ).toBeTruthy();
    expect(screen.getByText("Loose wave")).toBeTruthy();
    expect(profileQuizCompleted).toHaveBeenCalledTimes(1);
    expect(profileQuizCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "hair", quizVersion: 1 })
    );
  });

  it("returns to step 1 on retake", () => {
    render(<HairQuizClient />);
    completeQuiz(HIDDEN_WAVE);
    fireEvent.click(screen.getByRole("button", { name: /retake/i }));
    expect(screen.getByText("Step 1 of 14")).toBeTruthy();
  });
});
