/**
 * Import draft course catalog entries (phase 1 expansion).
 *
 * This script only CREATES missing courses and will not overwrite existing records.
 * Draft entries intentionally use empty tags so they are excluded from recommendations
 * until validated and enriched.
 *
 * Usage:
 * - npm run import:catalog:draft
 * - npm run import:catalog:draft -- --dry-run
 * - npm run import:catalog:draft -- data/catalog-draft.json
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { loadPreferredDatabaseUrl } from "./load-env";

interface DraftCourseRow {
  slug: string;
  name: string;
  universityName: string;
  faculty: string;
  officialUrl?: string;
}

function normalize(raw: string): string {
  return raw.replace(/^\uFEFF/, "");
}

async function main() {
  loadPreferredDatabaseUrl();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const inputPath =
    args.find((a) => !a.startsWith("--")) ?? "data/catalog-draft.json";

  const filePath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const parsed = JSON.parse(normalize(fs.readFileSync(filePath, "utf-8"))) as DraftCourseRow[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    console.error("Invalid draft catalog JSON: expected non-empty array");
    process.exit(1);
  }

  const validationErrors: string[] = [];
  parsed.forEach((row, idx) => {
    const n = idx + 1;
    if (!row.slug) validationErrors.push(`Row ${n}: missing slug`);
    if (!row.name) validationErrors.push(`Row ${n}: missing name`);
    if (!row.universityName) validationErrors.push(`Row ${n}: missing universityName`);
    if (!row.faculty) validationErrors.push(`Row ${n}: missing faculty`);
  });

  if (validationErrors.length > 0) {
    console.error("Validation errors:");
    validationErrors.forEach((e) => console.error(`- ${e}`));
    process.exit(1);
  }

  if (dryRun) {
    console.log(`Dry run OK. ${parsed.length} draft rows parsed from ${inputPath}.`);
    return;
  }

  const prisma = new PrismaClient();
  let created = 0;
  let skippedExisting = 0;
  let missingUni = 0;
  const errors: string[] = [];

  try {
    for (const row of parsed) {
      const uni = await prisma.university.findUnique({
        where: { name: row.universityName },
        select: { id: true },
      });

      if (!uni) {
        missingUni++;
        errors.push(`University not found for ${row.slug}: ${row.universityName}`);
        continue;
      }

      const existing = await prisma.course.findUnique({
        where: { slug: row.slug },
        select: { id: true },
      });

      if (existing) {
        skippedExisting++;
        continue;
      }

      await prisma.course.create({
        data: {
          slug: row.slug,
          name: row.name,
          universityId: uni.id,
          faculty: row.faculty,
          description: "",
          officialUrl: row.officialUrl ?? "",
          tags: JSON.stringify([]), // intentionally blank for draft phase
          typicalRoles: JSON.stringify([]),
          aiRiskNote: "",
          aiRiskSources: JSON.stringify([]),
          majors: JSON.stringify([]),
          doubleDegrees: JSON.stringify([]),
        },
      });
      created++;
    }

    await prisma.adminImportLog.create({
      data: {
        fileName: path.basename(inputPath),
        statsJson: JSON.stringify({
          total: parsed.length,
          created,
          skippedExisting,
          missingUni,
          errors,
        }),
      },
    });

    console.log(
      `Draft catalog import complete. created=${created}, skippedExisting=${skippedExisting}, missingUni=${missingUni}`
    );
    if (errors.length > 0) {
      console.log("Warnings:");
      errors.forEach((e) => console.log(`- ${e}`));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
