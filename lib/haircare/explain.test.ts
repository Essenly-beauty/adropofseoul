import { describe, it, expect } from "vitest";
import { explainHairResult } from "./explain";
import { scoreHairQuiz, type HairQuizResponses } from "./scoring";

function sheet(over: HairQuizResponses = {}): HairQuizResponses {
  return {
    natural_pattern: "loose_wave",
    strand_thickness: "fine",
    density: "low",
    scalp_oiliness_onset: "two_plus_days",
    scalp_concerns: ["none"],
    wash_frequency: "every_other_day",
    product_response: "varies",
    dry_time: "average",
    humidity_response: "waves_appear",
    chemical_history: ["none"],
    heat_frequency: "rarely",
    ends_condition: "smooth",
    primary_concern: "curl_definition",
    desired_result: "defined_texture",
    ...over,
  };
}

function explain(over: HairQuizResponses = {}) {
  const responses = sheet(over);
  return explainHairResult(responses, scoreHairQuiz(responses));
}

describe("explainHairResult", () => {
  it("tags the pattern, strand, density, and goal in that order", () => {
    expect(explain().tags).toEqual([
      "Loose wave",
      "Fine strands",
      "Low density",
      "Goal: Defined texture",
    ]);
  });

  it("distinguishes medium strands from medium density", () => {
    const tags = explain({
      strand_thickness: "medium",
      density: "medium",
    }).tags;
    expect(tags).toContain("Medium strands");
    expect(tags).toContain("Medium density");
  });

  it("omits a tag the user could not answer", () => {
    const tags = explain({
      strand_thickness: "unknown",
      density: "unknown",
    }).tags;
    expect(tags).toEqual(["Loose wave", "Goal: Defined texture"]);
  });

  it("adds a sensitive-scalp tag and raises the advisory for scalp symptoms", () => {
    const res = explain({ scalp_concerns: ["itching", "flaking"] });
    expect(res.tags).toContain("Sensitive scalp consideration");
    expect(res.advisory).toBe(true);
  });

  it("raises the advisory when the main concern needs a professional", () => {
    expect(explain({ primary_concern: "sensitive_scalp" }).advisory).toBe(true);
    expect(explain({ primary_concern: "hair_loss" }).advisory).toBe(true);
  });

  it("leaves the advisory down for a clean scalp sheet", () => {
    const res = explain();
    expect(res.advisory).toBe(false);
    expect(res.tags).not.toContain("Sensitive scalp consideration");
  });

  it("explains with the winning archetype's heaviest answers, most first", () => {
    const res = explain();
    // The winner is Hidden Wave; waves_appear (6) outweighs loose_wave (4).
    expect(res.reasons[0]).toBe("Waves or curls become more visible");
    expect(res.reasons).toContain("Forms loose S-shaped bends");
    expect(res.reasons.length).toBeLessThanOrEqual(4);
    expect(new Set(res.reasons).size).toBe(res.reasons.length);
  });

  it("returns no tags or reasons when there is no signal", () => {
    const res = explainHairResult({}, scoreHairQuiz({}));
    expect(res.tags).toEqual([]);
    expect(res.reasons).toEqual([]);
  });
});
