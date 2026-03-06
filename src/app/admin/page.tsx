"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface ImportLogEntry {
  timestamp: string;
  message: string;
  type: "info" | "error" | "success";
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState<ImportLogEntry[]>([]);
  const [jsonInput, setJsonInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey, action: "validate" }),
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        const data = await res.json();
        setAuthError(data.error || "Invalid admin key");
      }
    } catch {
      setAuthError("Failed to validate admin key");
    }
  }

  function addLog(message: string, type: ImportLogEntry["type"] = "info") {
    setImportLog((prev) => [
      ...prev,
      { timestamp: new Date().toISOString(), message, type },
    ]);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    let data: unknown;

    if (file.name.endsWith(".json")) {
      try {
        data = JSON.parse(text);
      } catch {
        addLog("Invalid JSON file", "error");
        return;
      }
    } else if (file.name.endsWith(".csv")) {
      // CSV needs to be parsed on server or with a library
      addLog(
        "CSV upload detected. Converting to JSON format for import.",
        "info"
      );
      // Send raw CSV text to server for parsing
      await importData({ csvText: text, fileName: file.name });
      return;
    } else {
      addLog("Unsupported file type. Use JSON or CSV.", "error");
      return;
    }

    setJsonInput(JSON.stringify(data, null, 2));
    addLog(`File loaded: ${file.name}`, "info");
  }

  async function handleImportFromInput() {
    if (!jsonInput.trim()) {
      addLog("No data to import. Paste JSON or upload a file.", "error");
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(jsonInput);
    } catch {
      addLog("Invalid JSON in text area", "error");
      return;
    }

    await importData({ courses: data, fileName: "manual-input.json" });
  }

  async function importData(payload: Record<string, unknown>) {
    setImporting(true);
    addLog("Starting import...", "info");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminKey,
          action: "import",
          ...payload,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        addLog(
          `Import complete. ${result.stats?.coursesUpserted ?? 0} courses upserted.`,
          "success"
        );
        if (result.stats?.errors?.length > 0) {
          for (const err of result.stats.errors) {
            addLog(`Validation error: ${err}`, "error");
          }
        }
      } else {
        addLog(`Import failed: ${result.error}`, "error");
        if (Array.isArray(result.stats?.errors) && result.stats.errors.length > 0) {
          for (const err of result.stats.errors) {
            addLog(`Validation error: ${err}`, "error");
          }
        }
      }
    } catch (err) {
      addLog(
        `Import error: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setImporting(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md py-20">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Admin Access
        </h1>
        <form onSubmit={handleAuth} className="mt-8 card space-y-4">
          <div>
            <label
              htmlFor="admin-key"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Admin Key
            </label>
            <input
              id="admin-key"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="input-field"
              placeholder="Enter admin key"
              required
              autoFocus
            />
          </div>
          {authError && (
            <p className="text-sm text-red-600">{authError}</p>
          )}
          <button type="submit" className="btn-primary w-full">
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          &larr; Back to Home
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Upload CSV or JSON files to update course data, IGP, salary, and
        prerequisites.
      </p>

      {/* File upload */}
      <section className="mt-6 card">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Upload Data File
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileUpload}
            className="block text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </section>

      {/* JSON text area */}
      <section className="mt-4 card">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          JSON Data
        </h2>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="input-field font-mono text-xs"
          rows={12}
          placeholder='Paste JSON data here, or upload a file above. Expected format:&#10;[&#10;  {&#10;    "slug": "nus-cs",&#10;    "name": "Computer Science",&#10;    "universityName": "NUS",&#10;    ...&#10;  }&#10;]'
        />
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={handleImportFromInput}
            disabled={importing}
            className="btn-primary"
          >
            {importing ? "Importing..." : "Validate & Import"}
          </button>
          <button
            type="button"
            onClick={() => {
              setJsonInput("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </section>

      {/* Import log */}
      {importLog.length > 0 && (
        <section className="mt-6 card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Import Log
            </h2>
            <button
              type="button"
              onClick={() => setImportLog([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear log
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {importLog.map((entry, i) => (
              <div
                key={i}
                className={`text-xs font-mono py-1 px-2 rounded ${
                  entry.type === "error"
                    ? "bg-red-50 text-red-700"
                    : entry.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                <span className="text-gray-400">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>{" "}
                {entry.message}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
