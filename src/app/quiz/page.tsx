"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import {
  QUIZ_QUESTIONS,
  TAG_LABELS,
  INTEREST_TAGS,
  type InterestTag,
} from "@/lib/quiz-engine";

export default function QuizPage() {
  const {
    quizAnswers,
    quizResult,
    setQuizAnswer,
    computeQuizResult,
    manualTagOverrides,
    setManualTagOverrides,
  } = useAppStore();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);

  const totalQuestions = QUIZ_QUESTIONS.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  function handleSelect(letter: string) {
    const question = QUIZ_QUESTIONS[currentQuestion];
    setQuizAnswer({ questionId: question.id, selectedLetter: letter });
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      computeQuizResult();
      setCompleted(true);
    }
  }

  function getSelectedLetter(questionId: number): string | null {
    const answer = quizAnswers.find((a) => a.questionId === questionId);
    return answer?.selectedLetter ?? null;
  }

  function goBack() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  function toggleManualTag(tag: InterestTag) {
    if (manualTagOverrides.includes(tag)) {
      setManualTagOverrides(manualTagOverrides.filter((t) => t !== tag));
    } else {
      setManualTagOverrides([...manualTagOverrides, tag]);
    }
  }

  function restartQuiz() {
    setCurrentQuestion(0);
    setCompleted(false);
  }

  if (completed && quizResult) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link
            href="/results-input"
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            &larr; Back to Results
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Your Interest Profile
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Based on your quiz responses, here are your top interest areas.
        </p>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-800">
            Guidance only: this quiz uses rule-based scoring heuristics. It is
            not a psychological test, diagnosis, or a guaranteed predictor of
            course outcomes.
          </p>
        </div>

        {/* Top 5 tags */}
        <div className="mt-6 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Top 5 Interest Areas
          </h2>
          <div className="space-y-3">
            {quizResult.topTags.map((tag, index) => {
              const maxPoints = Math.max(
                ...Object.values(quizResult.tagPoints)
              );
              const pct =
                maxPoints > 0
                  ? (quizResult.tagPoints[tag] / maxPoints) * 100
                  : 0;
              return (
                <div key={tag}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800">
                      {index + 1}. {TAG_LABELS[tag]}
                    </span>
                    <span className="text-gray-500">
                      {quizResult.tagPoints[tag]} pts
                    </span>
                  </div>
                  <div className="progress-bar mt-1">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preferences */}
        <div className="mt-6 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Suggested Preference Flags
          </h2>
          <div className="flex flex-wrap gap-2">
            {quizResult.preferences.prefers_people_work && (
              <span className="badge bg-purple-100 text-purple-800">
                Prefers people work
              </span>
            )}
            {quizResult.preferences.prefers_analytical_work && (
              <span className="badge bg-indigo-100 text-indigo-800">
                Prefers analytical work
              </span>
            )}
            {quizResult.preferences.prefers_creative_work && (
              <span className="badge bg-pink-100 text-pink-800">
                Prefers creative work
              </span>
            )}
            {quizResult.preferences.avoid_heavy_coding && (
              <span className="badge bg-orange-100 text-orange-800">
                Prefers minimal coding
              </span>
            )}
            {quizResult.preferences.avoid_heavy_math && (
              <span className="badge bg-amber-100 text-amber-800">
                Prefers lighter math
              </span>
            )}
            <span className="badge bg-gray-100 text-gray-800">
              Style:{" "}
              {quizResult.preferences.likes_structure_vs_exploration ===
              "structure"
                ? "Structured"
                : quizResult.preferences.likes_structure_vs_exploration ===
                  "exploration"
                ? "Exploratory"
                : "Balanced"}
            </span>
          </div>
        </div>

        {/* Manual tag overrides */}
        <div className="mt-6 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Manual Overrides
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Add or remove interest tags to fine-tune your recommendations.
            These will be combined with your quiz results.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((tag) => {
              const isActive =
                manualTagOverrides.includes(tag) ||
                quizResult.topTags.includes(tag);
              const isManual = manualTagOverrides.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleManualTag(tag)}
                  className={`badge cursor-pointer transition-colors ${
                    isManual
                      ? "bg-blue-200 text-blue-900 ring-1 ring-blue-400"
                      : isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {TAG_LABELS[tag]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/riasec-quiz" className="btn-primary">
            Next: RIASEC Quiz
          </Link>
          <button
            type="button"
            onClick={restartQuiz}
            className="btn-secondary"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];
  const selectedLetter = getSelectedLetter(question.id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/results-input"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          &larr; Back to Results
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        Step 2: Interests Quiz
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Answer 12 questions to discover your interest areas and get better
        course recommendations.
      </p>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="mt-6 card">
        <h2 className="text-lg font-semibold text-gray-900">
          {question.question}
        </h2>
        <div className="mt-4 space-y-2" role="radiogroup" aria-label={question.question}>
          {question.options.map((option) => (
            <button
              key={option.letter}
              type="button"
              onClick={() => handleSelect(option.letter)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                selectedLetter === option.letter
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              role="radio"
              aria-checked={selectedLetter === option.letter}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                  selectedLetter === option.letter
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-gray-300 text-gray-500"
                }`}
              >
                {option.letter}
              </span>
              <span>{option.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentQuestion === 0}
          className="btn-secondary"
        >
          Previous
        </button>
        <span className="text-xs text-gray-400 self-center">
          Click an option to proceed
        </span>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/recommendations"
          className="text-xs text-blue-600 hover:underline"
        >
          Skip quizzes and choose interest tags manually
        </Link>
      </div>
    </div>
  );
}
