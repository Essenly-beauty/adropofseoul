import { describe, it, expect } from "vitest";
import { isFlagEnabled, flagStates, PROFILE_FLAGS } from "./flags";

describe("profile feature flags", () => {
  it("defaults every flag to off with no env", () => {
    const states = flagStates({});
    expect(Object.values(states).every((v) => v === false)).toBe(true);
    expect(Object.keys(states).sort()).toEqual([...PROFILE_FLAGS].sort());
  });

  it("enables a flag only for truthy env values", () => {
    const on = { NEXT_PUBLIC_FLAG_BEAUTY_PROFILE: "1" };
    expect(isFlagEnabled("beauty_profile", on)).toBe(true);
    for (const v of ["true", "on", "yes", "TRUE"]) {
      expect(
        isFlagEnabled("beauty_profile", { NEXT_PUBLIC_FLAG_BEAUTY_PROFILE: v })
      ).toBe(true);
    }
    for (const v of ["0", "false", "", "off", undefined]) {
      expect(
        isFlagEnabled("beauty_profile", { NEXT_PUBLIC_FLAG_BEAUTY_PROFILE: v })
      ).toBe(false);
    }
  });

  it("keeps flags independent", () => {
    const env = { NEXT_PUBLIC_FLAG_SKIN_PROFILE: "1" };
    expect(isFlagEnabled("skin_profile", env)).toBe(true);
    expect(isFlagEnabled("hair_profile", env)).toBe(false);
  });
});
