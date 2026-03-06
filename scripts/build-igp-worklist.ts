/**
 * Build a Phase 2 IGP worklist for courses that do not yet have rows in data/igp-2025.json.
 *
 * Usage:
 * - npm run igp:worklist
 * - npm run igp:worklist -- --year 2025 --out data/igp-2025-worklist.json
 */

import * as fs from "fs";
import * as path from "path";

interface CatalogDraftRow {
  slug: string;
  name: string;
  universityName: string;
  faculty: string;
  officialUrl?: string;
}

interface IGPRow {
  slug: string;
  igpYear: number;
  igp10Text: string;
  igp90Text: string;
  igpSources?: string[];
}

interface WorklistRow {
  slug: string;
  name: string;
  universityName: string;
  faculty: string;
  officialUrl: string;
  igpYear: number;
  igp10Text: string;
  igp90Text: string;
  igpSources: string[];
  note: string;
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  const normalized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return JSON.parse(normalized) as T;
}

function getArgValue(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) return undefined;
  return args[index + 1];
}

function main() {
  const yearArg = getArgValue("--year");
  const outArg = getArgValue("--out");

  const igpYear = yearArg ? Number(yearArg) : 2025;
  if (!Number.isInteger(igpYear) || igpYear < 2000 || igpYear > 2100) {
    console.error(`Invalid --year value: '${yearArg}'`);
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const draftPath = path.join(repoRoot, "data", "catalog-draft.json");
  const igpPath = path.join(repoRoot, "data", "igp-2025.json");
  const outPath = outArg
    ? path.resolve(repoRoot, outArg)
    : path.join(repoRoot, "data", `igp-${igpYear}-worklist.json`);

  if (!fs.existsSync(draftPath)) {
    console.error(`Missing file: ${draftPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(igpPath)) {
    console.error(`Missing file: ${igpPath}`);
    process.exit(1);
  }

  const draft = readJsonFile<CatalogDraftRow[]>(draftPath);
  const existing = readJsonFile<IGPRow[]>(igpPath);
  const existingSlugs = new Set(existing.map((r) => r.slug));

  const worklist: WorklistRow[] = draft
    .filter((row) => !existingSlugs.has(row.slug))
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      universityName: row.universityName,
      faculty: row.faculty,
      officialUrl: row.officialUrl ?? "",
      igpYear,
      igp10Text: "",
      igp90Text: "",
      igpSources: [],
      note: "Fill igp10Text, igp90Text, igpSources from official university IGP source.",
    }));

  fs.writeFileSync(outPath, JSON.stringify(worklist, null, 2) + "\n", "utf8");

  const byUni = worklist.reduce<Record<string, number>>((acc, row) => {
    acc[row.universityName] = (acc[row.universityName] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${worklist.length} rows to ${path.relative(repoRoot, outPath)}`);
  console.log(`Breakdown: ${JSON.stringify(byUni)}`);
}

main();
