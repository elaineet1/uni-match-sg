"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { UNI_STYLE_QUESTIONS } from "@/lib/uni-style-quiz";

export default function UniStyleQuizPage() {
  const {
    uniStyleAnswers,
    uniStyleProfile,
    setUniStyleAnswer,
    computeUniStyleResult,
  } = useAppStore();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);

  const totalQuestions = UNI_STYLE_QUESTIONS.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  function getSelectedLetter(questionId: number): string | null {
    const answer = uniStyleAnswers.find((a) => a.questionId === questionId);
    return answer?.selectedLetter ?? null;
  }

  function handleSelect(letter: string) {
    const question = UNI_STYLE_QUESTIONS[currentQuestion];
    setUniStyleAnswer({
      questionId: question.id,
      selectedLetter: letter,
    });

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      computeUniStyleResult();
      setCompleted(true);
    }
  }

  function goBack() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  function restartQuiz() {
    setCurrentQuestion(0);
    setCompleted(false);
  }

  const profileLabels: Record<string, Record<string, string>> = {
    learningStyle: {
      seminar: "Small-group seminars and discussions",
      lecture: "Lecture-based learning",
      mixed: "A mix of both seminars and lectures",
    },
    teamworkLevel: {
      high: "Heavy teamwork and collaboration",
      medium: "Moderate teamwork, with some individual work",
      low: "Mostly individual work",
    },
    structurePreference: {
      structured: "Structured curriculum with clear pathways",
      flexible: "Flexible curriculum with room to explore",
    },
    careerFocus: {
      internships: "Strong industry internships and exposure",
      research: "Research opportunities and deep academic learning",
      balanced: "A balanced mix of industry and research",
    },
  };

  if (completed && uniStyleProfile) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link
            href="/riasec-quiz"
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            &larr; Back to RIASEC Quiz
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Your University Style Profile
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Based on your preferences, here is the learning environment that may
          suit you best. This will be used to fine-tune your recommendations.
        </p>

        <div className="mt-6 card space-y-4">
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Learning Format
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {profileLabels.learningStyle[uniStyleProfile.learningStyle]}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Teamwork Level
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {profileLabels.teamworkLevel[uniStyleProfile.teamworkLevel]}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Curriculum Structure
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {profileLabels.structurePreference[
                uniStyleProfile.structurePreference
              ]}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Career Focus
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {profileLabels.careerFocus[uniStyleProfile.careerFocus]}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500 italic">
          These are preference-based heuristics and are used for soft ranking
          adjustments only. They do not claim any facts about specific
          universities.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/recommendations" className="btn-primary">
            Next: View Recommendations
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

  const question = UNI_STYLE_QUESTIONS[currentQuestion];
  const selectedLetter = getSelectedLetter(question.id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/riasec-quiz"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          &larr; Back to RIASEC Quiz
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        University Style Quiz
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Answer 4 quick questions about your preferred learning style to help us
        match you with the right university environment.
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
    </div>
  );
}
