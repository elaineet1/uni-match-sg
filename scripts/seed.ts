/**
 * Seed script: loads data from data/*.json into SQLite via Prisma.
 *
 * Usage: npm run seed
 *
 * This script:
 * 1. Reads universities.json and courses.json
 * 2. Upserts universities
 * 3. Upserts courses with all related data (prerequisites, IGP, outcomes, intakes)
 *
 * IMPORTANT: All data should be verified against official sources before production use.
 * Fields that need manual yearly updates:
 * - IGP data (updated yearly by universities after each admissions cycle)
 * - GES/salary data (updated yearly from Graduate Employment Survey)
 * - Intake sizes (may change yearly)
 * - Prerequisites (occasionally updated by universities)
 * Citations (sourceUrls) should point to the official page where data was sourced.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { loadPreferredDatabaseUrl } from "./load-env";

loadPreferredDatabaseUrl();
const prisma = new PrismaClient();

interface CourseJSON {
  slug: string;
  university: string;
  name: string;
  faculty: string;
  description: string;
  officialUrl: string;
  tags: string[];
  typicalRoles: string[];
  aiRiskNote: string;
  aiRiskSources: string[];
  majors: string[];
  doubleDegrees: string[];
  prerequisites: { requirementText: string; sourceUrls: string[] }[];
  igps: {
    intakeYear: number;
    igp10Text: string;
    igp90Text: string;
    igp10Rp: number;
    igp90Rp: number;
    sourceUrls: string[];
  }[];
  outcomes: {
    year: number;
    startingSalaryMedian: number | null;
    startingSalaryMean: number | null;
    employmentRateOverall: number | null;
    employmentRateFTPerm: number | null;
    sourceUrls: string[];
  }[];
  intakes: { year: number; intakeSize: number; sourceUrls: string[] }[];
}

interface UniJSON {
  name: string;
  fullName: string;
  websiteUrl: string;
}

async function main() {
  console.log("Seeding database...");

  const dataDir = path.join(process.cwd(), "data");

  // Load universities
  const uniData: UniJSON[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, "universities.json"), "utf-8")
  );

  for (const uni of uniData) {
    await prisma.university.upsert({
      where: { name: uni.name },
      update: { fullName: uni.fullName, websiteUrl: uni.websiteUrl },
      create: { name: uni.name, fullName: uni.fullName, websiteUrl: uni.websiteUrl },
    });
  }
  console.log(`Upserted ${uniData.length} universities.`);

  // Load courses
  const parsed = JSON.parse(
  fs.readFileSync(path.join(dataDir, "courses.json"), "utf-8")
);

const courseData: CourseJSON[] = parsed.courses;

  let courseCount = 0;
  for (const c of courseData) {
    const uni = await prisma.university.findUnique({
      where: { name: c.university },
    });
    if (!uni) {
      console.warn(`University '${c.university}' not found, skipping ${c.slug}`);
      continue;
    }

    // Upsert course
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        universityId: uni.id,
        name: c.name,
        faculty: c.faculty,
        description: c.description,
        officialUrl: c.officialUrl,
        tags: JSON.stringify(c.tags),
        typicalRoles: JSON.stringify(c.typicalRoles),
        aiRiskNote: c.aiRiskNote,
        aiRiskSources: JSON.stringify(c.aiRiskSources),
        majors: JSON.stringify(c.majors),
        doubleDegrees: JSON.stringify(c.doubleDegrees),
      },
      create: {
        slug: c.slug,
        universityId: uni.id,
        name: c.name,
        faculty: c.faculty,
        description: c.description,
        officialUrl: c.officialUrl,
        tags: JSON.stringify(c.tags),
        typicalRoles: JSON.stringify(c.typicalRoles),
        aiRiskNote: c.aiRiskNote,
        aiRiskSources: JSON.stringify(c.aiRiskSources),
        majors: JSON.stringify(c.majors),
        doubleDegrees: JSON.stringify(c.doubleDegrees),
      },
    });

    // Clear and re-add prerequisites
    await prisma.prerequisite.deleteMany({ where: { courseId: course.id } });
    for (const p of c.prerequisites) {
      await prisma.prerequisite.create({
        data: {
          courseId: course.id,
          requirementText: p.requirementText,
          sourceUrls: JSON.stringify(p.sourceUrls),
        },
      });
    }

    // Clear and re-add IGPs
    await prisma.iGP.deleteMany({ where: { courseId: course.id } });
    for (const igp of c.igps) {
      await prisma.iGP.create({
        data: {
          courseId: course.id,
          intakeYear: igp.intakeYear,
          igp10Text: igp.igp10Text,
          igp90Text: igp.igp90Text,
          igp10Rp: igp.igp10Rp,
          igp90Rp: igp.igp90Rp,
          sourceUrls: JSON.stringify(igp.sourceUrls),
        },
      });
    }

    // Clear and re-add outcomes
    await prisma.outcome.deleteMany({ where: { courseId: course.id } });
    for (const o of c.outcomes) {
      await prisma.outcome.create({
        data: {
          courseId: course.id,
          year: o.year,
          startingSalaryMedian: o.startingSalaryMedian,
          startingSalaryMean: o.startingSalaryMean,
          employmentRateOverall: o.employmentRateOverall,
          employmentRateFTPerm: o.employmentRateFTPerm,
          sourceUrls: JSON.stringify(o.sourceUrls),
        },
      });
    }

    // Clear and re-add intakes
    await prisma.intake.deleteMany({ where: { courseId: course.id } });
    for (const i of c.intakes) {
      await prisma.intake.create({
        data: {
          courseId: course.id,
          year: i.year,
          intakeSize: i.intakeSize,
          sourceUrls: JSON.stringify(i.sourceUrls),
        },
      });
    }

    courseCount++;
  }

  console.log(`Seeded ${courseCount} courses with related data.`);

  // Log import
  await prisma.adminImportLog.create({
    data: {
      fileName: "seed (courses.json + universities.json)",
      statsJson: JSON.stringify({
        universities: uniData.length,
        courses: courseCount,
      }),
    },
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
