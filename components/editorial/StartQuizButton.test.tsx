import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/app/actions/profile", () => ({ startQuizAttempt: vi.fn() }));
vi.mock("@/lib/analytics/events", () => ({
  profileQuizStarted: vi.fn(),
  profileQuizResumed: vi.fn(),
}));

import { StartQuizButton } from "./StartQuizButton";
import * as actions from "@/app/actions/profile";
import * as events from "@/lib/analytics/events";

const ATTEMPT = "22222222-2222-4222-8222-222222222222";

beforeEach(() => vi.clearAllMocks());

describe("StartQuizButton", () => {
  it("starts a NEW attempt: emits started and routes to the attempt", async () => {
    vi.mocked(actions.startQuizAttempt).mockResolvedValue({
      ok: true,
      attemptId: ATTEMPT,
      quizVersion: 0,
      status: "in_progress",
      created: true,
    });
    render(<StartQuizButton domain="hair" />);
    fireEvent.click(screen.getByRole("button", { name: "Start the quiz" }));

    await waitFor(() =>
      expect(actions.startQuizAttempt).toHaveBeenCalledTimes(1)
    );
    const [domain, source] = vi.mocked(actions.startQuizAttempt).mock.calls[0];
    expect(domain).toBe("hair");
    expect(source).toBe("hair_landing");
    expect(events.profileQuizStarted).toHaveBeenCalledWith({
      domain: "hair",
      quizVersion: 0,
      entrySource: "hair_landing",
    });
    expect(events.profileQuizResumed).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/beauty-profile/hair/quiz/${ATTEMPT}`)
    );
  });

  it("resumes an existing attempt: emits resumed with the bucket", async () => {
    vi.mocked(actions.startQuizAttempt).mockResolvedValue({
      ok: true,
      attemptId: ATTEMPT,
      quizVersion: 0,
      status: "in_progress",
      created: false,
      resumeAgeBucket: "1_24h",
    });
    render(<StartQuizButton domain="hair" />);
    fireEvent.click(screen.getByRole("button", { name: "Start the quiz" }));

    await waitFor(() =>
      expect(events.profileQuizResumed).toHaveBeenCalledWith({
        domain: "hair",
        quizVersion: 0,
        resumeAgeBucket: "1_24h",
      })
    );
    expect(events.profileQuizStarted).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(`/beauty-profile/hair/quiz/${ATTEMPT}`);
  });

  it("shows an error and does not navigate when start fails", async () => {
    vi.mocked(actions.startQuizAttempt).mockResolvedValue({
      ok: false,
      error: "FEATURE_DISABLED",
    });
    render(<StartQuizButton domain="hair" />);
    fireEvent.click(screen.getByRole("button", { name: "Start the quiz" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
