"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import type { Grade, SubjectEntry } from "@/lib/rp-calculator";

const GRADES: Grade[] = ["A", "B", "C", "D", "E", "S", "U"];

const H2_SUBJECT_OPTIONS = [
  "Mathematics",
  "Further Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "History",
  "Geography",
  "Literature in English",
  "Art",
  "Music",
  "Computing",
  "China Studies in English",
  "Theatre Studies and Drama",
  "Knowledge and Inquiry",
  "Malay Language and Literature",
  "Chinese Language and Literature",
  "Tamil Language and Literature",
];

export default function ResultsInputPage() {
  const {
    h2Subjects,
    gpGrade,
    h1ContentSubject,
    mtlGrade,
    pwResult,
    rpResult,
    setH2Subjects,
    setGPGrade,
    setH1ContentSubject,
    setMTLGrade,
    setPWResult,
    computeRP,
  } = useAppStore();

  const [numH2, setNumH2] = useState<3 | 4>(
    h2Subjects.length >= 4 ? 4 : 3
  );
  const [showH1, setShowH1] = useState(h1ContentSubject !== null);
  const [showMTL, setShowMTL] = useState(mtlGrade !== null);
  const [computed, setComputed] = useState(false);
  const [copiedFreshLink, setCopiedFreshLink] = useState(false);

  function handleNumH2Change(count: 3 | 4) {
    setNumH2(count);
    if (count === 4 && h2Subjects.length < 4) {
      setH2Subjects([
        ...h2Subjects,
        { name: "", level: "H2", grade: "A" },
      ]);
    } else if (count === 3 && h2Subjects.length > 3) {
      setH2Subjects(h2Subjects.slice(0, 3));
    }
  }

  function updateH2Subject(index: number, field: "name" | "grade", value: string) {
    const updated = [...h2Subjects];
    if (field === "name") {
      updated[index] = { ...updated[index], name: value };
    } else {
      updated[index] = { ...updated[index], grade: value as Grade };
    }
    setH2Subjects(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    computeRP();
    setComputed(true);
  }

  async function copyFreshLink() {
    const url = `${window.location.origin}/results-input?reset=1`;
    await navigator.clipboard.writeText(url);
    setCopiedFreshLink(true);
    setTimeout(() => setCopiedFreshLink(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          &larr; Back to Home
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        Step 1: Enter Your A Level Results
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Enter your subjects and grades to calculate your UAS (University
        Admission Score) on the 70-point scale.
      </p>
      <div className="mt-3">
        <button type="button" onClick={copyFreshLink} className="btn-secondary">
          {copiedFreshLink ? "Fresh Link Copied" : "Copy Fresh Link"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* H2 Subject Count */}
        <fieldset className="card">
          <legend className="text-sm font-semibold text-gray-900">
            How many H2 subjects did you take?
          </legend>
          <div className="mt-3 flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="numH2"
                value={3}
                checked={numH2 === 3}
                onChange={() => handleNumH2Change(3)}
                className="text-blue-600 focus:ring-blue-500"
              />
              3 H2 subjects
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="numH2"
                value={4}
                checked={numH2 === 4}
                onChange={() => handleNumH2Change(4)}
                className="text-blue-600 focus:ring-blue-500"
              />
              4 H2 subjects
            </label>
          </div>
        </fieldset>

        {/* H2 Subjects */}
        <fieldset className="card space-y-4">
          <legend className="text-sm font-semibold text-gray-900">
            H2 Subjects
          </legend>
          {h2Subjects.slice(0, numH2).map((subject, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <div>
                <label
                  htmlFor={`h2-name-${index}`}
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  H2 Subject {index + 1}
                </label>
                <select
                  id={`h2-name-${index}`}
                  value={subject.name}
                  onChange={(e) =>
                    updateH2Subject(index, "name", e.target.value)
                  }
                  className="select-field"
                  required
                >
                  <option value="">Select subject</option>
                  {H2_SUBJECT_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor={`h2-grade-${index}`}
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Grade
                </label>
                <select
                  id={`h2-grade-${index}`}
                  value={subject.grade}
                  onChange={(e) =>
                    updateH2Subject(index, "grade", e.target.value)
                  }
                  className="select-field"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </fieldset>

        {/* GP Grade */}
        <fieldset className="card">
          <legend className="text-sm font-semibold text-gray-900">
            General Paper (GP) Grade
          </legend>
          <div className="mt-3">
            <select
              id="gp-grade"
              value={gpGrade}
              onChange={(e) => setGPGrade(e.target.value as Grade)}
              className="select-field max-w-xs"
              aria-label="GP Grade"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* Optional: H1 Content Subject */}
        <fieldset className="card">
          <legend className="text-sm font-semibold text-gray-900">
            H1 Content Subject (optional)
          </legend>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showH1}
              onChange={(e) => {
                setShowH1(e.target.checked);
                if (!e.target.checked) setH1ContentSubject(null);
              }}
              className="text-blue-600 focus:ring-blue-500"
            />
            I took an additional H1 content subject
          </label>
          {showH1 && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="h1-name"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Subject Name
                </label>
                <select
                  id="h1-name"
                  value={h1ContentSubject?.name ?? ""}
                  onChange={(e) =>
                    setH1ContentSubject({
                      name: e.target.value,
                      level: "H1",
                      grade: h1ContentSubject?.grade ?? "A",
                    } as SubjectEntry)
                  }
                  className="select-field"
                >
                  <option value="">Select subject</option>
                  {H2_SUBJECT_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="h1-grade"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Grade
                </label>
                <select
                  id="h1-grade"
                  value={h1ContentSubject?.grade ?? "A"}
                  onChange={(e) =>
                    setH1ContentSubject({
                      name: h1ContentSubject?.name ?? "",
                      level: "H1",
                      grade: e.target.value as Grade,
                    } as SubjectEntry)
                  }
                  className="select-field"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </fieldset>

        {/* Optional: MTL */}
        <fieldset className="card">
          <legend className="text-sm font-semibold text-gray-900">
            Mother Tongue Language (optional)
          </legend>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showMTL}
              onChange={(e) => {
                setShowMTL(e.target.checked);
                if (!e.target.checked) setMTLGrade(null);
              }}
              className="text-blue-600 focus:ring-blue-500"
            />
            I took Mother Tongue
          </label>
          {showMTL && (
            <div className="mt-4">
              <label
                htmlFor="mtl-grade"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                MTL Grade
              </label>
              <select
                id="mtl-grade"
                value={mtlGrade ?? "A"}
                onChange={(e) => setMTLGrade(e.target.value as Grade)}
                className="select-field max-w-xs"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}
        </fieldset>

        {/* PW */}
        <fieldset className="card">
          <legend className="text-sm font-semibold text-gray-900">
            Project Work (PW)
          </legend>
          <div className="mt-3 flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="pw"
                value="Pass"
                checked={pwResult === "Pass"}
                onChange={() => setPWResult("Pass")}
                className="text-blue-600 focus:ring-blue-500"
              />
              Pass
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="pw"
                value="Fail"
                checked={pwResult === "Fail"}
                onChange={() => setPWResult("Fail")}
                className="text-blue-600 focus:ring-blue-500"
              />
              Fail
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            PW is Pass/Fail and is not counted in the UAS calculation.
          </p>
        </fieldset>

        <button type="submit" className="btn-primary w-full sm:w-auto">
          Calculate UAS
        </button>
      </form>

      {/* Results */}
      {computed && rpResult && (
        <section className="mt-10 space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900">
              Your UAS Results
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800">
                  Core UAS (3 best H2 + GP)
                </p>
                <p className="mt-1 text-3xl font-bold text-blue-900">
                  {rpResult.coreUAS}
                  <span className="text-base font-normal text-blue-600">
                    {" "}
                    / 70
                  </span>
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">
                  Best UAS (with optional subjects)
                </p>
                <p className="mt-1 text-3xl font-bold text-green-900">
                  {rpResult.bestUAS}
                  <span className="text-base font-normal text-green-600">
                    {" "}
                    / 70
                  </span>
                </p>
                {rpResult.bestUASIncludes.length > 0 && (
                  <p className="mt-1 text-xs text-green-700">
                    Includes:{" "}
                    {rpResult.bestUASIncludes
                      .map((i) =>
                        i === "4th_content"
                          ? "4th content subject"
                          : "Mother Tongue"
                      )
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="card overflow-x-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Subject Breakdown
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-4">Subject</th>
                  <th className="pb-2 pr-4">Level</th>
                  <th className="pb-2 pr-4">Grade</th>
                  <th className="pb-2 pr-4">Points</th>
                  <th className="pb-2 pr-4">Effective</th>
                  <th className="pb-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {rpResult.breakdown.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b last:border-0 ${
                      !row.counted ? "text-gray-400" : ""
                    }`}
                  >
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4">{row.level}</td>
                    <td className="py-2 pr-4">{row.grade}</td>
                    <td className="py-2 pr-4">{row.points}</td>
                    <td className="py-2 pr-4">{row.effectivePoints}</td>
                    <td className="py-2">
                      <span
                        className={`badge ${
                          row.counted
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {row.role === "core_h2"
                          ? "Core H2"
                          : row.role === "gp"
                          ? "GP"
                          : row.role === "4th_content"
                          ? "4th Content"
                          : row.role === "mtl"
                          ? "MTL"
                          : "Excluded"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 italic">
            Note: PW is Pass/Fail and not counted in the UAS. The system uses the
            best combination of subjects to maximise your score via rebasing.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/quiz" className="btn-primary">
              Next: Take the Interests Quiz
            </Link>
            <Link
              href="/recommendations"
              className="inline-flex items-center justify-center rounded-lg border-2 border-blue-600 bg-white px-6 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              Skip Quizzes: Choose Interest Tags Manually
            </Link>
          </div>
        </section>
      )}

      {computed && !rpResult && (
        <div className="mt-8 card border-red-200 bg-red-50">
          <p className="text-sm text-red-800">
            Could not calculate UAS. Please make sure you have selected at
            least 3 H2 subjects with valid names.
          </p>
        </div>
      )}
    </div>
  );
}
