import * as fs from "fs";
import * as path from "path";

function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    // Remove surrounding single/double quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

/**
 * Prefer DATABASE_URL from .env.local, then fallback to .env, then existing process env.
 * This avoids local-script failures when .env points to localhost while .env.local has Railway URL.
 */
export function loadPreferredDatabaseUrl() {
  const cwd = process.cwd();
  const envLocalPath = path.join(cwd, ".env.local");
  const envPath = path.join(cwd, ".env");

  if (fs.existsSync(envLocalPath)) {
    const envLocal = parseEnvFile(envLocalPath);
    if (envLocal.DATABASE_URL) {
      process.env.DATABASE_URL = envLocal.DATABASE_URL;
      return;
    }
  }

  if (fs.existsSync(envPath)) {
    const env = parseEnvFile(envPath);
    if (env.DATABASE_URL && !process.env.DATABASE_URL) {
      process.env.DATABASE_URL = env.DATABASE_URL;
    }
  }
}
