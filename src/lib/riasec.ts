import type { InterestTag } from "./quiz-engine";

export type RiasecCode = "R" | "I" | "A" | "S" | "E" | "C";
export type RiasecProfile = Record<RiasecCode, number>;

const EMPTY_PROFILE: RiasecProfile = {
  R: 0,
  I: 0,
  A: 0,
  S: 0,
  E: 0,
  C: 0,
};

/**
 * Heuristic tag->RIASEC mapping for hybrid rollout.
 * This is an approximation layer, not a licensed/standardized instrument.
 */
const TAG_TO_RIASEC: Record<InterestTag, Partial<RiasecProfile>> = {
  computing_software: { I: 0.7, R: 0.3 },
  data_ai: { I: 0.9, C: 0.1 },
  engineering: { R: 0.7, I: 0.3 },
  business_management: { E: 0.7, C: 0.3 },
  finance_accounting: { C: 0.7, E: 0.2, I: 0.1 },
  economics_policy: { I: 0.5, E: 0.3, C: 0.2 },
  law_public_policy: { E: 0.4, S: 0.3, C: 0.3 },
  healthcare_biomedical: { S: 0.6, I: 0.4 },
  life_sciences_chemistry: { I: 0.8, R: 0.2 },
  design_creative_media: { A: 0.8, E: 0.2 },
  communications_marketing: { E: 0.5, A: 0.3, S: 0.2 },
  education_psychology: { S: 0.8, I: 0.2 },
  social_sciences: { S: 0.5, I: 0.4, E: 0.1 },
  humanities_languages: { A: 0.6, S: 0.3, E: 0.1 },
  entrepreneurship_product: { E: 0.7, A: 0.2, I: 0.1 },
  operations_logistics: { C: 0.6, E: 0.3, R: 0.1 },
};

function normalizeProfile(p: RiasecProfile): RiasecProfile {
  const sum = p.R + p.I + p.A + p.S + p.E + p.C;
  if (sum <= 0) return { ...EMPTY_PROFILE };
  return {
    R: p.R / sum,
    I: p.I / sum,
    A: p.A / sum,
    S: p.S / sum,
    E: p.E / sum,
    C: p.C / sum,
  };
}

function cosineSimilarity(a: RiasecProfile, b: RiasecProfile): number {
  const dot = a.R * b.R + a.I * b.I + a.A * b.A + a.S * b.S + a.E * b.E + a.C * b.C;
  const magA = Math.sqrt(a.R ** 2 + a.I ** 2 + a.A ** 2 + a.S ** 2 + a.E ** 2 + a.C ** 2);
  const magB = Math.sqrt(b.R ** 2 + b.I ** 2 + b.A ** 2 + b.S ** 2 + b.E ** 2 + b.C ** 2);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function deriveUserRiasecProfile(
  userTagPoints: Record<InterestTag, number>
): RiasecProfile {
  const profile: RiasecProfile = { ...EMPTY_PROFILE };

  for (const [tag, points] of Object.entries(userTagPoints) as [InterestTag, number][]) {
    if (!points || points <= 0) continue;
    const map = TAG_TO_RIASEC[tag];
    if (!map) continue;
    for (const code of Object.keys(map) as RiasecCode[]) {
      profile[code] += points * (map[code] ?? 0);
    }
  }

  return normalizeProfile(profile);
}

export function deriveCourseRiasecProfile(courseTags: InterestTag[]): RiasecProfile {
  const profile: RiasecProfile = { ...EMPTY_PROFILE };
  if (courseTags.length === 0) return profile;

  for (const tag of courseTags) {
    const map = TAG_TO_RIASEC[tag];
    if (!map) continue;
    for (const code of Object.keys(map) as RiasecCode[]) {
      profile[code] += map[code] ?? 0;
    }
  }

  return normalizeProfile(profile);
}

/**
 * Returns a 0..10 score for compatibility with existing fit-score range.
 */
export function computeRiasecFitScore(
  userTagPoints: Record<InterestTag, number>,
  courseTags: InterestTag[],
  userProfileOverride?: RiasecProfile
): number {
  const user = userProfileOverride ?? deriveUserRiasecProfile(userTagPoints);
  const course = deriveCourseRiasecProfile(courseTags);
  const similarity = cosineSimilarity(user, course); // 0..1
  return Math.round(similarity * 10 * 100) / 100;
}
