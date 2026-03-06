/**
 * Recommendation Engine
 *
 * Computes chance labels, eligibility tiers, course fit scores,
 * and applies user filters to produce ranked course recommendations.
 */

import type { InterestTag, PreferenceFlags } from "../quiz-engine";
import type { UniStyleProfile } from "../uni-style-quiz";
import { computeUniStyleFitScore } from "../uni-style-quiz";
import {
  ABA_DELTA,
  ABA_PORTFOLIO_THRESHOLD,
  PENALTY_CODING_PRIMARY,
  PENALTY_CODING_ANY,
  BOOST_MINIMAL_CODING_TAGS,
  PENALTY_MATH_ENGINEERING_PRIMARY,
  PENALTY_MATH_DATA_AI_PRIMARY,
  PENALTY_MATH_ENGINEERING_ANY,
  BOOST_LIGHTER_MATH_TAGS,
  BOOST_PEOPLE_WORK,
  BOOST_PEOPLE_WORK_LAW,
  PENALTY_PEOPLE_WORK_ANTISOCIAL,
  PEOPLE_WORK_TAGS,
  BOOST_ANALYTICAL,
  ANALYTICAL_TAGS,
  PENALTY_ANALYTICAL_CREATIVE,
  BOOST_CREATIVE,
  BOOST_CREATIVE_COMMS,
  PENALTY_CREATIVE_FINANCE,
  STRUCTURE_BOOST_TAGS,
  EXPLORATION_BOOST_TAGS,
  QUIZ_PREFERENCE_BONUS,
  QUIZ_CODING_PENALTY,
  QUIZ_MATH_PENALTY,
  PREREQ_NOT_MET_PENALTY,
  LEGACY_FIT_WEIGHT,
  RIASEC_FIT_WEIGHT,
} from "./config";
import { computeRiasecFitScore } from "../riasec";
import type { RiasecProfile } from "../riasec";

// ----- Types -----

export type ChanceLabel = "High" | "Medium" | "Low";
export type PrereqStatus = "met" | "not_met" | "unknown";
export type ReachMatchSafe =
  | "Safe"
  | "Match"
  | "Reach (close)"
  | "Reach (far)";
export type FitLabel = "Strong fit" | "Good fit" | "Some fit";

export interface PortfolioInput {
  leadershipRoles: "0" | "1-2" | "3+";
  awardsLevel: "none" | "school" | "national";
  relevantActivities: number; // count of internships/projects/competitions
  personalStatementStrength: number; // 1-5 slider
}

export interface CourseData {
  id: number;
  slug: string;
  name: string;
  universityName: string;
  faculty: string;
  tags: InterestTag[];
  prerequisites: string[];
  igp10Rp: number;
  igp90Rp: number;
  igp10Text: string;
  igp90Text: string;
  salaryMedian: number | null;
  employmentRateFTPerm: number | null;
  officialUrl: string;
  typicalRoles: string[];
  aiRiskNote: string;
}

export interface FilterSettings {
  preferMinimalCoding: boolean;
  preferLighterMath: boolean;
  preferPeopleFacing: boolean;
  preferAnalytical: boolean;
  preferCreative: boolean;
  higherSalary: boolean;
  higherEmployment: boolean;
  reachLevel: "show_all" | "mostly_realistic" | "only_realistic";
  timeToDecide: "clear_path" | "balanced" | "flexibility";
}

export const DEFAULT_FILTERS: FilterSettings = {
  preferMinimalCoding: false,
  preferLighterMath: false,
  preferPeopleFacing: false,
  preferAnalytical: false,
  preferCreative: false,
  higherSalary: false,
  higherEmployment: false,
  reachLevel: "mostly_realistic",
  timeToDecide: "balanced",
};

export interface RecommendedCourse {
  course: CourseData;
  chanceLabel: ChanceLabel;
  prereqStatus: PrereqStatus;
  reachMatchSafe: ReachMatchSafe;
  fitLabel: FitLabel;
  abaRecommended: boolean;
  eligibilityTier: number;
  baseFitScore: number;
  adjustedFitScore: number;
  uniStyleFitScore: number;
}

// ----- Portfolio scoring -----

export function computePortfolioScore(portfolio: PortfolioInput): number {
  let score = 0;
  // Leadership
  if (portfolio.leadershipRoles === "1-2") score += 1;
  if (portfolio.leadershipRoles === "3+") score += 2;
  // Awards
  if (portfolio.awardsLevel === "school") score += 1;
  if (portfolio.awardsLevel === "national") score += 3;
  // Activities (cap at 3 points)
  score += Math.min(portfolio.relevantActivities, 3);
  // Personal statement (1-5 → 0-2 points)
  score += Math.max(0, Math.floor((portfolio.personalStatementStrength - 1) / 2));
  return score;
}

// ----- Chance label computation -----

export function computeChanceLabel(
  userRp: number,
  igp10Rp: number,
  igp90Rp: number
): ChanceLabel {
  if (igp10Rp === 0 && igp90Rp === 0) return "Medium"; // No IGP data
  if (userRp >= igp90Rp) return "High";
  if (userRp >= igp10Rp) return "Medium";
  return "Low";
}

// ----- Prerequisite checking -----

/**
 * Check if user's H2 subjects meet course prerequisites.
 * Prerequisites are strings like "H2 Mathematics", "H2 Chemistry", etc.
 * userH2Subjects should be normalized subject names the user took.
 */
export function checkPrerequisites(
  coursePrereqs: string[],
  userH2Subjects: string[],
  userH1Subjects: string[]
): PrereqStatus {
  if (coursePrereqs.length === 0) return "unknown";

  const allUserSubjects = [
    ...userH2Subjects.map((s) => s.toLowerCase()),
    ...userH1Subjects.map((s) => s.toLowerCase()),
  ];

  for (const prereq of coursePrereqs) {
    const lower = prereq.toLowerCase();
    // Handle "or" prerequisites like "H2 Physics or H2 Chemistry"
    if (lower.includes(" or ")) {
      const alternatives = lower.split(" or ").map((a) => a.trim());
      const anyMet = alternatives.some((alt) => {
        // Extract subject name after "h2 " or "h1 "
        const subjectName = alt.replace(/^h[12]\s+/, "").trim();
        return allUserSubjects.some(
          (us) => us.includes(subjectName) || subjectName.includes(us)
        );
      });
      if (!anyMet) return "not_met";
    } else {
      const subjectName = lower.replace(/^h[12]\s+/, "").trim();
      const met = allUserSubjects.some(
        (us) => us.includes(subjectName) || subjectName.includes(us)
      );
      if (!met) return "not_met";
    }
  }

  return "met";
}

// ----- ABA advisory -----

export function shouldRecommendABA(
  chanceLabel: ChanceLabel,
  userRp: number,
  igp10Rp: number,
  portfolioScore: number
): boolean {
  if (chanceLabel !== "Low") return false;
  const withinDelta = userRp >= igp10Rp - ABA_DELTA;
  return withinDelta && portfolioScore >= ABA_PORTFOLIO_THRESHOLD;
}

// ----- Base fit score (from quiz tags) -----

export function computeBaseFitScore(
  courseTags: InterestTag[],
  userTagPoints: Record<InterestTag, number>,
  preferences: PreferenceFlags
): number {
  let score = 0;

  // Sum tag overlap points
  for (const tag of courseTags) {
    score += userTagPoints[tag] || 0;
  }

  // Preference flag bonuses
  if (
    preferences.prefers_people_work &&
    courseTags.some((t) => PEOPLE_WORK_TAGS.includes(t))
  ) {
    score += QUIZ_PREFERENCE_BONUS;
  }
  if (
    preferences.prefers_analytical_work &&
    courseTags.some((t) => ANALYTICAL_TAGS.includes(t))
  ) {
    score += QUIZ_PREFERENCE_BONUS;
  }
  if (
    preferences.prefers_creative_work &&
    courseTags.includes("design_creative_media")
  ) {
    score += QUIZ_PREFERENCE_BONUS;
  }

  // Penalties for avoid flags
  if (
    preferences.avoid_heavy_coding &&
    courseTags[0] === "computing_software"
  ) {
    score += QUIZ_CODING_PENALTY;
  }
  if (
    preferences.avoid_heavy_math &&
    (courseTags[0] === "engineering" || courseTags[0] === "data_ai")
  ) {
    score += QUIZ_MATH_PENALTY;
  }

  return score;
}

// ----- Filter adjustments -----

export function applyFilterAdjustments(
  baseFitScore: number,
  courseTags: InterestTag[],
  filters: FilterSettings,
  preferences: PreferenceFlags
): number {
  let adjusted = baseFitScore;
  const primaryTag = courseTags[0];

  // F1: Minimal coding
  if (filters.preferMinimalCoding) {
    if (primaryTag === "computing_software") adjusted += PENALTY_CODING_PRIMARY;
    else if (courseTags.includes("computing_software"))
      adjusted += PENALTY_CODING_ANY;
    if (courseTags.some((t) => BOOST_MINIMAL_CODING_TAGS.includes(t)))
      adjusted += 1;
  }

  // F2: Lighter math
  if (filters.preferLighterMath) {
    if (primaryTag === "engineering") adjusted += PENALTY_MATH_ENGINEERING_PRIMARY;
    if (primaryTag === "data_ai") adjusted += PENALTY_MATH_DATA_AI_PRIMARY;
    if (
      primaryTag !== "engineering" &&
      courseTags.includes("engineering")
    )
      adjusted += PENALTY_MATH_ENGINEERING_ANY;
    if (courseTags.some((t) => BOOST_LIGHTER_MATH_TAGS.includes(t)))
      adjusted += 1;
  }

  // F3: People-facing work
  if (filters.preferPeopleFacing) {
    if (courseTags.some((t) => PEOPLE_WORK_TAGS.includes(t)))
      adjusted += BOOST_PEOPLE_WORK;
    if (courseTags.includes("law_public_policy"))
      adjusted += BOOST_PEOPLE_WORK_LAW;
    if (
      (primaryTag === "data_ai" || primaryTag === "engineering") &&
      !courseTags.some((t) => PEOPLE_WORK_TAGS.includes(t))
    )
      adjusted += PENALTY_PEOPLE_WORK_ANTISOCIAL;
  }

  // F4: Analytical work
  if (filters.preferAnalytical) {
    if (courseTags.some((t) => ANALYTICAL_TAGS.includes(t)))
      adjusted += BOOST_ANALYTICAL;
    if (
      primaryTag === "design_creative_media" &&
      !filters.preferCreative
    )
      adjusted += PENALTY_ANALYTICAL_CREATIVE;
  }

  // F5: Creative work
  if (filters.preferCreative) {
    if (courseTags.includes("design_creative_media"))
      adjusted += BOOST_CREATIVE;
    if (courseTags.includes("communications_marketing"))
      adjusted += BOOST_CREATIVE_COMMS;
    if (
      primaryTag === "finance_accounting" &&
      !filters.preferAnalytical
    )
      adjusted += PENALTY_CREATIVE_FINANCE;
  }

  // F9: Time-to-decide
  if (filters.timeToDecide === "clear_path") {
    if (courseTags.some((t) => STRUCTURE_BOOST_TAGS.includes(t)))
      adjusted += 1;
  } else if (filters.timeToDecide === "flexibility") {
    if (courseTags.some((t) => EXPLORATION_BOOST_TAGS.includes(t)))
      adjusted += 1;
  }

  return adjusted;
}

// ----- Eligibility tier -----

export function computeEligibilityTier(
  prereqStatus: PrereqStatus,
  chanceLabel: ChanceLabel,
  abaRecommended: boolean,
  userRp: number,
  igp10Rp: number
): number {
  if (prereqStatus === "not_met") return 5;

  if (prereqStatus === "met") {
    if (chanceLabel === "High" || chanceLabel === "Medium") return 1;
    if (chanceLabel === "Low") {
      const withinDelta = userRp >= igp10Rp - ABA_DELTA;
      if (abaRecommended || withinDelta) return 2;
      return 4;
    }
  }

  // prereqStatus === "unknown"
  if (chanceLabel === "High" || chanceLabel === "Medium") return 3;
  return 4; // unknown + Low treated as competitive
}

// ----- Reach/Match/Safe -----

export function computeReachMatchSafe(
  chanceLabel: ChanceLabel,
  prereqStatus: PrereqStatus,
  userRp: number,
  igp10Rp: number
): ReachMatchSafe {
  if (prereqStatus === "not_met") return "Reach (far)";
  if (chanceLabel === "High") return "Safe";
  if (chanceLabel === "Medium") return "Match";
  // Low
  const withinDelta = userRp >= igp10Rp - ABA_DELTA;
  return withinDelta ? "Reach (close)" : "Reach (far)";
}

// ----- Fit label from score percentile -----

export function computeFitLabel(
  adjustedFitScore: number,
  allScores: number[]
): FitLabel {
  if (allScores.length === 0) return "Some fit";
  const sorted = [...allScores].sort((a, b) => b - a);
  const rank = sorted.indexOf(adjustedFitScore);
  const percentile = rank / sorted.length;
  if (percentile <= 0.2) return "Strong fit";
  if (percentile <= 0.5) return "Good fit";
  return "Some fit";
}

// ----- Main recommendation function -----

export interface RecommendationInput {
  userRp: number;
  userH2Subjects: string[];
  userH1Subjects: string[];
  tagPoints: Record<InterestTag, number>;
  preferences: PreferenceFlags;
  portfolio: PortfolioInput | null;
  uniStyleProfile: UniStyleProfile | null;
  riasecProfile?: RiasecProfile | null;
  filters: FilterSettings;
  courses: CourseData[];
  hidePrereqNotMet: boolean;
  prioritiseEligibility: boolean;
  openToCompetitive: boolean;
}

export function generateRecommendations(
  input: RecommendationInput
): RecommendedCourse[] {
  const {
    userRp,
    userH2Subjects,
    userH1Subjects,
    tagPoints,
    preferences,
    portfolio,
    uniStyleProfile,
    riasecProfile,
    filters,
    courses,
    hidePrereqNotMet,
    prioritiseEligibility,
    openToCompetitive,
  } = input;

  const portfolioScore = portfolio
    ? computePortfolioScore(portfolio)
    : 0;

  // Merge filter-forced preferences with quiz preferences
  const effectivePrefs: PreferenceFlags = {
    ...preferences,
    avoid_heavy_coding:
      preferences.avoid_heavy_coding || filters.preferMinimalCoding,
    avoid_heavy_math:
      preferences.avoid_heavy_math || filters.preferLighterMath,
    prefers_people_work:
      preferences.prefers_people_work || filters.preferPeopleFacing,
    prefers_analytical_work:
      preferences.prefers_analytical_work || filters.preferAnalytical,
    prefers_creative_work:
      preferences.prefers_creative_work || filters.preferCreative,
  };

  // Apply time-to-decide to structure/exploration
  let effectiveStructure = effectivePrefs.likes_structure_vs_exploration;
  if (filters.timeToDecide === "clear_path" && effectiveStructure === "balanced")
    effectiveStructure = "structure";
  if (
    filters.timeToDecide === "flexibility" &&
    effectiveStructure === "balanced"
  )
    effectiveStructure = "exploration";

  // Compute scores for all courses
  let results: RecommendedCourse[] = courses.map((course) => {
    const prereqStatus = checkPrerequisites(
      course.prerequisites,
      userH2Subjects,
      userH1Subjects
    );
    const chanceLabel = computeChanceLabel(
      userRp,
      course.igp10Rp,
      course.igp90Rp
    );
    const abaRecommended =
      prereqStatus !== "not_met" &&
      shouldRecommendABA(chanceLabel, userRp, course.igp10Rp, portfolioScore);
    const eligibilityTier = computeEligibilityTier(
      prereqStatus,
      chanceLabel,
      abaRecommended,
      userRp,
      course.igp10Rp
    );
    const reachMatchSafe = computeReachMatchSafe(
      chanceLabel,
      prereqStatus,
      userRp,
      course.igp10Rp
    );

    const baseFitScore = computeBaseFitScore(
      course.tags,
      tagPoints,
      effectivePrefs
    );
    const riasecFitScore = computeRiasecFitScore(
      tagPoints,
      course.tags,
      riasecProfile ?? undefined
    );
    const blendedBaseFitScore =
      baseFitScore * LEGACY_FIT_WEIGHT + riasecFitScore * RIASEC_FIT_WEIGHT;
    const adjustedFitScore = applyFilterAdjustments(
      blendedBaseFitScore,
      course.tags,
      filters,
      effectivePrefs
    );

    // Prereq-not-met penalty when not hidden
    const finalFitScore =
      prereqStatus === "not_met"
        ? adjustedFitScore + PREREQ_NOT_MET_PENALTY
        : adjustedFitScore;

    const uniStyleFitScore = uniStyleProfile
      ? computeUniStyleFitScore(
          course.universityName,
          course.tags,
          uniStyleProfile,
          effectivePrefs.prefers_people_work
        )
      : 0;

    return {
      course,
      chanceLabel,
      prereqStatus,
      reachMatchSafe,
      fitLabel: "Some fit" as FitLabel, // placeholder, computed after all scores known
      abaRecommended,
      eligibilityTier,
      baseFitScore: blendedBaseFitScore,
      adjustedFitScore: finalFitScore,
      uniStyleFitScore,
    };
  });

  // Compute fit labels based on all adjusted scores
  const allScores = results.map((r) => r.adjustedFitScore);
  for (const r of results) {
    r.fitLabel = computeFitLabel(r.adjustedFitScore, allScores);
  }

  // Apply reach level filter
  if (filters.reachLevel === "mostly_realistic") {
    // Hide Tier 4 unless courseFitScore is in top 10%
    const sorted = [...allScores].sort((a, b) => b - a);
    const top10Threshold = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
    results = results.filter(
      (r) =>
        r.eligibilityTier !== 4 || r.adjustedFitScore >= top10Threshold
    );
  } else if (filters.reachLevel === "only_realistic") {
    // Show only Tier 1, 2, and Tier 5 if top 5%
    const sorted = [...allScores].sort((a, b) => b - a);
    const top5Threshold = sorted[Math.floor(sorted.length * 0.05)] ?? 0;
    results = results.filter(
      (r) =>
        r.eligibilityTier <= 2 ||
        (r.eligibilityTier === 5 && r.adjustedFitScore >= top5Threshold)
    );
  }

  // Hide prereqs not met if toggle is on
  if (hidePrereqNotMet) {
    results = results.filter((r) => r.prereqStatus !== "not_met");
  }

  // Hide Tier 4 if not open to competitive
  if (!openToCompetitive) {
    results = results.filter((r) => r.eligibilityTier !== 4);
  }

  // Sort
  const chancePriority: Record<ChanceLabel, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  if (prioritiseEligibility) {
    // Group by tier, sort within tier
    results.sort((a, b) => {
      // Tier first
      if (a.eligibilityTier !== b.eligibilityTier)
        return a.eligibilityTier - b.eligibilityTier;
      // Adjusted fit score
      if (a.adjustedFitScore !== b.adjustedFitScore)
        return b.adjustedFitScore - a.adjustedFitScore;
      // Chance label
      if (a.chanceLabel !== b.chanceLabel)
        return chancePriority[b.chanceLabel] - chancePriority[a.chanceLabel];
      // Uni style fit
      if (a.uniStyleFitScore !== b.uniStyleFitScore)
        return b.uniStyleFitScore - a.uniStyleFitScore;
      // Salary tie-breaker
      if (filters.higherSalary) {
        const salA = a.course.salaryMedian ?? 0;
        const salB = b.course.salaryMedian ?? 0;
        if (salA !== salB) return salB - salA;
      }
      // Employment tie-breaker
      if (filters.higherEmployment) {
        const empA = a.course.employmentRateFTPerm ?? 0;
        const empB = b.course.employmentRateFTPerm ?? 0;
        if (empA !== empB) return empB - empA;
      }
      return 0;
    });
  } else {
    // Blended ranking (still keep prereq not met at bottom)
    results.sort((a, b) => {
      // Prereq not met always last
      if (a.prereqStatus === "not_met" && b.prereqStatus !== "not_met")
        return 1;
      if (a.prereqStatus !== "not_met" && b.prereqStatus === "not_met")
        return -1;
      // Then by adjusted fit score
      if (a.adjustedFitScore !== b.adjustedFitScore)
        return b.adjustedFitScore - a.adjustedFitScore;
      if (a.chanceLabel !== b.chanceLabel)
        return chancePriority[b.chanceLabel] - chancePriority[a.chanceLabel];
      return b.uniStyleFitScore - a.uniStyleFitScore;
    });
  }

  return results;
}
