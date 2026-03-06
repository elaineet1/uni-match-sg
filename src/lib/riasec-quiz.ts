import type { RiasecCode, RiasecProfile } from "./riasec";

export interface RiasecOption {
  letter: string;
  text: string;
  code: RiasecCode;
}

export interface RiasecQuestion {
  id: number;
  question: string;
  options: RiasecOption[];
}

export interface RiasecAnswer {
  questionId: number;
  selectedLetter: string;
}

export interface RiasecQuizResult {
  profile: RiasecProfile;
  topCodes: RiasecCode[];
}

const EMPTY_PROFILE: RiasecProfile = {
  R: 0,
  I: 0,
  A: 0,
  S: 0,
  E: 0,
  C: 0,
};

export const RIASEC_LABELS: Record<RiasecCode, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

export const RIASEC_QUESTIONS: RiasecQuestion[] = [
  {
    id: 1,
    question: "Which activity sounds most engaging?",
    options: [
      { letter: "A", text: "Build or repair something hands-on", code: "R" },
      { letter: "B", text: "Investigate data or scientific problems", code: "I" },
      { letter: "C", text: "Design creative content or visuals", code: "A" },
    ],
  },
  {
    id: 2,
    question: "In a team, your natural role is:",
    options: [
      { letter: "A", text: "Guide and support others", code: "S" },
      { letter: "B", text: "Lead and persuade people", code: "E" },
      { letter: "C", text: "Organize tasks and processes", code: "C" },
    ],
  },
  {
    id: 3,
    question: "What type of school task do you prefer?",
    options: [
      { letter: "A", text: "Lab, prototype, or practical task", code: "R" },
      { letter: "B", text: "Analysis report using evidence", code: "I" },
      { letter: "C", text: "Presentation with storytelling", code: "A" },
    ],
  },
  {
    id: 4,
    question: "What gives you the most energy?",
    options: [
      { letter: "A", text: "Helping people solve personal/learning issues", code: "S" },
      { letter: "B", text: "Pitching ideas and driving outcomes", code: "E" },
      { letter: "C", text: "Planning and maintaining systems", code: "C" },
    ],
  },
  {
    id: 5,
    question: "If given free time, you would rather:",
    options: [
      { letter: "A", text: "Tinker with tools, devices, or hardware", code: "R" },
      { letter: "B", text: "Read research and deep-dive topics", code: "I" },
      { letter: "C", text: "Create art, media, or content", code: "A" },
    ],
  },
  {
    id: 6,
    question: "Which environment feels most suitable?",
    options: [
      { letter: "A", text: "People-centered and service-oriented", code: "S" },
      { letter: "B", text: "Fast-paced leadership and business", code: "E" },
      { letter: "C", text: "Structured operations and detail work", code: "C" },
    ],
  },
];

export function scoreRiasecQuiz(answers: RiasecAnswer[]): RiasecQuizResult {
  const profile: RiasecProfile = { ...EMPTY_PROFILE };

  for (const answer of answers) {
    const question = RIASEC_QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) continue;
    const option = question.options.find((o) => o.letter === answer.selectedLetter);
    if (!option) continue;
    profile[option.code] += 1;
  }

  const sorted = (Object.keys(profile) as RiasecCode[]).sort(
    (a, b) => profile[b] - profile[a]
  );

  return {
    profile,
    topCodes: sorted.slice(0, 3),
  };
}

