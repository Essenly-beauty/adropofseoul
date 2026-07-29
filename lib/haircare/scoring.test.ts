import { describe, it, expect } from "vitest";
import { scoreHairQuiz, type HairQuizResponses } from "./scoring";
import { HAIR_PROFILE_SLUGS } from "./profiles";

// A neutral sheet: every answer present, none of them decisive. Individual tests
// override only the answers they care about.
function sheet(over: HairQuizResponses = {}): HairQuizResponses {
  return {
    natural_pattern: "straight",
    strand_thickness: "unknown",
    density: "unknown",
    scalp_oiliness_onset: "two_plus_days",
    scalp_concerns: ["none"],
    wash_frequency: "every_other_day",
    product_response: "varies",
    dry_time: "average",
    humidity_response: "little_change",
    chemical_history: ["none"],
    heat_frequency: "rarely",
    ends_condition: "smooth",
    primary_concern: "lack_shine",
    desired_result: "glass_hair",
    ...over,
  };
}

describe("scoreHairQuiz", () => {
  it("always returns a slug that exists in HAIR_PROFILES", () => {
    const res = scoreHairQuiz(sheet());
    expect(HAIR_PROFILE_SLUGS).toContain(res.profileSlug);
  });

  it("reaches the Lightweight Balancer on fine, easily-weighed-down hair", () => {
    const res = scoreHairQuiz(
      sheet({
        strand_thickness: "fine",
        density: "low",
        product_response: "weighed_down",
        humidity_response: "falls_flat",
        primary_concern: "flatness",
        desired_result: "volume",
      })
    );
    expect(res.profileSlug).toBe("lightweight-balancer");
  });

  it("reaches the Dense Glass Seeker on coarse, dense, dull hair", () => {
    const res = scoreHairQuiz(
      sheet({
        strand_thickness: "coarse",
        density: "high",
        dry_time: "slow",
        primary_concern: "lack_shine",
        desired_result: "glass_hair",
      })
    );
    expect(res.profileSlug).toBe("dense-glass-seeker");
  });

  it("reaches Oily Scalp, Dry Ends when the scalp oils fast and the ends are dry", () => {
    const res = scoreHairQuiz(
      sheet({
        scalp_oiliness_onset: "hours",
        scalp_concerns: ["oiliness"],
        wash_frequency: "daily",
        dry_time: "mixed",
        ends_condition: "slightly_dry",
        primary_concern: "oily_scalp",
      })
    );
    expect(res.profileSlug).toBe("oily-scalp-dry-ends");
  });

  it("reaches the Hidden Wave when a loose wave surfaces in humidity", () => {
    const res = scoreHairQuiz(
      sheet({
        natural_pattern: "loose_wave",
        humidity_response: "waves_appear",
      })
    );
    expect(res.profileSlug).toBe("hidden-wave");
  });

  it("reaches the Moisture-Seeking Curl on defined curls chasing definition", () => {
    const res = scoreHairQuiz(
      sheet({
        natural_pattern: "defined_wave_curl",
        humidity_response: "expands_tangles",
        primary_concern: "curl_definition",
        desired_result: "defined_texture",
      })
    );
    expect(res.profileSlug).toBe("moisture-seeking-curl");
  });

  it("reaches Treated & Fragile on breakage after bleach", () => {
    const res = scoreHairQuiz(
      sheet({
        chemical_history: ["bleach"],
        ends_condition: "split_breaking",
        primary_concern: "breakage",
      })
    );
    expect(res.profileSlug).toBe("treated-fragile");
  });

  it("overrides to Treated & Fragile when bleach meets splitting ends", () => {
    // Answers that otherwise shout Lightweight Balancer.
    const res = scoreHairQuiz(
      sheet({
        strand_thickness: "fine",
        density: "low",
        product_response: "weighed_down",
        primary_concern: "flatness",
        desired_result: "volume",
        chemical_history: ["bleach"],
        ends_condition: "split_breaking",
      })
    );
    expect(res.profileSlug).toBe("treated-fragile");
  });

  it("overrides to Treated & Fragile on services plus near-daily heat", () => {
    const res = scoreHairQuiz(
      sheet({
        chemical_history: ["color"],
        heat_frequency: "almost_daily",
        ends_condition: "slightly_dry",
      })
    );
    expect(res.profileSlug).toBe("treated-fragile");
  });

  it("does not trigger the heat override when the ends are smooth", () => {
    const res = scoreHairQuiz(
      sheet({
        chemical_history: ["color"],
        heat_frequency: "almost_daily",
        ends_condition: "smooth",
        strand_thickness: "fine",
        density: "low",
        product_response: "weighed_down",
        primary_concern: "flatness",
      })
    );
    expect(res.profileSlug).toBe("lightweight-balancer");
  });

  it("keeps coily hair on the curl profile under moderate damage", () => {
    const res = scoreHairQuiz(
      sheet({
        natural_pattern: "tight_curl_coil",
        chemical_history: ["color"],
        heat_frequency: "almost_daily",
        ends_condition: "slightly_dry",
      })
    );
    expect(res.profileSlug).toBe("moisture-seeking-curl");
  });

  it("moves coily hair to Treated & Fragile once damage clearly dominates", () => {
    const res = scoreHairQuiz(
      sheet({
        natural_pattern: "tight_curl_coil",
        chemical_history: ["bleach", "perm", "straightening"],
        heat_frequency: "almost_daily",
        ends_condition: "split_breaking",
        primary_concern: "breakage",
      })
    );
    expect(res.profileSlug).toBe("treated-fragile");
  });

  it("caps chemical damage at 10 however many services are selected", () => {
    const four = scoreHairQuiz(
      sheet({
        chemical_history: [
          "color",
          "bleach",
          "perm",
          "straightening",
          "keratin_smoothing",
        ],
      })
    );
    const bleachPlusStraightening = scoreHairQuiz(
      sheet({ chemical_history: ["bleach", "straightening"] })
    );
    expect(four.scores.TF).toBe(10);
    expect(bleachPlusStraightening.scores.TF).toBe(10);
  });

  it("adds the wave combination bonus", () => {
    const withBonus = scoreHairQuiz(
      sheet({
        natural_pattern: "defined_wave_curl",
        humidity_response: "frizzes",
      })
    );
    const withoutBonus = scoreHairQuiz(
      sheet({
        natural_pattern: "defined_wave_curl",
        humidity_response: "little_change",
      })
    );
    // frizzes contributes HW 3 on its own; the combination rule adds 3 more.
    expect(withBonus.scores.HW - withoutBonus.scores.HW).toBe(6);
  });

  it("adds the oily-scalp/dry-ends combination bonus", () => {
    const withBonus = scoreHairQuiz(
      sheet({ scalp_oiliness_onset: "next_day", ends_condition: "tangled" })
    );
    const withoutBonus = scoreHairQuiz(
      sheet({ scalp_oiliness_onset: "next_day", ends_condition: "smooth" })
    );
    // tangled contributes OD 1; the combination rule adds 4.
    expect(withBonus.scores.OD - withoutBonus.scores.OD).toBe(5);
  });

  it("scores nothing for advisory-only scalp concerns", () => {
    const advisory = scoreHairQuiz(
      sheet({ scalp_concerns: ["itching", "bumps"] })
    );
    const none = scoreHairQuiz(sheet({ scalp_concerns: ["none"] }));
    expect(advisory.scores).toEqual(none.scores);
  });

  it("reports low signal instead of guessing when nothing was answered", () => {
    const res = scoreHairQuiz({});
    expect(res.lowSignal).toBe(true);
    expect(res.profileSlug).toBe(null);
  });

  it("never reports low signal for a complete sheet, whatever the pattern", () => {
    for (const pattern of [
      "straight",
      "loose_wave",
      "defined_wave_curl",
      "tight_curl_coil",
      "unknown_treated",
    ]) {
      const res = scoreHairQuiz(sheet({ natural_pattern: pattern }));
      expect(res.lowSignal, pattern).toBe(false);
    }
  });

  it("is deterministic and records a signal for every applied weight", () => {
    const input = sheet({ natural_pattern: "loose_wave" });
    expect(scoreHairQuiz(input)).toEqual(scoreHairQuiz(input));
    const res = scoreHairQuiz(input);
    expect(
      res.signals.some(
        (s) =>
          s.questionKey === "natural_pattern" &&
          s.optionKey === "loose_wave" &&
          s.code === "HW" &&
          s.weight === 4
      )
    ).toBe(true);
  });

  it("ignores malformed answers instead of throwing", () => {
    expect(() =>
      scoreHairQuiz({
        natural_pattern: 42,
        scalp_concerns: "oiliness",
        chemical_history: null,
      })
    ).not.toThrow();
  });
});
