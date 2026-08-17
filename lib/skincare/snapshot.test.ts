import { describe, expect, it } from "vitest";
import { buildSkinSnapshot, readSkinSnapshot } from "./snapshot";

const responses = {
  skin_balance: "combination",
  post_cleanse: "varies",
  primary_goal: "hydration",
  secondary_goals: ["soothing"],
  reactivity: "sometimes",
  finish: "lightweight",
  routine_focus: "serum",
  routine_complexity: "balanced",
};

describe("skin snapshot", () => {
  it("round-trips a complete deterministic profile", () => {
    const written = buildSkinSnapshot(responses);
    expect(written.profile_code).toBe("sensitive-comfort");
    expect(readSkinSnapshot(written)).toMatchObject({
      profileSlug: "sensitive-comfort",
      primaryConcern: "hydration",
      routineFocus: "serum",
      sensitiveConsideration: true,
    });
  });

  it("stores and reads incomplete input as low signal", () => {
    const written = buildSkinSnapshot({ skin_balance: "dry" });
    expect(written.profile_code).toBe("low-signal");
    expect(readSkinSnapshot(written)).toBeNull();
  });
});
