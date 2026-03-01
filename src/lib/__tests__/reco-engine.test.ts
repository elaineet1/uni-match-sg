/**
 * Unit tests for the Recommendation Engine.
 *
 * Tests cover:
 * - Chance label computation (High/Medium/Low)
 * - Prerequisite checking
 * - ABA advisory
 * - Eligibility tiers
 * - Reach/Match/Safe mapping
 * - Portfolio scoring
 */

import {
  computeChanceLabel,
  checkPrerequisites,
  shouldRecommendABA,
  computeEligibilityTier,
  computeReachMatchSafe,
  computePortfolioScore,
  computeBaseFitScore,
} from "../reco/engine";
import type { PortfolioInput } from "../reco/engine";
import type { InterestTag, PreferenceFlags } from "../quiz-engine";
import { INTEREST_TAGS } from "../quiz-engine";

describe("computeChanceLabel", () => {
  test("High when user RP >= IGP 90th percentile", () => {
    expect(computeChanceLabel(70, 65, 68)).toBe("High");
    expect(computeChanceLabel(68, 65, 68)).toBe("High");
  });

  test("Medium when user RP >= IGP 10th but < 90th", () => {
    expect(computeChanceLabel(66, 65, 68)).toBe("Medium");
    expect(computeChanceLabel(65, 65, 68)).toBe("Medium");
  });

  test("Low when user RP < IGP 10th percentile", () => {
    expect(computeChanceLabel(64, 65, 68)).toBe("Low");
    expect(computeChanceLabel(50, 65, 68)).toBe("Low");
  });

  test("Medium when no IGP data (both 0)", () => {
    expect(computeChanceLabel(60, 0, 0)).toBe("Medium");
  });

  test("Boundary: exactly at 10th percentile is Medium", () => {
    expect(computeChanceLabel(65, 65, 70)).toBe("Medium");
  });

  test("Boundary: exactly at 90th percentile is High", () => {
    expect(computeChanceLabel(70, 65, 70)).toBe("High");
  });
});

describe("checkPrerequisites", () => {
  test("Returns 'unknown' when no prerequisites", () => {
    expect(checkPrerequisites([], ["Mathematics"], [])).toBe("unknown");
  });

  test("Returns 'met' when all prerequisites satisfied", () => {
    expect(
      checkPrerequisites(
        ["H2 Mathematics"],
        ["Mathematics", "Chemistry"],
        []
      )
    ).toBe("met");
  });

  test("Returns 'not_met' when prerequisite not satisfied", () => {
    expect(
      checkPrerequisites(
        ["H2 Mathematics", "H2 Physics"],
        ["Mathematics", "Chemistry"],
        []
      )
    ).toBe("not_met");
  });

  test("Handles 'or' prerequisites", () => {
    expect(
      checkPrerequisites(
        ["H2 Physics or H2 Chemistry"],
        ["Chemistry"],
        []
      )
    ).toBe("met");
    expect(
      checkPrerequisites(
        ["H2 Physics or H2 Chemistry"],
        ["Biology"],
        []
      )
    ).toBe("not_met");
  });
});

describe("shouldRecommendABA", () => {
  test("Recommends ABA when Low chance, within delta, portfolio above threshold", () => {
    // igp10 = 65, user = 63, delta = 2.5 → 63 >= 62.5 → within delta
    expect(shouldRecommendABA("Low", 63, 65, 5)).toBe(true);
  });

  test("Does not recommend ABA when not Low chance", () => {
    expect(shouldRecommendABA("High", 63, 65, 5)).toBe(false);
    expect(shouldRecommendABA("Medium", 63, 65, 5)).toBe(false);
  });

  test("Does not recommend ABA when beyond delta", () => {
    // igp10 = 65, user = 60, delta = 2.5 → 60 < 62.5 → beyond
    expect(shouldRecommendABA("Low", 60, 65, 5)).toBe(false);
  });

  test("Does not recommend ABA when portfolio below threshold", () => {
    expect(shouldRecommendABA("Low", 63, 65, 2)).toBe(false);
  });
});

describe("computeEligibilityTier", () => {
  test("Tier 1: prereq met + High chance", () => {
    expect(computeEligibilityTier("met", "High", false, 70, 65)).toBe(1);
  });

  test("Tier 1: prereq met + Medium chance", () => {
    expect(computeEligibilityTier("met", "Medium", false, 66, 65)).toBe(1);
  });

  test("Tier 2: prereq met + Low + ABA recommended", () => {
    expect(computeEligibilityTier("met", "Low", true, 63, 65)).toBe(2);
  });

  test("Tier 2: prereq met + Low + within delta (no ABA)", () => {
    expect(computeEligibilityTier("met", "Low", false, 63, 65)).toBe(2);
  });

  test("Tier 3: prereq unknown + High", () => {
    expect(computeEligibilityTier("unknown", "High", false, 70, 65)).toBe(3);
  });

  test("Tier 4: prereq met + Low + NOT within delta", () => {
    expect(computeEligibilityTier("met", "Low", false, 55, 65)).toBe(4);
  });

  test("Tier 5: prereq not met (always)", () => {
    expect(computeEligibilityTier("not_met", "High", false, 70, 65)).toBe(5);
    expect(computeEligibilityTier("not_met", "Low", false, 50, 65)).toBe(5);
  });
});

describe("computeReachMatchSafe", () => {
  test("Safe when High chance", () => {
    expect(computeReachMatchSafe("High", "met", 70, 65)).toBe("Safe");
  });

  test("Match when Medium chance", () => {
    expect(computeReachMatchSafe("Medium", "met", 66, 65)).toBe("Match");
  });

  test("Reach (close) when Low but within delta", () => {
    expect(computeReachMatchSafe("Low", "met", 63, 65)).toBe("Reach (close)");
  });

  test("Reach (far) when Low and beyond delta", () => {
    expect(computeReachMatchSafe("Low", "met", 55, 65)).toBe("Reach (far)");
  });

  test("Reach (far) when prereq not met", () => {
    expect(computeReachMatchSafe("High", "not_met", 70, 65)).toBe(
      "Reach (far)"
    );
  });
});

describe("computePortfolioScore", () => {
  test("Minimum portfolio", () => {
    const portfolio: PortfolioInput = {
      leadershipRoles: "0",
      awardsLevel: "none",
      relevantActivities: 0,
      personalStatementStrength: 1,
    };
    expect(computePortfolioScore(portfolio)).toBe(0);
  });

  test("Maximum portfolio", () => {
    const portfolio: PortfolioInput = {
      leadershipRoles: "3+",
      awardsLevel: "national",
      relevantActivities: 5,
      personalStatementStrength: 5,
    };
    // 2 + 3 + 3(capped) + 2 = 10
    expect(computePortfolioScore(portfolio)).toBe(10);
  });

  test("Mid-range portfolio", () => {
    const portfolio: PortfolioInput = {
      leadershipRoles: "1-2",
      awardsLevel: "school",
      relevantActivities: 2,
      personalStatementStrength: 3,
    };
    // 1 + 1 + 2 + 1 = 5
    expect(computePortfolioScore(portfolio)).toBe(5);
  });
});

describe("computeBaseFitScore", () => {
  test("Scores based on tag overlap", () => {
    const tags: InterestTag[] = ["computing_software", "data_ai"];
    const tagPoints: Record<InterestTag, number> = {} as Record<InterestTag, number>;
    for (const t of INTEREST_TAGS) tagPoints[t] = 0;
    tagPoints.computing_software = 10;
    tagPoints.data_ai = 5;

    const prefs: PreferenceFlags = {
      prefers_people_work: false,
      prefers_analytical_work: false,
      prefers_creative_work: false,
      avoid_heavy_math: false,
      avoid_heavy_coding: false,
      likes_structure_vs_exploration: "balanced",
    };

    expect(computeBaseFitScore(tags, tagPoints, prefs)).toBe(15);
  });

  test("Applies coding penalty when avoid_heavy_coding and primary tag is computing_software", () => {
    const tags: InterestTag[] = ["computing_software", "data_ai"];
    const tagPoints: Record<InterestTag, number> = {} as Record<InterestTag, number>;
    for (const t of INTEREST_TAGS) tagPoints[t] = 0;
    tagPoints.computing_software = 3;
    tagPoints.data_ai = 2;

    const prefs: PreferenceFlags = {
      prefers_people_work: false,
      prefers_analytical_work: false,
      prefers_creative_work: false,
      avoid_heavy_math: false,
      avoid_heavy_coding: true,
      likes_structure_vs_exploration: "balanced",
    };

    // 3 + 2 - 2(penalty) = 3
    expect(computeBaseFitScore(tags, tagPoints, prefs)).toBe(3);
  });
});
