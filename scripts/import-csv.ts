/**
 * CSV Import script: imports course data from a CSV file into the database.
 *
 * Usage: npm run import:csv -- path/to/file.csv
 *
 * Expected CSV columns (all optional except slug and university):
 * slug, university, name, faculty, description, officialUrl, tags (semicolon-separated),
 * typicalRoles (semicolon-separated), aiRiskNote,
 * prereqs (semicolon-separated), prereqSourceUrls (semicolon-separated),
 * igpYear, igp10Text, igp90Text, igp10Rp, igp90Rp, igpSourceUrls (semicolon-separated),
 * gesYear, salaryMedian, salaryMean, employmentRateOverall, employmentRateFTPerm, gesSourceUrls,
 * intakeYear, intakeSize
 *
 * Validation rules:
 * - slug and university are required
 * - Grade format for IGP text: 3 uppercase letters / 1 uppercase letter (e.g. "AAA/A")
 * - RP values must be 0-70
 * - Salary values must be positive numbers
 * - Employment rates must be 0-100
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import Papa from "papaparse";
import { loadPreferredDatabaseUrl } from "./load-env";

loadPreferredDatabaseUrl();
const prisma = new PrismaClient();

interface CSVRow {
  slug: string;
  university: string;
  name?: string;
  faculty?: string;
  description?: string;
  officialUrl?: string;
  tags?: string;
  typicalRoles?: string;
  aiRiskNote?: string;
  prereqs?: string;
  prereqSourceUrls?: string;
  igpYear?: string;
  igp10Text?: string;
  igp90Text?: string;
  igp10Rp?: string;
  igp90Rp?: string;
  igpSourceUrls?: string;
  gesYear?: string;
  salaryMedian?: string;
  salaryMean?: string;
  employmentRateOverall?: string;
  employmentRateFTPerm?: string;
  gesSourceUrls?: string;
  intakeYear?: string;
  intakeSize?: string;
}

function validateRow(row: CSVRow, index: number): string[] {
  const errors: string[] = [];
  if (!row.slug) errors.push(`Row ${index}: missing slug`);
  if (!row.university) errors.push(`Row ${index}: missing university`);

  if (row.igp10Text && !/^[A-U]{3}\/[A-U]$/.test(row.igp10Text)) {
    errors.push(`Row ${index}: invalid igp10Text format '${row.igp10Text}'`);
  }
  if (row.igp90Text && !/^[A-U]{3}\/[A-U]$/.test(row.igp90Text)) {
    errors.push(`Row ${index}: invalid igp90Text format '${row.igp90Text}'`);
  }

  const igp10Rp = parseFloat(row.igp10Rp || "0");
  const igp90Rp = parseFloat(row.igp90Rp || "0");
  if (igp10Rp < 0 || igp10Rp > 70) errors.push(`Row ${index}: igp10Rp out of range`);
  if (igp90Rp < 0 || igp90Rp > 70) errors.push(`Row ${index}: igp90Rp out of range`);

  const salary = parseFloat(row.salaryMedian || "0");
  if (row.salaryMedian && salary < 0) errors.push(`Row ${index}: negative salary`);

  const emp = parseFloat(row.employmentRateOverall || "0");
  if (row.employmentRateOverall && (emp < 0 || emp > 100))
    errors.push(`Row ${index}: employment rate out of range`);

  return errors;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npm run import:csv -- path/to/file.csv");
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.error("CSV parse errors:", parsed.errors);
    process.exit(1);
  }

  // Validate all rows first
  const allErrors: string[] = [];
  for (let i = 0; i < parsed.data.length; i++) {
    allErrors.push(...validateRow(parsed.data[i], i + 2));
  }

  if (allErrors.length > 0) {
    console.error("Validation errors:");
    allErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`Importing ${parsed.data.length} rows...`);

  let imported = 0;
  let skipped = 0;

  for (const row of parsed.data) {
    const uni = await prisma.university.findUnique({
      where: { name: row.university },
    });
    if (!uni) {
      console.warn(`University '${row.university}' not found, skipping ${row.slug}`);
      skipped++;
      continue;
    }

    const tags = row.tags ? row.tags.split(";").map((t) => t.trim()) : [];
    const typicalRoles = row.typicalRoles
      ? row.typicalRoles.split(";").map((r) => r.trim())
      : [];

    await prisma.course.upsert({
      where: { slug: row.slug },
      update: {
        ...(row.name && { name: row.name }),
        ...(row.faculty && { faculty: row.faculty }),
        ...(row.description && { description: row.description }),
        ...(row.officialUrl && { officialUrl: row.officialUrl }),
        ...(tags.length > 0 && { tags: JSON.stringify(tags) }),
        ...(typicalRoles.length > 0 && {
          typicalRoles: JSON.stringify(typicalRoles),
        }),
        ...(row.aiRiskNote && { aiRiskNote: row.aiRiskNote }),
      },
      create: {
        slug: row.slug,
        universityId: uni.id,
        name: row.name || row.slug,
        faculty: row.faculty || "",
        description: row.description || "",
        officialUrl: row.officialUrl || "",
        tags: JSON.stringify(tags),
        typicalRoles: JSON.stringify(typicalRoles),
        aiRiskNote: row.aiRiskNote || "",
      },
    });

    const course = await prisma.course.findUnique({
      where: { slug: row.slug },
    });
    if (!course) continue;

    // Prerequisites
    if (row.prereqs) {
      const prereqTexts = row.prereqs.split(";").map((p) => p.trim());
      const prereqUrls = row.prereqSourceUrls
        ? row.prereqSourceUrls.split(";").map((u) => u.trim())
        : [];

      await prisma.prerequisite.deleteMany({
        where: { courseId: course.id },
      });

      for (const text of prereqTexts) {
        await prisma.prerequisite.create({
          data: {
            courseId: course.id,
            requirementText: text,
            sourceUrls: JSON.stringify(prereqUrls),
          },
        });
      }
    }

    // IGP
    if (row.igpYear) {
      const year = parseInt(row.igpYear);
      await prisma.iGP.upsert({
        where: {
          id: (
            await prisma.iGP.findFirst({
              where: { courseId: course.id, intakeYear: year },
            })
          )?.id ?? -1,
        },
        update: {
          igp10Text: row.igp10Text || "",
          igp90Text: row.igp90Text || "",
          igp10Rp: parseFloat(row.igp10Rp || "0"),
          igp90Rp: parseFloat(row.igp90Rp || "0"),
          sourceUrls: JSON.stringify(
            row.igpSourceUrls
              ? row.igpSourceUrls.split(";").map((u) => u.trim())
              : []
          ),
        },
        create: {
          courseId: course.id,
          intakeYear: year,
          igp10Text: row.igp10Text || "",
          igp90Text: row.igp90Text || "",
          igp10Rp: parseFloat(row.igp10Rp || "0"),
          igp90Rp: parseFloat(row.igp90Rp || "0"),
          sourceUrls: JSON.stringify(
            row.igpSourceUrls
              ? row.igpSourceUrls.split(";").map((u) => u.trim())
              : []
          ),
        },
      });
    }

    // Outcomes
    if (row.gesYear) {
      const year = parseInt(row.gesYear);
      const existingOutcome = await prisma.outcome.findFirst({
        where: { courseId: course.id, year },
      });
      await prisma.outcome.upsert({
        where: { id: existingOutcome?.id ?? -1 },
        update: {
          startingSalaryMedian: row.salaryMedian
            ? parseFloat(row.salaryMedian)
            : null,
          startingSalaryMean: row.salaryMean
            ? parseFloat(row.salaryMean)
            : null,
          employmentRateOverall: row.employmentRateOverall
            ? parseFloat(row.employmentRateOverall)
            : null,
          employmentRateFTPerm: row.employmentRateFTPerm
            ? parseFloat(row.employmentRateFTPerm)
            : null,
          sourceUrls: JSON.stringify(
            row.gesSourceUrls
              ? row.gesSourceUrls.split(";").map((u) => u.trim())
              : []
          ),
        },
        create: {
          courseId: course.id,
          year,
          startingSalaryMedian: row.salaryMedian
            ? parseFloat(row.salaryMedian)
            : null,
          startingSalaryMean: row.salaryMean
            ? parseFloat(row.salaryMean)
            : null,
          employmentRateOverall: row.employmentRateOverall
            ? parseFloat(row.employmentRateOverall)
            : null,
          employmentRateFTPerm: row.employmentRateFTPerm
            ? parseFloat(row.employmentRateFTPerm)
            : null,
          sourceUrls: JSON.stringify(
            row.gesSourceUrls
              ? row.gesSourceUrls.split(";").map((u) => u.trim())
              : []
          ),
        },
      });
    }

    // Intakes
    if (row.intakeYear && row.intakeSize) {
      const year = parseInt(row.intakeYear);
      const existingIntake = await prisma.intake.findFirst({
        where: { courseId: course.id, year },
      });
      await prisma.intake.upsert({
        where: { id: existingIntake?.id ?? -1 },
        update: { intakeSize: parseInt(row.intakeSize) },
        create: {
          courseId: course.id,
          year,
          intakeSize: parseInt(row.intakeSize),
          sourceUrls: "[]",
        },
      });
    }

    imported++;
  }

  // Log import
  await prisma.adminImportLog.create({
    data: {
      fileName: csvPath,
      statsJson: JSON.stringify({ imported, skipped, total: parsed.data.length }),
    },
  });

  console.log(`Import complete: ${imported} imported, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
