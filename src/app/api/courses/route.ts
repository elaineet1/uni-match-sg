import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CourseData } from "@/lib/reco/engine";
import type { InterestTag } from "@/lib/quiz-engine";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        university: true,
        prerequisites: true,
        igps: { orderBy: { intakeYear: "desc" }, take: 1 },
        outcomes: { orderBy: { year: "desc" }, take: 1 },
        intakes: { orderBy: { year: "desc" }, take: 1 },
      },
    });

    const data: CourseData[] = courses.map((course) => {
      const latestIgp = course.igps[0] ?? null;
      const latestOutcome = course.outcomes[0] ?? null;
      const tags: InterestTag[] = JSON.parse(course.tags || "[]");
      const typicalRoles: string[] = JSON.parse(course.typicalRoles || "[]");

      return {
        id: course.id,
        slug: course.slug,
        name: course.name,
        universityName: course.university.name,
        faculty: course.faculty,
        tags,
        prerequisites: course.prerequisites.map((p) => p.requirementText),
        igp10Rp: latestIgp?.igp10Rp ?? 0,
        igp90Rp: latestIgp?.igp90Rp ?? 0,
        igp10Text: latestIgp?.igp10Text ?? "",
        igp90Text: latestIgp?.igp90Text ?? "",
        salaryMedian: latestOutcome?.startingSalaryMedian ?? null,
        employmentRateFTPerm: latestOutcome?.employmentRateFTPerm ?? null,
        officialUrl: course.officialUrl,
        typicalRoles,
        aiRiskNote: course.aiRiskNote,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
