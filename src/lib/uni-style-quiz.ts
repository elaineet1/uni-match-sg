/**
 * University Style Fit Quiz
 *
 * 4 questions to determine learning style preferences.
 * Output: uniStyleProfile used for soft ranking adjustments (not filtering).
 *
 * These are preference-based heuristics, NOT facts about universities.
 * UI must phrase as "may suit you", never claim as fact unless cited.
 */

export interface UniStyleProfile {
  learningStyle: "seminar" | "lecture" | "mixed";
  teamworkLevel: "high" | "medium" | "low";
  structurePreference: "structured" | "flexible";
  careerFocus: "internships" | "research" | "balanced";
}

export interface UniStyleOption {
  letter: string;
  text: string;
  effects: UniStyleEffect[];
}

export interface UniStyleEffect {
  counter:
    | "seminar"
    | "lecture"
    | "mixed"
    | "team"
    | "solo"
    | "flex"
    | "industry"
    | "research"
    | "balanced";
  value: number;
}

export interface UniStyleQuestion {
  id: number;
  question: string;
  options: UniStyleOption[];
}

export const UNI_STYLE_QUESTIONS: UniStyleQuestion[] = [
  {
    id: 1,
    question: "Which learning format do you prefer most?",
    options: [
      {
        letter: "A",
        text: "Small class discussions every lesson",
        effects: [{ counter: "seminar", value: 2 }],
      },
      {
        letter: "B",
        text: "Mostly lectures, with occasional tutorials",
        effects: [{ counter: "lecture", value: 2 }],
      },
      {
        letter: "C",
        text: "Mix of both, no strong preference",
        effects: [{ counter: "mixed", value: 2 }],
      },
      {
        letter: "D",
        text: "Self-study, minimal class discussion",
        effects: [
          { counter: "lecture", value: 1 },
          { counter: "flex", value: 1 },
        ],
      },
      {
        letter: "E",
        text: "Not sure",
        effects: [{ counter: "mixed", value: 1 }],
      },
    ],
  },
  {
    id: 2,
    question: "How comfortable are you with speaking up in class?",
    options: [
      {
        letter: "A",
        text: "Very comfortable, I enjoy it",
        effects: [{ counter: "seminar", value: 2 }],
      },
      {
        letter: "B",
        text: "Comfortable if prepared",
        effects: [{ counter: "seminar", value: 1 }],
      },
      {
        letter: "C",
        text: "Neutral",
        effects: [{ counter: "mixed", value: 1 }],
      },
      {
        letter: "D",
        text: "Prefer not to speak much",
        effects: [{ counter: "lecture", value: 1 }],
      },
      {
        letter: "E",
        text: "Not sure",
        effects: [{ counter: "mixed", value: 1 }],
      },
    ],
  },
  {
    id: 3,
    question: "For projects, you prefer:",
    options: [
      {
        letter: "A",
        text: "Team projects most of the time",
        effects: [{ counter: "team", value: 2 }],
      },
      {
        letter: "B",
        text: "Mix of team and individual",
        effects: [{ counter: "team", value: 1 }],
      },
      {
        letter: "C",
        text: "Mostly individual work",
        effects: [{ counter: "solo", value: 2 }],
      },
      {
        letter: "D",
        text: "Depends on module",
        effects: [
          { counter: "team", value: 1 },
          { counter: "solo", value: 1 },
        ],
      },
      {
        letter: "E",
        text: "Not sure",
        effects: [{ counter: "team", value: 1 }],
      },
    ],
  },
  {
    id: 4,
    question: "What matters more to you in university?",
    options: [
      {
        letter: "A",
        text: "Strong internships and industry exposure",
        effects: [{ counter: "industry", value: 2 }],
      },
      {
        letter: "B",
        text: "Research opportunities and deep academic learning",
        effects: [{ counter: "research", value: 2 }],
      },
      {
        letter: "C",
        text: "Balanced",
        effects: [{ counter: "balanced", value: 2 }],
      },
      {
        letter: "D",
        text: "Flexible curriculum to explore",
        effects: [{ counter: "flex", value: 2 }],
      },
      {
        letter: "E",
        text: "Not sure",
        effects: [{ counter: "balanced", value: 1 }],
      },
    ],
  },
];

export interface UniStyleAnswer {
  questionId: number;
  selectedLetter: string;
}

export function scoreUniStyle(answers: UniStyleAnswer[]): UniStyleProfile {
  let seminarVotes = 0;
  let lectureVotes = 0;
  let mixedVotes = 0;
  let teamVotes = 0;
  let soloVotes = 0;
  let flexVotes = 0;
  let industryVotes = 0;
  let researchVotes = 0;
  let balancedVotes = 0;

  for (const answer of answers) {
    const question = UNI_STYLE_QUESTIONS.find(
      (q) => q.id === answer.questionId
    );
    if (!question) continue;

    const option = question.options.find(
      (o) => o.letter === answer.selectedLetter
    );
    if (!option) continue;

    for (const effect of option.effects) {
      switch (effect.counter) {
        case "seminar":
          seminarVotes += effect.value;
          break;
        case "lecture":
          lectureVotes += effect.value;
          break;
        case "mixed":
          mixedVotes += effect.value;
          break;
        case "team":
          teamVotes += effect.value;
          break;
        case "solo":
          soloVotes += effect.value;
          break;
        case "flex":
          flexVotes += effect.value;
          break;
        case "industry":
          industryVotes += effect.value;
          break;
        case "research":
          researchVotes += effect.value;
          break;
        case "balanced":
          balancedVotes += effect.value;
          break;
      }
    }
  }

  // Derive learningStyle
  let learningStyle: "seminar" | "lecture" | "mixed";
  if (seminarVotes - lectureVotes >= 2) learningStyle = "seminar";
  else if (lectureVotes - seminarVotes >= 2) learningStyle = "lecture";
  else learningStyle = "mixed";

  // Derive teamworkLevel
  let teamworkLevel: "high" | "medium" | "low";
  if (teamVotes - soloVotes >= 2) teamworkLevel = "high";
  else if (soloVotes - teamVotes >= 2) teamworkLevel = "low";
  else teamworkLevel = "medium";

  // Derive structurePreference
  const structurePreference = flexVotes >= 3 ? "flexible" : "structured";

  // Derive careerFocus
  let careerFocus: "internships" | "research" | "balanced";
  if (industryVotes - researchVotes >= 2) careerFocus = "internships";
  else if (researchVotes - industryVotes >= 2) careerFocus = "research";
  else careerFocus = "balanced";

  return { learningStyle, teamworkLevel, structurePreference, careerFocus };
}

/**
 * Compute university style fit score for a course based on its university.
 * Small adjustment, never moves courses across eligibility tiers.
 */
export function computeUniStyleFitScore(
  uniName: string,
  courseTags: string[],
  profile: UniStyleProfile,
  prefersPeopleWork: boolean
): number {
  let score = 0;
  const uni = uniName.toUpperCase();

  if (uni === "SMU") {
    if (profile.learningStyle === "seminar") score += 2;
    if (profile.teamworkLevel === "high") score += 1;
    if (prefersPeopleWork) score += 1;
  } else if (uni === "NUS" || uni === "NTU") {
    if (profile.learningStyle === "lecture") score += 2;
    if (profile.learningStyle === "mixed") score += 1;
    if (
      profile.teamworkLevel === "low" ||
      profile.teamworkLevel === "medium"
    )
      score += 1;
  }

  // Career focus matching with course tags
  const internshipTags = [
    "business_management",
    "finance_accounting",
    "communications_marketing",
    "computing_software",
  ];
  const researchTags = [
    "data_ai",
    "life_sciences_chemistry",
    "healthcare_biomedical",
    "social_sciences",
    "engineering",
  ];

  if (profile.careerFocus === "internships") {
    if (courseTags.some((t) => internshipTags.includes(t))) score += 1;
  } else if (profile.careerFocus === "research") {
    if (courseTags.some((t) => researchTags.includes(t))) score += 1;
  }

  return score;
}
