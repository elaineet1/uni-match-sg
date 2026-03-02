"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  DEFAULT_FILTERS,
  generateRecommendations,
  type CourseData,
  type RecommendedCourse,
} from "@/lib/reco/engine";
import type { InterestTag } from "@/lib/quiz-engine";
import { computeAIRisk } from "@/lib/ai-risk";
import { RiskInfoTooltip } from "@/components/risk-info-tooltip";

function chanceBadgeClass(label: string) {
  switch (label) {
    case "High":
      return "badge-high";
    case "Medium":
      return "badge-medium";
    case "Low":
      return "badge-low";
    default:
      return "badge bg-gray-100 text-gray-800";
  }
}

function formatNumber(value: number | null, suffix = "") {
  if (value === null) return "N/A";
  return `${value.toLocaleString()}${suffix}`;
}

export default function ComparePage() {
  const {
    rpResult,
    quizResult,
    uniStyleProfile,
    h2Subjects,
    h1ContentSubject,
    portfolio,
    manualTagOverrides,
    selectedCourseSlugs,
    removeCompareCourse,
    clearCompareCourses,
  } = useAppStore();

  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const userRp = rpResult?.bestUAS ?? 0;
  const userH2Subjects = useMemo(
    () => h2Subjects.filter((s) => s.name.trim() !== "").map((s) => s.name),
    [h2Subjects]
  );
  const userH1Subjects = useMemo(
    () => (h1ContentSubject ? [h1ContentSubject.name] : []),
    [h1ContentSubject]
  );

  const tagPoints = useMemo(() => {
    const base = quizResult?.tagPoints ?? ({} as Record<InterestTag, number>);
    const merged = { ...base };
    for (const tag of manualTagOverrides) merged[tag] = (merged[tag] ?? 0) + 5;
    return merged;
  }, [quizResult, manualTagOverrides]);

  const preferences = useMemo(
    () =>
      quizResult?.preferences ?? {
        prefers_people_work: false,
        prefers_analytical_work: false,
        prefers_creative_work: false,
        avoid_heavy_math: false,
        avoid_heavy_coding: false,
        likes_structure_vs_exploration: "balanced" as const,
      },
    [quizResult]
  );

  const recommendationMap = useMemo(() => {
    if (courses.length === 0) return new Map<string, RecommendedCourse>();
    const recs = generateRecommendations({
      userRp,
      userH2Subjects,
      userH1Subjects,
      tagPoints,
      preferences,
      portfolio,
      uniStyleProfile,
      filters: { ...DEFAULT_FILTERS, reachLevel: "show_all" },
      courses,
      hidePrereqNotMet: false,
      prioritiseEligibility: false,
      openToCompetitive: true,
    });
    return new Map(recs.map((r) => [r.course.slug, r]));
  }, [
    courses,
    userRp,
    userH2Subjects,
    userH1Subjects,
    tagPoints,
    preferences,
    portfolio,
    uniStyleProfile,
  ]);

  const selected = useMemo(
    () =>
      selectedCourseSlugs
        .map((slug) => recommendationMap.get(slug))
        .filter((r): r is RecommendedCourse => Boolean(r)),
    [selectedCourseSlugs, recommendationMap]
  );

  if (loading) return <p className="text-sm text-gray-500">Loading comparison data...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Comparison</h1>
          <p className="text-sm text-gray-600">
            Selected {selected.length} / 5 courses. Select at least 3 for a full comparison.
          </p>
          <RiskInfoTooltip className="mt-1" />
        </div>
        <div className="flex gap-2">
          <Link href="/recommendations" className="btn-secondary">
            Back to Recommendations
          </Link>
          {selected.length > 0 && (
            <button type="button" onClick={clearCompareCourses} className="btn-secondary">
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {selected.length === 0 && (
        <div className="card">
          <p className="text-sm text-gray-700">
            No courses selected yet. Go to Recommendations and click "Add to Compare" on 3 to 5 courses.
          </p>
        </div>
      )}

      {selected.length > 0 && selected.length < 3 && (
        <div className="card mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Add at least {3 - selected.length} more course(s) for a better side-by-side summary.
          </p>
        </div>
      )}

      {selected.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-[900px] w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-10 w-44 border-b border-r bg-gray-50 p-3 text-left text-xs uppercase tracking-wide text-gray-500">
                  Field
                </th>
                {selected.map((rec) => (
                  <th key={rec.course.slug} className="border-b border-r p-3 text-left align-top">
                    <div className="text-xs text-gray-500">{rec.course.universityName}</div>
                    <div className="text-sm font-semibold text-gray-900">{rec.course.name}</div>
                    <div className="mt-1 text-xs text-gray-500">{rec.course.faculty}</div>
                    <button
                      type="button"
                      onClick={() => removeCompareCourse(rec.course.slug)}
                      className="mt-2 text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="sticky left-0 border-b border-r bg-white p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Admission Chance
                </td>
                {selected.map((rec) => (
                  <td key={rec.course.slug} className="border-b border-r p-3 text-sm text-gray-700">
                    <span className={chanceBadgeClass(rec.chanceLabel)}>
                      {rec.chanceLabel}
                    </span>
                    <div className="mt-2 text-xs text-gray-600">Tier {rec.eligibilityTier}</div>
                    <div className="text-xs text-gray-600">Prereqs: {rec.prereqStatus}</div>
                    {rec.abaRecommended && (
                      <div className="mt-1 text-xs font-medium text-violet-700">ABA recommended</div>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 border-b border-r bg-white p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  IGP
                </td>
                {selected.map((rec) => (
                  <td key={rec.course.slug} className="border-b border-r p-3 text-sm text-gray-700">
                    {rec.course.igp10Text && rec.course.igp90Text
                      ? `${rec.course.igp10Text} - ${rec.course.igp90Text}`
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 border-b border-r bg-white p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Median Salary
                </td>
                {selected.map((rec) => (
                  <td key={rec.course.slug} className="border-b border-r p-3 text-sm text-gray-700">
                    {rec.course.salaryMedian !== null
                      ? `$${formatNumber(rec.course.salaryMedian)}`
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 border-b border-r bg-white p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  FT Employment
                </td>
                {selected.map((rec) => (
                  <td key={rec.course.slug} className="border-b border-r p-3 text-sm text-gray-700">
                    {formatNumber(rec.course.employmentRateFTPerm, "%")}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 border-b border-r bg-white p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Typical Roles
                </td>
                {selected.map((rec) => (
                  <td key={rec.course.slug} className="border-b border-r p-3 text-sm text-gray-700">
                    {rec.course.typicalRoles.length > 0
                      ? rec.course.typicalRoles.slice(0, 5).join(", ")
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 border-b border-r bg-white p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Prerequisites
                </td>
                {selected.map((rec) => (
                  <td key={rec.course.slug} className="border-b border-r p-3 text-sm text-gray-700">
                    {rec.course.prerequisites.length > 0
                      ? rec.course.prerequisites.join("; ")
                      : "Not specified"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 border-b border-r bg-white p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  AI Risk
                </td>
                {selected.map((rec) => (
                  <td key={rec.course.slug} className="border-b border-r p-3 text-sm text-gray-700">
                    {(() => {
                      const risk = computeAIRisk(rec.course.tags, rec.course.typicalRoles);
                      return (
                        <>
                          <span
                            className={`badge ${
                              risk.level === "Low"
                                ? "bg-green-100 text-green-800"
                                : risk.level === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {risk.level} ({risk.score}/100)
                          </span>
                          <p className="mt-2 text-xs text-gray-600">{risk.rationale}</p>
                          {rec.course.aiRiskNote && (
                            <p className="mt-1 text-xs text-gray-500">
                              Course note: {rec.course.aiRiskNote}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 border-r bg-white p-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Official Link
                </td>
                {selected.map((rec) => (
                  <td key={rec.course.slug} className="border-r p-3 text-sm">
                    {rec.course.officialUrl ? (
                      <a
                        href={rec.course.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Course Page
                      </a>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">
        User RP: <span className="font-semibold">{userRp}</span>. Comparison is advisory and should be
        validated against official admissions and course pages.
      </p>
    </div>
  );
}
