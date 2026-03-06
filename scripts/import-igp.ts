/**
 * Import IGP updates from a versioned JSON file.
 *
 * Usage:
 * - npm run import:igp
 * - npm run import:igp -- data/igp-2025.json
 * - npm run import:igp -- --dry-run
 *
 * Expected JSON format:
 * [
 *   {
 *     "slug": "smu-information-systems",
 *     "igpYear": 2025,
 *     "igp10Text": "BBC/C",
 *     "igp90Text": "AAA/B",
 *     "igpSources": ["https://..."]
 *   }
 * ]
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { igpGradeStringToRP } from "../src/lib/rp-calculator";
import { loadPreferredDatabaseUrl } from "./load-env";

interface IGPRow {
  slug: string;
  igpYear: number;
  igp10Text: string;
  igp90Text: string;
  igpSources?: string[];
}

function isGradeLike(value: string): boolean {
  return /^[A-US]{3}\/[A-US]$/.test(value);
}

async function main() {
  loadPreferredDatabaseUrl();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const inputPath = args.find((a) => !a.startsWith("--")) ?? "data/igp-2025.json";
  const filePath = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(filePath)) {
    console.error(`IGP file not found: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const data = JSON.parse(raw) as IGPRow[];
  if (!Array.isArray(data) || data.length === 0) {
    console.error("IGP file is empty or invalid JSON array.");
    process.exit(1);
  }

  const validationErrors: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const pos = `Row ${i + 1}`;
    if (!row.slug) validationErrors.push(`${pos}: missing slug`);
    if (!row.igpYear || Number.isNaN(Number(row.igpYear)))
      validationErrors.push(`${pos}: invalid igpYear`);
    if (!row.igp10Text || !isGradeLike(row.igp10Text))
      validationErrors.push(`${pos}: invalid igp10Text '${row.igp10Text}'`);
    if (!row.igp90Text || !isGradeLike(row.igp90Text))
      validationErrors.push(`${pos}: invalid igp90Text '${row.igp90Text}'`);
  }

  if (validationErrors.length > 0) {
    console.error("Validation errors:");
    for (const err of validationErrors) console.error(`- ${err}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(`Dry run OK. Parsed ${data.length} rows from ${inputPath}.`);
    console.log("Sample:", data.slice(0, 3));
    return;
  }

  const prisma = new PrismaClient();
  let updated = 0;
  let created = 0;
  let missingCourses = 0;
  const errors: string[] = [];

  try {
    for (const row of data) {
      const course = await prisma.course.findUnique({
        where: { slug: row.slug },
        select: { id: true },
      });

      if (!course) {
        missingCourses++;
        errors.push(`Course not found: ${row.slug}`);
        continue;
      }

      const igp10Rp = igpGradeStringToRP(row.igp10Text);
      const igp90Rp = igpGradeStringToRP(row.igp90Text);

      const existing = await prisma.iGP.findFirst({
        where: { courseId: course.id, intakeYear: row.igpYear },
        select: { id: true },
      });

      const payload = {
        igp10Text: row.igp10Text,
        igp90Text: row.igp90Text,
        igp10Rp,
        igp90Rp,
        sourceUrls: JSON.stringify(row.igpSources ?? []),
      };

      if (existing) {
        await prisma.iGP.update({
          where: { id: existing.id },
          data: payload,
        });
        updated++;
      } else {
        await prisma.iGP.create({
          data: {
            courseId: course.id,
            intakeYear: row.igpYear,
            ...payload,
          },
        });
        created++;
      }
    }

    await prisma.adminImportLog.create({
      data: {
        fileName: path.basename(inputPath),
        statsJson: JSON.stringify({
          total: data.length,
          updated,
          created,
          missingCourses,
          errors,
        }),
      },
    });

    console.log(
      `IGP import complete. total=${data.length}, updated=${updated}, created=${created}, missingCourses=${missingCourses}`
    );
    if (errors.length > 0) {
      console.log("Import warnings:");
      for (const e of errors) console.log(`- ${e}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
