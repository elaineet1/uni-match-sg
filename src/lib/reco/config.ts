/**
 * Recommendation Engine Configuration
 *
 * All scoring parameters in one place for easy tuning.
 * Adjust these values to change how recommendations are ranked.
 */

import type { InterestTag } from "../quiz-engine";

// ----- Chance label thresholds -----
// If user_rp >= igp90_rp → High
// If user_rp >= igp10_rp → Medium
// Else → Low

// ----- ABA advisory -----
/** RP margin below IGP 10th percentile where ABA is recommended (configurable) */
export const ABA_DELTA = 2.5;

/** Minimum portfolio score to recommend ABA (out of possible ~10) */
export const ABA_PORTFOLIO_THRESHOLD = 4;

// ----- Filter penalties and boosts -----

/** Penalty when course primary tag matches avoid_heavy_coding */
export const PENALTY_CODING_PRIMARY = -3;
/** Penalty when course has computing_software anywhere in tags */
export const PENALTY_CODING_ANY = -2;
/** Boost for non-coding tags when minimal coding filter is ON */
export const BOOST_MINIMAL_CODING_TAGS: InterestTag[] = [
  "business_management",
  "communications_marketing",
  "law_public_policy",
  "humanities_languages",
  "social_sciences",
  "education_psychology",
];

/** Penalty when course primary tag matches avoid_heavy_math for engineering */
export const PENALTY_MATH_ENGINEERING_PRIMARY = -3;
/** Penalty when course primary tag is data_ai for avoid_heavy_math */
export const PENALTY_MATH_DATA_AI_PRIMARY = -2;
/** Penalty when course has engineering anywhere in tags for avoid_heavy_math */
export const PENALTY_MATH_ENGINEERING_ANY = -2;
/** Boost tags for lighter math */
export const BOOST_LIGHTER_MATH_TAGS: InterestTag[] = [
  "communications_marketing",
  "humanities_languages",
  "social_sciences",
  "education_psychology",
  "law_public_policy",
];

/** Boost for people-facing courses */
export const BOOST_PEOPLE_WORK = 2;
export const BOOST_PEOPLE_WORK_LAW = 1;
export const PENALTY_PEOPLE_WORK_ANTISOCIAL = -1;
export const PEOPLE_WORK_TAGS: InterestTag[] = [
  "communications_marketing",
  "business_management",
  "education_psychology",
  "healthcare_biomedical",
];

/** Boost for analytical courses */
export const BOOST_ANALYTICAL = 2;
export const ANALYTICAL_TAGS: InterestTag[] = [
  "data_ai",
  "finance_accounting",
  "economics_policy",
  "engineering",
];
export const PENALTY_ANALYTICAL_CREATIVE = -1;

/** Boost for creative courses */
export const BOOST_CREATIVE = 2;
export const BOOST_CREATIVE_COMMS = 1;
export const PENALTY_CREATIVE_FINANCE = -1;

/** Structure/exploration boosts */
export const STRUCTURE_BOOST_TAGS: InterestTag[] = [
  "operations_logistics",
  "finance_accounting",
  "engineering",
];
export const EXPLORATION_BOOST_TAGS: InterestTag[] = [
  "entrepreneurship_product",
  "humanities_languages",
  "social_sciences",
];

// ----- Preference flag quiz scoring bonuses -----
export const QUIZ_PREFERENCE_BONUS = 1;
export const QUIZ_CODING_PENALTY = -2;
export const QUIZ_MATH_PENALTY = -2;

// ----- Prerequisite-not-met penalty (when not hidden) -----
export const PREREQ_NOT_MET_PENALTY = -1;

// ----- Hybrid interest fit (legacy + RIASEC) -----
/** Weight for existing legacy interest-fit score */
export const LEGACY_FIT_WEIGHT = 0.7;
/** Weight for RIASEC interest-fit score */
export const RIASEC_FIT_WEIGHT = 0.3;

// ----- Tier configuration -----
// Tier 1: prereqMet + High/Medium
// Tier 2: prereqMet + Low + (ABA recommended OR within delta)
// Tier 3: prereqUnknown + High/Medium
// Tier 4: prereqMet + Low + NOT within delta
// Tier 5: prereqNotMet

export const TIER_LABELS: Record<number, string> = {
  1: "Eligible and realistic",
  2: "Eligible, but competitive (ABA or close reach)",
  3: "Likely realistic, prerequisites unclear",
  4: "Eligible, but very competitive",
  5: "High interest, but prerequisites not met",
};

// ----- Reach/Match/Safe mapping -----
// Safe = High chance (Tier 1 High)
// Match = Medium chance (Tier 1 Medium)
// Reach (close) = Low but within delta (Tier 2)
// Reach (far) = Low beyond delta (Tier 4)
