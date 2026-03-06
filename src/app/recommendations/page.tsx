"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { CompareToggleButton } from "@/components/compare-toggle-button";
import {
  generateRecommendations,
  type CourseData,
  type FilterSettings,
  type RecommendedCourse,
} from "@/lib/reco/engine";
import { TIER_LABELS } from "@/lib/reco/config";
import { INTEREST_TAGS, TAG_LABELS, type InterestTag } from "@/lib/quiz-engine";

export default function RecommendationsPage() {
  const {
    rpResult,
    quizResult,
    riasecResult,
    uniStyleProfile,
    h2Subjects,
    h1ContentSubject,
    filters,
    setFilter,
    resetFilters,
    hidePrereqNotMet,
    setHidePrereqNotMet,
    prioritiseEligibility,
    setPrioritiseEligibility,
    openToCompetitive,
    setOpenToCompetitive,
    portfolio,
    manualTagOverrides,
    setManualTagOverrides,
    selectedCourseSlugs,
  } = useAppStore();

  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tier" | "reach">("tier");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load courses"
        );
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

  // Merge quiz tag points with manual overrides
  const tagPoints = useMemo(() => {
    const base = quizResult?.tagPoints ?? ({} as Record<InterestTag, number>);
    const merged = { ...base };
    for (const tag of manualTagOverrides) {
      merged[tag] = (merged[tag] ?? 0) + 5; // Boost manually added tags
    }
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

  const recommendations = useMemo(() => {
    if (courses.length === 0) return [];
    return generateRecommendations({
      userRp,
      userH2Subjects,
      userH1Subjects,
      tagPoints,
      preferences,
      portfolio,
      uniStyleProfile,
      riasecProfile: riasecResult?.profile ?? null,
      filters,
      courses,
      hidePrereqNotMet,
      prioritiseEligibility,
      openToCompetitive,
    });
  }, [
    courses,
    userRp,
    userH2Subjects,
    userH1Subjects,
    tagPoints,
    preferences,
    portfolio,
    uniStyleProfile,
    riasecResult,
    filters,
    hidePrereqNotMet,
    prioritiseEligibility,
    openToCompetitive,
  ]);

  const totalCourses = courses.length;
  const hiddenCourses = totalCourses - recommendations.length;
  const canOpenCompare = selectedCourseSlugs.length >= 3;

  // Group by tier or reach/match/safe
  const grouped = useMemo(() => {
    if (viewMode === "tier") {
      const tiers: Record<number, RecommendedCourse[]> = {};
      for (const rec of recommendations) {
        if (!tiers[rec.eligibilityTier]) tiers[rec.eligibilityTier] = [];
        tiers[rec.eligibilityTier].push(rec);
      }
      return Object.entries(tiers)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([tier, items]) => ({
          label: TIER_LABELS[Number(tier)] ?? `Tier ${tier}`,
          items,
        }));
    } else {
      const groups: Record<string, RecommendedCourse[]> = {
        Safe: [],
        Match: [],
        "Reach (close)": [],
        "Reach (far)": [],
      };
      for (const rec of recommendations) {
        groups[rec.reachMatchSafe].push(rec);
      }
      return Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([label, items]) => ({ label, items }));
    }
  }, [recommendations, viewMode]);

  // Check for coding + computing conflict
  const hasCodingComputingConflict =
    preferences.avoid_heavy_coding &&
    manualTagOverrides.includes("computing_software");
  const usingManualOnly = !quizResult && manualTagOverrides.length > 0;

  function toggleManualTag(tag: InterestTag) {
    if (manualTagOverrides.includes(tag)) {
      setManualTagOverrides(manualTagOverrides.filter((t) => t !== tag));
      return;
    }
    setManualTagOverrides([...manualTagOverrides, tag]);
  }

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

  function fitBadgeClass(label: string) {
    switch (label) {
      case "Strong fit":
        return "badge bg-green-100 text-green-800";
      case "Good fit":
        return "badge bg-blue-100 text-blue-800";
      default:
        return "badge bg-gray-100 text-gray-600";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card border-red-200 bg-red-50">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/uni-style-quiz"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          &larr; Back to Uni Style Quiz
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        Course Recommendations
      </h1>
      {rpResult && (
        <p className="mt-1 text-sm text-gray-600">
          Based on your UAS of {rpResult.bestUAS}/70 and interest profile.
        </p>
      )}
      {usingManualOnly && (
        <p className="mt-1 text-xs text-blue-700">
          You are currently using manual interest tags (quiz skipped).
        </p>
      )}

      <div className="mt-4 card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Interest Tags
          </h2>
          <button
            type="button"
            onClick={() => setManualTagOverrides([])}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear tags
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          If you skipped quizzes, choose tags here to drive recommendations.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTEREST_TAGS.map((tag) => {
            const isActive = manualTagOverrides.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleManualTag(tag)}
                className={`badge cursor-pointer transition-colors ${
                  isActive
                    ? "bg-blue-200 text-blue-900 ring-1 ring-blue-400"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conflict warning */}
      {hasCodingComputingConflict && (
        <div className="mt-4 card border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Note: You indicated you prefer minimal coding, but also added
            Computing & Software as an interest tag. Computing courses typically
            involve significant coding. Review your preferences if this is
            unintentional.
          </p>
        </div>
      )}

      {/* Filter panel */}
      <div className="mt-6 card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-blue-600 hover:underline"
          >
            Reset all
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Toggle filters */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.preferMinimalCoding}
              onChange={(e) =>
                setFilter("preferMinimalCoding", e.target.checked)
              }
              className="text-blue-600 focus:ring-blue-500"
            />
            Prefer minimal coding
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.preferLighterMath}
              onChange={(e) =>
                setFilter("preferLighterMath", e.target.checked)
              }
              className="text-blue-600 focus:ring-blue-500"
            />
            Prefer lighter math
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.preferPeopleFacing}
              onChange={(e) =>
                setFilter("preferPeopleFacing", e.target.checked)
              }
              className="text-blue-600 focus:ring-blue-500"
            />
            Prefer people-facing work
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.preferAnalytical}
              onChange={(e) =>
                setFilter("preferAnalytical", e.target.checked)
              }
              className="text-blue-600 focus:ring-blue-500"
            />
            Prefer analytical work
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.preferCreative}
              onChange={(e) =>
                setFilter("preferCreative", e.target.checked)
              }
              className="text-blue-600 focus:ring-blue-500"
            />
            Prefer creative work
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.higherSalary}
              onChange={(e) =>
                setFilter("higherSalary", e.target.checked)
              }
              className="text-blue-600 focus:ring-blue-500"
            />
            Prioritise higher salary
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.higherEmployment}
              onChange={(e) =>
                setFilter("higherEmployment", e.target.checked)
              }
              className="text-blue-600 focus:ring-blue-500"
            />
            Prioritise higher employment
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Reach level */}
          <div>
            <label
              htmlFor="reach-level"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Reach level
            </label>
            <select
              id="reach-level"
              value={filters.reachLevel}
              onChange={(e) =>
                setFilter(
                  "reachLevel",
                  e.target.value as FilterSettings["reachLevel"]
                )
              }
              className="select-field"
            >
              <option value="show_all">Show all</option>
              <option value="mostly_realistic">Mostly realistic</option>
              <option value="only_realistic">Only realistic</option>
            </select>
          </div>

          {/* Time to decide */}
          <div>
            <label
              htmlFor="time-to-decide"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Career clarity
            </label>
            <select
              id="time-to-decide"
              value={filters.timeToDecide}
              onChange={(e) =>
                setFilter(
                  "timeToDecide",
                  e.target.value as FilterSettings["timeToDecide"]
                )
              }
              className="select-field"
            >
              <option value="clear_path">Clear career path</option>
              <option value="balanced">Balanced</option>
              <option value="flexibility">Maximum flexibility</option>
            </select>
          </div>
        </div>

        {/* View toggles */}
        <div className="mt-4 flex flex-wrap gap-4 border-t pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hidePrereqNotMet}
              onChange={(e) => setHidePrereqNotMet(e.target.checked)}
              className="text-blue-600 focus:ring-blue-500"
            />
            Show only eligible
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prioritiseEligibility}
              onChange={(e) =>
                setPrioritiseEligibility(e.target.checked)
              }
              className="text-blue-600 focus:ring-blue-500"
            />
            Prioritise eligibility
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={openToCompetitive}
              onChange={(e) => setOpenToCompetitive(e.target.checked)}
              className="text-blue-600 focus:ring-blue-500"
            />
            Open to competitive
          </label>
        </div>

        {/* View mode toggle */}
        <div className="mt-4 flex gap-2 border-t pt-4">
          <button
            type="button"
            onClick={() => setViewMode("tier")}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              viewMode === "tier"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Group by Tier
          </button>
          <button
            type="button"
            onClick={() => setViewMode("reach")}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              viewMode === "reach"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Reach / Match / Safe
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="mt-4 text-sm text-gray-500">
        Showing {recommendations.length} courses
        {hiddenCourses > 0 && ` (${hiddenCourses} hidden)`}
      </p>

      <div className="mt-3 card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Compare selection:{" "}
          <span className="font-semibold text-gray-900">
            {selectedCourseSlugs.length}
          </span>{" "}
          / 5 courses (minimum 3 to compare)
        </p>
        <Link
          href="/compare"
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            canOpenCompare
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-100 text-gray-400"
          }`}
          aria-disabled={!canOpenCompare}
          onClick={(e) => {
            if (!canOpenCompare) e.preventDefault();
          }}
        >
          Open Comparison
        </Link>
      </div>

      {/* Course list grouped */}
      {recommendations.length === 0 ? (
        <div className="mt-6 card text-center">
          <p className="text-sm text-gray-500">
            No courses match your current filters. Try adjusting your filters
            or entering your results.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-8">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
                {group.label}{" "}
                <span className="font-normal text-gray-400">
                  ({group.items.length})
                </span>
              </h2>
              <div className="space-y-3">
                {group.items.map((rec) => (
                  <div
                    key={rec.course.id}
                    className="card transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <Link href={`/course/${rec.course.slug}`} className="flex-1">
                        <h3 className="font-semibold text-gray-900 hover:text-blue-700">
                          {rec.course.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {rec.course.universityName} &middot; {rec.course.faculty}
                        </p>
                        {rec.course.igp10Text && (
                          <p className="text-xs text-gray-400 mt-1">
                            IGP: {rec.course.igp10Text} &ndash; {rec.course.igp90Text}
                          </p>
                        )}
                      </Link>
                      <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end">
                        <span className={chanceBadgeClass(rec.chanceLabel)}>
                          {rec.chanceLabel} chance
                        </span>
                        <span className={fitBadgeClass(rec.fitLabel)}>
                          {rec.fitLabel}
                        </span>
                        {rec.prereqStatus === "met" && (
                          <span className="badge bg-green-100 text-green-800">
                            Prereqs met
                          </span>
                        )}
                        {rec.prereqStatus === "not_met" && (
                          <span className="badge bg-red-100 text-red-800">
                            Prereqs not met
                          </span>
                        )}
                        {rec.abaRecommended && (
                          <span className="badge bg-violet-100 text-violet-800">
                            ABA recommended
                          </span>
                        )}
                        <CompareToggleButton slug={rec.course.slug} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-gray-400 italic">
        Guidance only: recommendations are generated from your inputs using
        scoring heuristics and available data. They are not guarantees or
        official admissions decisions. Please refer to official university
        websites for the most accurate and up-to-date information.
      </p>
    </div>
  );
}
