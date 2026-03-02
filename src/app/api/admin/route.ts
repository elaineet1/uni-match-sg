import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { igpGradeStringToRP } from "@/lib/rp-calculator";

interface CourseImportRow {
  slug: string;
  name: string;
  universityName: string;
  universityFullName?: string;
  universityWebsite?: string;
  faculty: string;
  description?: string;
  officialUrl?: string;
  tags?: string[];
  typicalRoles?: string[];
  aiRiskNote?: string;
  aiRiskSources?: string[];
  majors?: string[];
  doubleDegrees?: string[];
  prerequisites?: string[];
  prereqSources?: string[];
  igpYear?: number;
  igp10Text?: string;
  igp90Text?: string;
  igpSources?: string[];
  outcomeYear?: number;
  salaryMedian?: number;
  salaryMean?: number;
  employmentRateOverall?: number;
  employmentRateFTPerm?: number;
  outcomeSources?: string[];
  intakeYear?: number;
  intakeSize?: number;
  intakeSources?: string[];
}

function validateAdminKey(key: string): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  return key === expected;
}

function validateCourseRow(
  row: CourseImportRow,
  index: number
): string[] {
  const errors: string[] = [];
  if (!row.slug) errors.push(`Row ${index}: missing slug`);
  if (!row.name) errors.push(`Row ${index}: missing name`);
  if (!row.universityName)
    errors.push(`Row ${index}: missing universityName`);
  if (!row.faculty) errors.push(`Row ${index}: missing faculty`);
  return errors;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminKey, action } = body;

    if (!validateAdminKey(adminKey)) {
      return NextResponse.json(
        { error: "Invalid admin key" },
        { status: 401 }
      );
    }

    // Validate-only action
    if (action === "validate") {
      return NextResponse.json({ ok: true });
    }

    // Import action
    if (action === "import") {
      let courses: CourseImportRow[] = body.courses;

      // Handle CSV text input — parse it into course rows
      if (!courses && body.csvText) {
        try {
          const lines = body.csvText.split("\n").filter((l: string) => l.trim());
          if (lines.length < 2) {
            return NextResponse.json(
              { error: "CSV must have a header row and at least one data row." },
              { status: 400 }
            );
          }
          const headers = lines[0].split(",").map((h: string) => h.trim());
          courses = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map((v: string) => v.trim());
            const row: Record<string, string> = {};
            headers.forEach((h: string, idx: number) => {
              row[h] = values[idx] ?? "";
            });
            courses.push({
              slug: row.slug || "",
              name: row.name || "",
              universityName: row.universityName || row.university || "",
              faculty: row.faculty || "",
              description: row.description,
              officialUrl: row.officialUrl,
              tags: row.tags ? row.tags.split(";").map((t: string) => t.trim()) : undefined,
              typicalRoles: row.typicalRoles ? row.typicalRoles.split(";").map((r: string) => r.trim()) : undefined,
              prerequisites: row.prerequisites ? row.prerequisites.split(";").map((p: string) => p.trim()) : undefined,
              igpYear: row.igpYear ? parseInt(row.igpYear) : undefined,
              igp10Text: row.igp10Text,
              igp90Text: row.igp90Text,
              outcomeYear: row.gesYear ? parseInt(row.gesYear) : undefined,
              salaryMedian: row.salaryMedian ? parseFloat(row.salaryMedian) : undefined,
              salaryMean: row.salaryMean ? parseFloat(row.salaryMean) : undefined,
              employmentRateOverall: row.employmentRateOverall ? parseFloat(row.employmentRateOverall) : undefined,
              employmentRateFTPerm: row.employmentRateFTPerm ? parseFloat(row.employmentRateFTPerm) : undefined,
            });
          }
        } catch {
          return NextResponse.json(
            { error: "Failed to parse CSV. Check formatting." },
            { status: 400 }
          );
        }
      }

      if (!Array.isArray(courses) || courses.length === 0) {
        return NextResponse.json(
          { error: "No courses data provided. Expected an array of courses or CSV text." },
          { status: 400 }
        );
      }

      // Validate all rows first
      const allErrors: string[] = [];
      for (let i = 0; i < courses.length; i++) {
        const rowErrors = validateCourseRow(courses[i], i);
        allErrors.push(...rowErrors);
      }

      if (allErrors.length > 0) {
        return NextResponse.json(
          {
            error: "Validation failed",
            stats: { errors: allErrors, coursesUpserted: 0 },
          },
          { status: 400 }
        );
      }

      // Upsert courses
      let upsertCount = 0;
      const importErrors: string[] = [];

      for (const row of courses) {
        try {
          // Upsert university
          const university = await prisma.university.upsert({
            where: { name: row.universityName },
            update: {
              fullName:
                row.universityFullName ?? row.universityName,
              websiteUrl: row.universityWebsite ?? "",
            },
            create: {
              name: row.universityName,
              fullName:
                row.universityFullName ?? row.universityName,
              websiteUrl: row.universityWebsite ?? "",
            },
          });

          // Upsert course
          const courseUpdateData: Record<string, unknown> = {
            name: row.name,
            universityId: university.id,
            faculty: row.faculty,
          };
          if (row.description !== undefined)
            courseUpdateData.description = row.description;
          if (row.officialUrl !== undefined)
            courseUpdateData.officialUrl = row.officialUrl;
          if (row.tags !== undefined)
            courseUpdateData.tags = JSON.stringify(row.tags);
          if (row.typicalRoles !== undefined)
            courseUpdateData.typicalRoles = JSON.stringify(row.typicalRoles);
          if (row.aiRiskNote !== undefined)
            courseUpdateData.aiRiskNote = row.aiRiskNote;
          if (row.aiRiskSources !== undefined)
            courseUpdateData.aiRiskSources = JSON.stringify(row.aiRiskSources);
          if (row.majors !== undefined)
            courseUpdateData.majors = JSON.stringify(row.majors);
          if (row.doubleDegrees !== undefined)
            courseUpdateData.doubleDegrees = JSON.stringify(row.doubleDegrees);

          const course = await prisma.course.upsert({
            where: { slug: row.slug },
            update: courseUpdateData,
            create: {
              slug: row.slug,
              name: row.name,
              universityId: university.id,
              faculty: row.faculty,
              description: row.description ?? "",
              officialUrl: row.officialUrl ?? "",
              tags: JSON.stringify(row.tags ?? []),
              typicalRoles: JSON.stringify(row.typicalRoles ?? []),
              aiRiskNote: row.aiRiskNote ?? "",
              aiRiskSources: JSON.stringify(row.aiRiskSources ?? []),
              majors: JSON.stringify(row.majors ?? []),
              doubleDegrees: JSON.stringify(row.doubleDegrees ?? []),
            },
          });

          // Prerequisites: delete old and recreate
          if (row.prerequisites && row.prerequisites.length > 0) {
            await prisma.prerequisite.deleteMany({
              where: { courseId: course.id },
            });
            for (const req of row.prerequisites) {
              await prisma.prerequisite.create({
                data: {
                  courseId: course.id,
                  requirementText: req,
                  sourceUrls: JSON.stringify(row.prereqSources ?? []),
                },
              });
            }
          }

          // IGP: upsert by course + year
          if (row.igpYear) {
            const igp10Rp = row.igp10Text
              ? igpGradeStringToRP(row.igp10Text)
              : 0;
            const igp90Rp = row.igp90Text
              ? igpGradeStringToRP(row.igp90Text)
              : 0;

            // Find existing IGP for this course+year
            const existingIgp = await prisma.iGP.findFirst({
              where: {
                courseId: course.id,
                intakeYear: row.igpYear,
              },
            });

            if (existingIgp) {
              await prisma.iGP.update({
                where: { id: existingIgp.id },
                data: {
                  igp10Text: row.igp10Text ?? "",
                  igp90Text: row.igp90Text ?? "",
                  igp10Rp,
                  igp90Rp,
                  sourceUrls: JSON.stringify(row.igpSources ?? []),
                },
              });
            } else {
              await prisma.iGP.create({
                data: {
                  courseId: course.id,
                  intakeYear: row.igpYear,
                  igp10Text: row.igp10Text ?? "",
                  igp90Text: row.igp90Text ?? "",
                  igp10Rp,
                  igp90Rp,
                  sourceUrls: JSON.stringify(row.igpSources ?? []),
                },
              });
            }
          }

          // Outcome: upsert by course + year
          if (row.outcomeYear) {
            const existingOutcome = await prisma.outcome.findFirst({
              where: {
                courseId: course.id,
                year: row.outcomeYear,
              },
            });

            const outcomeData = {
              startingSalaryMedian: row.salaryMedian ?? null,
              startingSalaryMean: row.salaryMean ?? null,
              employmentRateOverall: row.employmentRateOverall ?? null,
              employmentRateFTPerm: row.employmentRateFTPerm ?? null,
              sourceUrls: JSON.stringify(row.outcomeSources ?? []),
            };

            if (existingOutcome) {
              await prisma.outcome.update({
                where: { id: existingOutcome.id },
                data: outcomeData,
              });
            } else {
              await prisma.outcome.create({
                data: {
                  courseId: course.id,
                  year: row.outcomeYear,
                  ...outcomeData,
                },
              });
            }
          }

          // Intake: upsert by course + year
          if (row.intakeYear && row.intakeSize) {
            const existingIntake = await prisma.intake.findFirst({
              where: {
                courseId: course.id,
                year: row.intakeYear,
              },
            });

            if (existingIntake) {
              await prisma.intake.update({
                where: { id: existingIntake.id },
                data: {
                  intakeSize: row.intakeSize,
                  sourceUrls: JSON.stringify(row.intakeSources ?? []),
                },
              });
            } else {
              await prisma.intake.create({
                data: {
                  courseId: course.id,
                  year: row.intakeYear,
                  intakeSize: row.intakeSize,
                  sourceUrls: JSON.stringify(row.intakeSources ?? []),
                },
              });
            }
          }

          upsertCount++;
        } catch (err) {
          importErrors.push(
            `Failed to import "${row.slug}": ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        }
      }

      // Log the import
      await prisma.adminImportLog.create({
        data: {
          fileName: body.fileName ?? "api-import",
          statsJson: JSON.stringify({
            coursesUpserted: upsertCount,
            errors: importErrors,
            total: courses.length,
          }),
        },
      });

      return NextResponse.json({
        ok: true,
        stats: {
          coursesUpserted: upsertCount,
          total: courses.length,
          errors: importErrors,
        },
      });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
