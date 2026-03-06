/**
 * Build an import-ready IGP file from:
 * - data/igp-2025.json (baseline)
 * - data/igp-2025-worklist.json (phase 2 rows, partially filled)
 *
 * Only rows with valid igp10Text/igp90Text are included from the worklist.
 *
 * Usage:
 * - npm run igp:build:import
 * - npm run igp:build:import -- --out data/igp-2025-import.json
 */

import * as fs from "fs";
import * as path from "path";

interface IGPImportRow {
  slug: string;
  igpYear: number;
  igp10Text: string;
  igp90Text: string;
  igpSources?: string[];
}

interface WorklistRow extends IGPImportRow {
  note?: string;
  name?: string;
  universityName?: string;
  faculty?: string;
  officialUrl?: string;
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

function isGradeLike(text: string): boolean {
  return /^[A-U]{3}\/[A-U]$/.test((text || "").trim().toUpperCase());
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const basePath = path.join(repoRoot, "data", "igp-2025.json");
  const worklistPath = path.join(repoRoot, "data", "igp-2025-worklist.json");
  const outArg = getArgValue("--out");
  const outPath = outArg
    ? path.resolve(repoRoot, outArg)
    : path.join(repoRoot, "data", "igp-2025-import-ready.json");

  if (!fs.existsSync(basePath)) {
    console.error(`Missing file: ${basePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(worklistPath)) {
    console.error(`Missing file: ${worklistPath}`);
    process.exit(1);
  }

  const baseRows = readJsonFile<IGPImportRow[]>(basePath);
  const worklistRows = readJsonFile<WorklistRow[]>(worklistPath);

  const completedRows: IGPImportRow[] = [];
  let skippedIncomplete = 0;

  for (const row of worklistRows) {
    const igp10Text = (row.igp10Text ?? "").trim().toUpperCase();
    const igp90Text = (row.igp90Text ?? "").trim().toUpperCase();

    if (!isGradeLike(igp10Text) || !isGradeLike(igp90Text)) {
      skippedIncomplete++;
      continue;
    }

    completedRows.push({
      slug: row.slug,
      igpYear: row.igpYear,
      igp10Text,
      igp90Text,
      igpSources: Array.isArray(row.igpSources) ? row.igpSources : [],
    });
  }

  const combined = [...baseRows, ...completedRows];
  fs.writeFileSync(outPath, JSON.stringify(combined, null, 2) + "\n", "utf8");

  console.log(`Wrote ${combined.length} rows to ${path.relative(repoRoot, outPath)}`);
  console.log(
    `Base=${baseRows.length}, addedFromWorklist=${completedRows.length}, skippedIncomplete=${skippedIncomplete}`
  );
}

main();
