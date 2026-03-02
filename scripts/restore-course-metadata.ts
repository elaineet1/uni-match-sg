/**
 * Restore course metadata fields from data/courses.json without touching IGP/outcomes/intakes.
 *
 * Usage:
 * - npm run restore:metadata
 * - npm run restore:metadata -- --dry-run
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

interface CourseSeedRow {
  slug: string;
  faculty: string;
  description: string;
  officialUrl: string;
  tags: string[];
  typicalRoles: string[];
  aiRiskNote: string;
  aiRiskSources: string[];
  majors: string[];
  doubleDegrees: string[];
}

interface SeedData {
  courses: CourseSeedRow[];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const filePath = path.join(process.cwd(), "data", "courses.json");
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as SeedData;
  const prisma = new PrismaClient();

  let updated = 0;
  let missing = 0;

  try {
    for (const row of parsed.courses) {
      const existing = await prisma.course.findUnique({
        where: { slug: row.slug },
        select: { id: true },
      });
      if (!existing) {
        missing++;
        continue;
      }

      if (!dryRun) {
        await prisma.course.update({
          where: { slug: row.slug },
          data: {
            faculty: row.faculty,
            description: row.description,
            officialUrl: row.officialUrl,
            tags: JSON.stringify(row.tags ?? []),
            typicalRoles: JSON.stringify(row.typicalRoles ?? []),
            aiRiskNote: row.aiRiskNote ?? "",
            aiRiskSources: JSON.stringify(row.aiRiskSources ?? []),
            majors: JSON.stringify(row.majors ?? []),
            doubleDegrees: JSON.stringify(row.doubleDegrees ?? []),
          },
        });
      }
      updated++;
    }

    console.log(
      `${dryRun ? "Dry run" : "Restore"} complete. updated=${updated}, missing=${missing}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

