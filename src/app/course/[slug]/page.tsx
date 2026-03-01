import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TAG_LABELS, type InterestTag } from "@/lib/quiz-engine";

interface PageProps {
  params: { slug: string };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: {
      university: true,
      prerequisites: true,
      igps: { orderBy: { intakeYear: "desc" }, take: 1 },
      outcomes: { orderBy: { year: "desc" }, take: 1 },
      intakes: { orderBy: { year: "desc" }, take: 1 },
    },
  });

  if (!course) {
    notFound();
  }

  const tags: InterestTag[] = JSON.parse(course.tags || "[]");
  const typicalRoles: string[] = JSON.parse(course.typicalRoles || "[]");
  const aiRiskSources: string[] = JSON.parse(course.aiRiskSources || "[]");
  const majors: string[] = JSON.parse(course.majors || "[]");
  const doubleDegrees: string[] = JSON.parse(course.doubleDegrees || "[]");

  const latestIgp = course.igps[0] ?? null;
  const latestOutcome = course.outcomes[0] ?? null;
  const latestIntake = course.intakes[0] ?? null;

  // Collect all citation sources
  const prereqSources: string[] = [];
  for (const p of course.prerequisites) {
    const urls: string[] = JSON.parse(p.sourceUrls || "[]");
    prereqSources.push(...urls);
  }
  const igpSources: string[] = latestIgp
    ? JSON.parse(latestIgp.sourceUrls || "[]")
    : [];
  const outcomeSources: string[] = latestOutcome
    ? JSON.parse(latestOutcome.sourceUrls || "[]")
    : [];
  const intakeSources: string[] = latestIntake
    ? JSON.parse(latestIntake.sourceUrls || "[]")
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/recommendations"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          &larr; Back to Recommendations
        </Link>
      </div>

      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">
          {course.university.name} &middot; {course.faculty}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {course.name}
        </h1>
        {course.officialUrl && (
          <a
            href={course.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-blue-600 hover:underline"
          >
            Official course page
          </a>
        )}
      </div>

      {/* Description */}
      {course.description && (
        <section className="mt-6 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            About This Course
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {course.description}
          </p>
        </section>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <section className="mt-4 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Interest Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="badge bg-blue-100 text-blue-800"
              >
                {TAG_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Prerequisites */}
      <section className="mt-4 card">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">
          Prerequisites
        </h2>
        {course.prerequisites.length > 0 ? (
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {course.prerequisites.map((p) => (
              <li key={p.id}>{p.requirementText}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No specific prerequisites listed.
          </p>
        )}
        {prereqSources.length > 0 && (
          <SourceLinks label="Prerequisites sources" urls={prereqSources} />
        )}
      </section>

      {/* IGP */}
      <section className="mt-4 card">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">
          Indicative Grade Profile (IGP)
        </h2>
        {latestIgp ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">10th Percentile</p>
              <p className="text-lg font-semibold text-gray-900">
                {latestIgp.igp10Text || "N/A"}
              </p>
              <p className="text-xs text-gray-400">
                ({latestIgp.igp10Rp} RP)
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">90th Percentile</p>
              <p className="text-lg font-semibold text-gray-900">
                {latestIgp.igp90Text || "N/A"}
              </p>
              <p className="text-xs text-gray-400">
                ({latestIgp.igp90Rp} RP)
              </p>
            </div>
            <p className="col-span-2 text-xs text-gray-400">
              Intake year: {latestIgp.intakeYear}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No IGP data available.</p>
        )}
        {igpSources.length > 0 && (
          <SourceLinks label="IGP sources" urls={igpSources} />
        )}
      </section>

      {/* Employment & Salary */}
      <section className="mt-4 card">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">
          Graduate Employment & Salary
        </h2>
        {latestOutcome ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {latestOutcome.startingSalaryMedian !== null && (
              <div>
                <p className="text-xs text-gray-500">Median Salary</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${latestOutcome.startingSalaryMedian.toLocaleString()}
                </p>
              </div>
            )}
            {latestOutcome.startingSalaryMean !== null && (
              <div>
                <p className="text-xs text-gray-500">Mean Salary</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${latestOutcome.startingSalaryMean.toLocaleString()}
                </p>
              </div>
            )}
            {latestOutcome.employmentRateOverall !== null && (
              <div>
                <p className="text-xs text-gray-500">Overall Employment</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latestOutcome.employmentRateOverall}%
                </p>
              </div>
            )}
            {latestOutcome.employmentRateFTPerm !== null && (
              <div>
                <p className="text-xs text-gray-500">FT Permanent</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latestOutcome.employmentRateFTPerm}%
                </p>
              </div>
            )}
            <p className="col-span-2 sm:col-span-4 text-xs text-gray-400">
              GES year: {latestOutcome.year}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No employment outcome data available.
          </p>
        )}
        {outcomeSources.length > 0 && (
          <SourceLinks label="Outcome sources" urls={outcomeSources} />
        )}
      </section>

      {/* Intake */}
      {latestIntake && (
        <section className="mt-4 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Intake Size
          </h2>
          <p className="text-sm text-gray-700">
            {latestIntake.intakeSize} students ({latestIntake.year})
          </p>
          {intakeSources.length > 0 && (
            <SourceLinks label="Intake sources" urls={intakeSources} />
          )}
        </section>
      )}

      {/* Typical roles */}
      {typicalRoles.length > 0 && (
        <section className="mt-4 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Typical Roles After Graduation
          </h2>
          <div className="flex flex-wrap gap-2">
            {typicalRoles.map((role, i) => (
              <span
                key={i}
                className="badge bg-gray-100 text-gray-700"
              >
                {role}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Majors */}
      {majors.length > 0 && (
        <section className="mt-4 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Available Majors / Specialisations
          </h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {majors.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Double degrees */}
      {doubleDegrees.length > 0 && (
        <section className="mt-4 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Double Degree Options
          </h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {doubleDegrees.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </section>
      )}

      {/* AI Risk Note */}
      {course.aiRiskNote && (
        <section className="mt-4 card border-amber-200 bg-amber-50">
          <h2 className="text-sm font-semibold text-amber-900 mb-2">
            AI & Automation Note
          </h2>
          <p className="text-sm text-amber-800">{course.aiRiskNote}</p>
          {aiRiskSources.length > 0 && (
            <SourceLinks
              label="AI risk sources"
              urls={aiRiskSources}
            />
          )}
        </section>
      )}

      {/* Disclaimer */}
      <div className="mt-8 card border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 italic">
          These are estimates only. Please refer to official university
          websites for the most accurate and up-to-date admission, employment,
          and course information.
        </p>
      </div>
    </div>
  );
}

function SourceLinks({ label, urls }: { label: string; urls: string[] }) {
  const uniqueUrls = Array.from(new Set(urls));
  if (uniqueUrls.length === 0) return null;
  return (
    <div className="mt-3 border-t pt-2">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}:</p>
      <ul className="space-y-0.5">
        {uniqueUrls.map((url, i) => (
          <li key={i}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline break-all"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
