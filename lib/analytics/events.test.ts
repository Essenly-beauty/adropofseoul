import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { registerAnalyticsProvider, track, type EventProps } from "./index";
import {
  profileQuizStarted,
  profileQuizStepViewed,
  profileQuizStepCompleted,
  profileQuizResumed,
  profileQuizCompleted,
} from "./events";

const events: { event: string; props?: EventProps }[] = [];

beforeEach(() => {
  events.length = 0;
  registerAnalyticsProvider({
    track: (event, props) => events.push({ event, props }),
    identify: () => {},
  });
});

afterEach(() => registerAnalyticsProvider(null));

describe("profile quiz funnel events", () => {
  it("emits started with controlled taxonomy and defaults auth_state", () => {
    profileQuizStarted({ domain: "hair", quizVersion: 0, entrySource: "hub" });
    expect(events).toEqual([
      {
        event: "profile_quiz_started",
        props: {
          profile_domain: "hair",
          quiz_version: 0,
          entry_source: "hub",
          auth_state: "anonymous",
        },
      },
    ]);
  });

  it("emits step_viewed with the question KEY and index, never an answer", () => {
    profileQuizStepViewed({
      domain: "hair",
      quizVersion: 0,
      stepKey: "wash_frequency",
      stepIndex: 1,
    });
    expect(events[0].event).toBe("profile_quiz_step_viewed");
    expect(events[0].props).toEqual({
      profile_domain: "hair",
      quiz_version: 0,
      step_key: "wash_frequency",
      step_index: 1,
    });
  });

  it("emits step_completed with a validation error count", () => {
    profileQuizStepCompleted({
      domain: "hair",
      quizVersion: 0,
      stepKey: "concerns",
      stepIndex: 2,
      validationErrorCount: 1,
    });
    expect(events[0].props).toMatchObject({
      step_key: "concerns",
      validation_error_count: 1,
    });
  });

  it("emits resumed with a bucketed age", () => {
    profileQuizResumed({
      domain: "hair",
      quizVersion: 0,
      resumeAgeBucket: "1_24h",
    });
    expect(events[0].event).toBe("profile_quiz_resumed");
    expect(events[0].props).toMatchObject({ resume_age_bucket: "1_24h" });
  });

  it("emits completed with a bucketed duration", () => {
    profileQuizCompleted({
      domain: "hair",
      quizVersion: 0,
      durationBucket: "1_3m",
    });
    expect(events[0].event).toBe("profile_quiz_completed");
    expect(events[0].props).toMatchObject({ duration_bucket: "1_3m" });
  });

  it("the hardened PII guard rejects raw-answer / ownership-secret keys (H13)", () => {
    for (const key of [
      "value",
      "value_code",
      "label",
      "text",
      "token",
      "token_hash",
    ]) {
      expect(() =>
        track("profile_quiz_step_viewed", { [key]: "daily" })
      ).toThrow(/forbidden property/);
    }
  });
});
