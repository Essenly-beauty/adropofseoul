import { describe, it, expect } from "vitest";
import { buildHairSnapshot, readHairSnapshot } from "./snapshot";
import { SCORING_VERSION, type HairQuizResponses } from "./scoring";

function sheet(over: HairQuizResponses = {}): HairQuizResponses {
  return {
    natural_pattern: "loose_wave",
    strand_thickness: "fine",
    density: "low",
    hair_length: "shoulder_collarbone",
    environment: ["none"],
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

describe("buildHairSnapshot", () => {
  it("stores the archetype slug and the scoring version", () => {
    const s = buildHairSnapshot(sheet());
    expect(s.profile_code).toBe("hidden-wave");
    expect(s.rule_set_version).toBe(SCORING_VERSION);
    expect(s.profile_version).toBe(1);
  });

  it("stores the display chips as traits and the codes as goals", () => {
    const s = buildHairSnapshot(sheet());
    // traits_json is what the result screen renders — chips, goal chip included.
    expect(s.traits_json).toEqual([
      "Loose wave",
      "Fine strands",
      "Low density",
      "Goal: Defined texture",
    ]);
    // goals_json is the machine-readable pair, for segmentation.
    expect(s.goals_json).toEqual({
      primaryConcern: "curl_definition",
      desiredResult: "defined_texture",
    });
  });

  it("stores the reasoning and the override in the summary", () => {
    const s = buildHairSnapshot(sheet()) as never as {
      summary_json: {
        reasons: string[];
        overrideApplied: string;
        advisory: boolean;
      };
    };
    expect(s.summary_json.reasons[0]).toBe(
      "Waves or curls become more visible"
    );
    expect(s.summary_json.overrideApplied).toBe("hidden_wave");
    expect(s.summary_json.advisory).toBe(false);
  });

  it("stores the segmentation numbers as confidence", () => {
    const s = buildHairSnapshot(
      sheet({ scalp_concerns: ["itching"] })
    ) as never as {
      confidence_json: {
        scores: Record<string, number>;
        margin: number;
        runnerUp: string | null;
        tieBreakUsed: boolean;
        tfChemicalRaw: number;
        sensitiveScalpFlag: boolean;
      };
    };
    expect(s.confidence_json.scores.HW).toBeGreaterThan(0);
    expect(typeof s.confidence_json.margin).toBe("number");
    expect(s.confidence_json.sensitiveScalpFlag).toBe(true);
  });

  it("stores a low-signal sheet without inventing an archetype", () => {
    const s = buildHairSnapshot({});
    expect(s.profile_code).toBe("low-signal");
    expect(s.traits_json).toEqual([]);
  });

  it("never puts a raw answer label in traits when the tag is unknown", () => {
    const s = buildHairSnapshot(sheet({ strand_thickness: "unknown" }));
    // "unknown" has no chip copy, so it is dropped rather than stored raw.
    expect(s.traits_json).toEqual([
      "Loose wave",
      "Low density",
      "Goal: Defined texture",
    ]);
  });
});

describe("readHairSnapshot", () => {
  it("round-trips what the result screen needs", () => {
    const written = buildHairSnapshot(sheet({ scalp_concerns: ["itching"] }));
    const read = readHairSnapshot(written);
    expect(read.profileSlug).toBe("hidden-wave");
    expect(read.explanation.tags).toContain("Loose wave");
    expect(read.explanation.tags).toContain("Sensitive scalp consideration");
    expect(read.explanation.reasons[0]).toBe(
      "Waves or curls become more visible"
    );
    expect(read.explanation.advisory).toBe(true);
  });

  it("reads a low-signal snapshot back as no profile", () => {
    const read = readHairSnapshot(buildHairSnapshot({}));
    expect(read.profileSlug).toBe(null);
    expect(read.explanation.tags).toEqual([]);
    expect(read.explanation.reasons).toEqual([]);
  });

  it("survives a snapshot whose json columns are null or malformed", () => {
    const read = readHairSnapshot({
      profile_code: "hidden-wave",
      traits_json: null,
      summary_json: "not an object",
      confidence_json: null,
    });
    expect(read.profileSlug).toBe("hidden-wave");
    expect(read.explanation).toEqual({
      tags: [],
      reasons: [],
      advisory: false,
    });
  });
});
