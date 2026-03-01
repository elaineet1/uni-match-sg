/**
 * Database helper functions for parsing JSON-stored arrays from SQLite.
 * SQLite doesn't support native arrays, so we store them as JSON strings.
 */

import type { InterestTag } from "./quiz-engine";
import type { CourseData } from "./reco/engine";

/** Safely parse a JSON string array, returning empty array on failure */
export function parseJsonArray<T = string>(json: string | null | undefined): T[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Transform a database course record (with includes) into CourseData for the engine */
export function toCourseData(dbCourse: {
  id: number;
  slug: string;
  name: string;
  faculty: string;
  officialUrl: string;
  tags: string;
  typicalRoles: string;
  aiRiskNote: string;
  university: { name: string };
  prerequisites: { requirementText: string }[];
  igps: { igp10Rp: number; igp90Rp: number; igp10Text: string; igp90Text: string }[];
  outcomes: {
    startingSalaryMedian: number | null;
    employmentRateFTPerm: number | null;
  }[];
}): CourseData {
  const latestIgp = dbCourse.igps[0];
  const latestOutcome = dbCourse.outcomes[0];

  return {
    id: dbCourse.id,
    slug: dbCourse.slug,
    name: dbCourse.name,
    universityName: dbCourse.university.name,
    faculty: dbCourse.faculty,
    tags: parseJsonArray<InterestTag>(dbCourse.tags),
    prerequisites: dbCourse.prerequisites.map((p) => p.requirementText),
    igp10Rp: latestIgp?.igp10Rp ?? 0,
    igp90Rp: latestIgp?.igp90Rp ?? 0,
    igp10Text: latestIgp?.igp10Text ?? "",
    igp90Text: latestIgp?.igp90Text ?? "",
    salaryMedian: latestOutcome?.startingSalaryMedian ?? null,
    employmentRateFTPerm: latestOutcome?.employmentRateFTPerm ?? null,
    officialUrl: dbCourse.officialUrl,
    typicalRoles: parseJsonArray(dbCourse.typicalRoles),
    aiRiskNote: dbCourse.aiRiskNote,
  };
}
