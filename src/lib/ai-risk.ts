import type { InterestTag } from "./quiz-engine";

export type AIRiskLevel = "Low" | "Medium" | "High";

export interface AIRiskResult {
  score: number;
  level: AIRiskLevel;
  rationale: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Estimate automation exposure risk for a course using interest tags and role keywords.
 * This is an advisory heuristic, not a prediction of unemployment.
 */
export function computeAIRisk(
  tags: InterestTag[],
  typicalRoles: string[]
): AIRiskResult {
  let score = 50;
  const factors: string[] = [];

  const tagAdjustments: Record<InterestTag, number> = {
    computing_software: -16,
    data_ai: -14,
    engineering: -12,
    healthcare_biomedical: -15,
    law_public_policy: -12,
    entrepreneurship_product: -10,
    economics_policy: -6,
    finance_accounting: 8,
    business_management: 6,
    operations_logistics: 15,
    communications_marketing: 12,
    design_creative_media: 4,
    social_sciences: 5,
    education_psychology: 4,
    life_sciences_chemistry: -5,
    humanities_languages: 7,
  };

  for (const tag of tags) {
    score += tagAdjustments[tag] ?? 0;
  }

  if (tags.includes("operations_logistics") || tags.includes("communications_marketing")) {
    factors.push("contains more routine-heavy tasks that AI can assist or automate");
  }
  if (
    tags.includes("computing_software") ||
    tags.includes("engineering") ||
    tags.includes("law_public_policy") ||
    tags.includes("healthcare_biomedical")
  ) {
    factors.push("includes higher-judgment or high-accountability work");
  }

  const roleText = typicalRoles.join(" ").toLowerCase();

  const routineKeywords = [
    "coordinator",
    "administrator",
    "operations",
    "support",
    "assistant",
    "content",
  ];
  const highJudgmentKeywords = [
    "engineer",
    "doctor",
    "lawyer",
    "research",
    "policy",
    "consultant",
    "manager",
    "architect",
    "product",
    "psychologist",
  ];

  let routineHits = 0;
  for (const keyword of routineKeywords) {
    if (roleText.includes(keyword)) routineHits++;
  }

  let judgmentHits = 0;
  for (const keyword of highJudgmentKeywords) {
    if (roleText.includes(keyword)) judgmentHits++;
  }

  score += Math.min(16, routineHits * 4);
  score -= Math.min(18, judgmentHits * 3);

  if (routineHits > 0) {
    factors.push("some listed roles include repetitive execution tasks");
  }
  if (judgmentHits > 0) {
    factors.push("many listed roles require complex human judgment");
  }

  if (typicalRoles.length >= 4) {
    score -= 6;
    factors.push("the role mix is broad, which improves adaptability");
  } else if (typicalRoles.length > 0 && typicalRoles.length <= 2) {
    score += 6;
    factors.push("the role mix is narrower, which can increase exposure");
  }

  score = clamp(score, 0, 100);

  let level: AIRiskLevel = "Medium";
  if (score <= 34) level = "Low";
  else if (score >= 65) level = "High";

  const rationale =
    factors.length > 0
      ? factors.slice(0, 2).join("; ") + "."
      : "Risk is estimated from typical role tasks and skill mix.";

  return { score, level, rationale };
}
