"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { RIASEC_LABELS, RIASEC_QUESTIONS, type RiasecAnswer } from "@/lib/riasec-quiz";
import type { RiasecCode } from "@/lib/riasec";

export default function RiasecQuizPage() {
  const {
    riasecAnswers,
    riasecResult,
    setRiasecAnswer,
    computeRiasecResult,
  } = useAppStore();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);

  const totalQuestions = RIASEC_QUESTIONS.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  function getSelectedLetter(questionId: number): string | null {
    const answer = riasecAnswers.find((a) => a.questionId === questionId);
    return answer?.selectedLetter ?? null;
  }

  function handleSelect(letter: string) {
    const question = RIASEC_QUESTIONS[currentQuestion];
    const answer: RiasecAnswer = { questionId: question.id, selectedLetter: letter };
    setRiasecAnswer(answer);

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      computeRiasecResult();
      setCompleted(true);
    }
  }

  function goBack() {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  }

  function restartQuiz() {
    setCurrentQuestion(0);
    setCompleted(false);
  }

  if (completed && riasecResult) {
    const topCodes = riasecResult.topCodes as RiasecCode[];
    const total = Object.values(riasecResult.profile).reduce((a, b) => a + b, 0) || 1;

    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link
            href="/quiz"
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            &larr; Back to Interests Quiz
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Your RIASEC Profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          This quick profile estimates your Holland-style interest pattern.
        </p>

        <div className="mt-6 card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top 3 Dimensions</h2>
          <div className="space-y-3">
            {topCodes.map((code, idx) => {
              const score = riasecResult.profile[code];
              const pct = Math.round((score / total) * 100);
              return (
                <div key={code}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800">
                      {idx + 1}. {RIASEC_LABELS[code]} ({code})
                    </span>
                    <span className="text-gray-500">{pct}%</span>
                  </div>
                  <div className="progress-bar mt-1">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500 italic">
          Guidance only. This is a simplified RIASEC-style profile used as one input for
          recommendation ranking.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/uni-style-quiz" className="btn-primary">
            Next: University Style Quiz
          </Link>
          <button type="button" onClick={restartQuiz} className="btn-secondary">
            Retake RIASEC Quiz
          </button>
        </div>
      </div>
    );
  }

  const question = RIASEC_QUESTIONS[currentQuestion];
  const selectedLetter = getSelectedLetter(question.id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/quiz" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          &larr; Back to Interests Quiz
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Step 2b: RIASEC Quiz</h1>
      <p className="mt-2 text-sm text-gray-600">
        Answer 6 quick questions to estimate your RIASEC interest profile.
      </p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-6 card">
        <h2 className="text-lg font-semibold text-gray-900">{question.question}</h2>
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

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentQuestion === 0}
          className="btn-secondary"
        >
          Previous
        </button>
        <span className="text-xs text-gray-400 self-center">Click an option to proceed</span>
      </div>
    </div>
  );
}

