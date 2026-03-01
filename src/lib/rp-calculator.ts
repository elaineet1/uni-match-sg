/**
 * RP (Rank Points) / UAS (University Admission Score) Calculator
 * for Singapore A Level students under the 70-point system (AY2026 admissions).
 *
 * Core UAS: Best 3 H2 subjects + H1 GP = max 70 RP.
 * PW (Project Work) is Pass/Fail only and NOT counted in RP.
 *
 * Optional inclusions (rebasing):
 * - 4th content subject (H2 converted to H1 weight, or H1 as-is)
 * - Mother Tongue (H1 MTL)
 * These are ONLY included if they increase the final score.
 *
 * Rebasing formulas:
 * - With 4th subject only:   UAS = [(3×H2 + GP + 4th_H1_weight) / 80] × 70
 * - With MTL only:           UAS = [(3×H2 + GP + MTL_H1_weight) / 80] × 70
 * - With both 4th and MTL:   UAS = [(3×H2 + GP + 4th_H1_weight + MTL_H1_weight) / 90] × 70
 *
 * References:
 * - MOE/JC guidance on 70 RP core system and PW removal
 * - School ECG pages describing grade-to-RP mapping
 * - Official RP calculator references from JC/poly guidance sites
 */

// ----- Grade-to-points mapping (AY2026 70-point system) -----

export type Grade = "A" | "B" | "C" | "D" | "E" | "S" | "U";
export type SubjectLevel = "H2" | "H1";
export type PWResult = "Pass" | "Fail";

/** H2 grade points (max 20 per subject) */
export const H2_POINTS: Record<Grade, number> = {
  A: 20,
  B: 17.5,
  C: 15,
  D: 12.5,
  E: 10,
  S: 5,
  U: 0,
};

/** H1 grade points (max 10 per subject) */
export const H1_POINTS: Record<Grade, number> = {
  A: 10,
  B: 8.75,
  C: 7.5,
  D: 6.25,
  E: 5,
  S: 2.5,
  U: 0,
};

/** Convert an H2 grade to its H1-weight equivalent (halved). */
export function h2ToH1Weight(grade: Grade): number {
  return H2_POINTS[grade] / 2;
}

export interface SubjectEntry {
  name: string;
  level: SubjectLevel;
  grade: Grade;
}

export interface RPInput {
  /** All H2 subjects taken (3 or 4) */
  h2Subjects: SubjectEntry[];
  /** GP grade (H1 level) */
  gpGrade: Grade;
  /** Optional H1 content subject (not GP, not MTL) */
  h1ContentSubject?: SubjectEntry | null;
  /** Optional Mother Tongue grade (H1 MTL or O-level HMTL treated as H1) */
  mtlGrade?: Grade | null;
  /** PW result - only for display, not counted in RP */
  pwResult?: PWResult;
}

export interface SubjectBreakdown {
  name: string;
  level: SubjectLevel | "H1 (MTL)";
  grade: Grade;
  points: number;
  /** Points after any conversion (e.g. H2 → H1 weight for 4th subject) */
  effectivePoints: number;
  /** Whether this subject is counted in the final UAS */
  counted: boolean;
  /** Role in the calculation */
  role: "core_h2" | "gp" | "4th_content" | "mtl" | "excluded";
}

export interface RPResult {
  /** Core UAS: best 3 H2 + GP, out of 70 */
  coreUAS: number;
  /** Best UAS after optional boosts (rebasing), out of 70 */
  bestUAS: number;
  /** What optional subjects were included in bestUAS */
  bestUASIncludes: ("4th_content" | "mtl")[];
  /** Detailed breakdown of each subject */
  breakdown: SubjectBreakdown[];
  /** Raw sum used for core (before any rebasing) */
  coreRawSum: number;
  /** Raw sum used for best (before rebasing) */
  bestRawSum: number;
  /** Denominator used for rebasing (70, 80, or 90) */
  bestDenominator: number;
}

/**
 * Calculate UAS from A Level subject grades.
 *
 * Algorithm:
 * 1. Sort H2 subjects by points descending, pick best 3.
 * 2. Core UAS = sum(best 3 H2) + GP (H1 points). Max = 60 + 10 = 70.
 * 3. If 4th H2 exists, compute its H1-weight. If H1 content exists, use its H1 points.
 * 4. Compute rebased UAS for each combination and pick the best.
 */
export function calculateRP(input: RPInput): RPResult {
  const { h2Subjects, gpGrade, h1ContentSubject, mtlGrade } = input;

  // Validate: need at least 3 H2 subjects
  if (h2Subjects.length < 3) {
    throw new Error("At least 3 H2 subjects are required.");
  }

  // Compute H2 points and sort descending
  const h2WithPoints = h2Subjects
    .map((s) => ({ ...s, points: H2_POINTS[s.grade] }))
    .sort((a, b) => b.points - a.points);

  // Best 3 H2
  const best3H2 = h2WithPoints.slice(0, 3);
  const best3H2Sum = best3H2.reduce((sum, s) => sum + s.points, 0);

  // GP points (H1)
  const gpPoints = H1_POINTS[gpGrade];

  // Core UAS (no rebasing)
  const coreRawSum = best3H2Sum + gpPoints;
  const coreUAS = Math.min(coreRawSum, 70); // cap at 70

  // Determine the 4th content subject (if any)
  // Could be a 4th H2 (converted to H1 weight) or an H1 content subject
  let fourthSubjectPoints: number | null = null;
  let fourthSubjectEntry: SubjectBreakdown | null = null;

  if (h2WithPoints.length >= 4) {
    // 4th H2, convert to H1 weight
    const fourth = h2WithPoints[3];
    fourthSubjectPoints = h2ToH1Weight(fourth.grade);
    fourthSubjectEntry = {
      name: fourth.name,
      level: "H2",
      grade: fourth.grade,
      points: fourth.points,
      effectivePoints: fourthSubjectPoints,
      counted: false, // will be updated
      role: "4th_content",
    };
  } else if (h1ContentSubject) {
    // H1 content subject
    fourthSubjectPoints = H1_POINTS[h1ContentSubject.grade];
    fourthSubjectEntry = {
      name: h1ContentSubject.name,
      level: "H1",
      grade: h1ContentSubject.grade,
      points: fourthSubjectPoints,
      effectivePoints: fourthSubjectPoints,
      counted: false,
      role: "4th_content",
    };
  }

  // MTL points (H1 weight)
  let mtlPoints: number | null = null;
  if (mtlGrade) {
    mtlPoints = H1_POINTS[mtlGrade];
  }

  // Compute all possible UAS values and pick the best
  // Option A: Core only (no rebasing) = coreUAS
  let bestUAS = coreUAS;
  let bestIncludes: ("4th_content" | "mtl")[] = [];
  let bestRawSum = coreRawSum;
  let bestDenom = 70;

  // Option B: With 4th subject only → [(core + 4th) / 80] × 70
  if (fourthSubjectPoints !== null) {
    const rawSum = coreRawSum + fourthSubjectPoints;
    const rebased = (rawSum / 80) * 70;
    if (rebased > bestUAS) {
      bestUAS = rebased;
      bestIncludes = ["4th_content"];
      bestRawSum = rawSum;
      bestDenom = 80;
    }
  }

  // Option C: With MTL only → [(core + mtl) / 80] × 70
  if (mtlPoints !== null) {
    const rawSum = coreRawSum + mtlPoints;
    const rebased = (rawSum / 80) * 70;
    if (rebased > bestUAS) {
      bestUAS = rebased;
      bestIncludes = ["mtl"];
      bestRawSum = rawSum;
      bestDenom = 80;
    }
  }

  // Option D: With both 4th and MTL → [(core + 4th + mtl) / 90] × 70
  if (fourthSubjectPoints !== null && mtlPoints !== null) {
    const rawSum = coreRawSum + fourthSubjectPoints + mtlPoints;
    const rebased = (rawSum / 90) * 70;
    if (rebased > bestUAS) {
      bestUAS = rebased;
      bestIncludes = ["4th_content", "mtl"];
      bestRawSum = rawSum;
      bestDenom = 90;
    }
  }

  // Round to 2 decimal places
  bestUAS = Math.round(bestUAS * 100) / 100;

  // Build breakdown
  const breakdown: SubjectBreakdown[] = [];

  // Best 3 H2
  for (const s of best3H2) {
    breakdown.push({
      name: s.name,
      level: "H2",
      grade: s.grade,
      points: s.points,
      effectivePoints: s.points,
      counted: true,
      role: "core_h2",
    });
  }

  // GP
  breakdown.push({
    name: "General Paper",
    level: "H1",
    grade: gpGrade,
    points: gpPoints,
    effectivePoints: gpPoints,
    counted: true,
    role: "gp",
  });

  // 4th H2 that wasn't in best 3 (if exists but not used as 4th content)
  if (h2WithPoints.length >= 4 && fourthSubjectEntry) {
    fourthSubjectEntry.counted = bestIncludes.includes("4th_content");
    breakdown.push(fourthSubjectEntry);
  }

  // H1 content subject (if exists and wasn't the 4th H2)
  if (h1ContentSubject && h2WithPoints.length < 4) {
    const entry: SubjectBreakdown = {
      name: h1ContentSubject.name,
      level: "H1",
      grade: h1ContentSubject.grade,
      points: H1_POINTS[h1ContentSubject.grade],
      effectivePoints: H1_POINTS[h1ContentSubject.grade],
      counted: bestIncludes.includes("4th_content"),
      role: "4th_content",
    };
    breakdown.push(entry);
  }

  // Excluded H2 subjects (5th, 6th... unlikely but handle)
  for (let i = 4; i < h2WithPoints.length; i++) {
    breakdown.push({
      name: h2WithPoints[i].name,
      level: "H2",
      grade: h2WithPoints[i].grade,
      points: h2WithPoints[i].points,
      effectivePoints: 0,
      counted: false,
      role: "excluded",
    });
  }

  // MTL
  if (mtlGrade) {
    breakdown.push({
      name: "Mother Tongue",
      level: "H1 (MTL)",
      grade: mtlGrade,
      points: H1_POINTS[mtlGrade],
      effectivePoints: H1_POINTS[mtlGrade],
      counted: bestIncludes.includes("mtl"),
      role: "mtl",
    });
  }

  return {
    coreUAS,
    bestUAS,
    bestUASIncludes: bestIncludes,
    breakdown,
    coreRawSum,
    bestRawSum,
    bestDenominator: bestDenom,
  };
}

/**
 * Convert an IGP grade string like "AAA/A" to approximate RP.
 * Format: "H2H2H2/H1" where each char is a grade letter.
 * This is used to compute igp10Rp and igp90Rp from published grade profiles.
 *
 * The string format: 3 H2 grades + "/" + 1 H1 GP grade
 * e.g. "AAA/A" = 20+20+20+10 = 70
 *      "ABB/B" = 20+17.5+17.5+8.75 = 63.75
 */
export function igpGradeStringToRP(gradeString: string): number {
  if (!gradeString || gradeString === "-" || gradeString === "NA") return 0;

  const parts = gradeString.toUpperCase().split("/");
  if (parts.length !== 2) return 0;

  const h2Grades = parts[0].split("") as Grade[];
  const h1Grade = parts[1].trim() as Grade;

  if (h2Grades.length !== 3) return 0;

  let total = 0;
  for (const g of h2Grades) {
    if (!(g in H2_POINTS)) return 0;
    total += H2_POINTS[g];
  }
  if (!(h1Grade in H1_POINTS)) return 0;
  total += H1_POINTS[h1Grade];

  return total;
}
