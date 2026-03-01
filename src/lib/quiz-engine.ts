/**
 * Interests Quiz Engine
 *
 * 12 questions, single-choice (A–E), mapping answers to 16 interest tags
 * and 6 preference flags.
 *
 * After all questions:
 * - Compute total points per tag
 * - Normalize and pick top 5 tags
 * - Derive preference flags from cumulative signals
 */

// ----- 16 Interest Tags -----
export const INTEREST_TAGS = [
  "computing_software",
  "data_ai",
  "engineering",
  "business_management",
  "finance_accounting",
  "economics_policy",
  "law_public_policy",
  "healthcare_biomedical",
  "life_sciences_chemistry",
  "design_creative_media",
  "communications_marketing",
  "education_psychology",
  "social_sciences",
  "humanities_languages",
  "entrepreneurship_product",
  "operations_logistics",
] as const;

export type InterestTag = (typeof INTEREST_TAGS)[number];

/** Human-readable labels for each tag */
export const TAG_LABELS: Record<InterestTag, string> = {
  computing_software: "Computing & Software",
  data_ai: "Data & AI",
  engineering: "Engineering",
  business_management: "Business & Management",
  finance_accounting: "Finance & Accounting",
  economics_policy: "Economics & Policy",
  law_public_policy: "Law & Public Policy",
  healthcare_biomedical: "Healthcare & Biomedical",
  life_sciences_chemistry: "Life Sciences & Chemistry",
  design_creative_media: "Design & Creative Media",
  communications_marketing: "Communications & Marketing",
  education_psychology: "Education & Psychology",
  social_sciences: "Social Sciences",
  humanities_languages: "Humanities & Languages",
  entrepreneurship_product: "Entrepreneurship & Product",
  operations_logistics: "Operations & Logistics",
};

// ----- Preference flags -----
export interface PreferenceFlags {
  prefers_people_work: boolean;
  prefers_analytical_work: boolean;
  prefers_creative_work: boolean;
  avoid_heavy_math: boolean;
  avoid_heavy_coding: boolean;
  likes_structure_vs_exploration: "structure" | "exploration" | "balanced";
}

// ----- Quiz question and option types -----
export interface TagScore {
  tag: InterestTag;
  points: number;
}

export interface FlagEffect {
  flag:
    | "people_work"
    | "analytical_work"
    | "creative_work"
    | "structure"
    | "exploration"
    | "avoid_heavy_coding"
    | "avoid_heavy_math";
  value?: boolean; // for avoid flags, true = set
}

export interface QuizOption {
  letter: string; // "A", "B", etc.
  text: string;
  tagScores: TagScore[];
  flagEffects: FlagEffect[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

// ----- Question bank (12 questions) -----
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Which type of activity sounds most enjoyable?",
    options: [
      {
        letter: "A",
        text: "Building an app, website, or software tool.",
        tagScores: [
          { tag: "computing_software", points: 3 },
          { tag: "entrepreneurship_product", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "B",
        text: "Analysing data to find patterns and make predictions.",
        tagScores: [
          { tag: "data_ai", points: 3 },
          { tag: "economics_policy", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "C",
        text: "Designing visuals, videos, or creative content.",
        tagScores: [
          { tag: "design_creative_media", points: 3 },
          { tag: "communications_marketing", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "D",
        text: "Leading a group to plan and run an event or project.",
        tagScores: [
          { tag: "business_management", points: 3 },
          { tag: "entrepreneurship_product", points: 2 },
        ],
        flagEffects: [],
      },
      {
        letter: "E",
        text: "Understanding how society works and why people behave certain ways.",
        tagScores: [
          { tag: "social_sciences", points: 3 },
          { tag: "education_psychology", points: 1 },
        ],
        flagEffects: [],
      },
    ],
  },
  {
    id: 2,
    question: "What kind of problems do you prefer?",
    options: [
      {
        letter: "A",
        text: "Clear right or wrong answers.",
        tagScores: [
          { tag: "engineering", points: 2 },
          { tag: "operations_logistics", points: 2 },
        ],
        flagEffects: [{ flag: "structure" }],
      },
      {
        letter: "B",
        text: "Problems with numbers and logic.",
        tagScores: [
          { tag: "data_ai", points: 2 },
          { tag: "finance_accounting", points: 2 },
        ],
        flagEffects: [{ flag: "analytical_work" }],
      },
      {
        letter: "C",
        text: "Open-ended problems with many possible solutions.",
        tagScores: [
          { tag: "design_creative_media", points: 2 },
          { tag: "entrepreneurship_product", points: 2 },
        ],
        flagEffects: [{ flag: "creative_work" }, { flag: "exploration" }],
      },
      {
        letter: "D",
        text: "Problems involving people, teamwork, and communication.",
        tagScores: [
          { tag: "communications_marketing", points: 2 },
          { tag: "business_management", points: 2 },
        ],
        flagEffects: [{ flag: "people_work" }],
      },
      {
        letter: "E",
        text: "Problems involving rules, fairness, or policies.",
        tagScores: [
          { tag: "law_public_policy", points: 2 },
          { tag: "economics_policy", points: 2 },
        ],
        flagEffects: [],
      },
    ],
  },
  {
    id: 3,
    question: "Pick the statement that fits you best.",
    options: [
      {
        letter: "A",
        text: "I like learning how computers work and how to make them do useful things.",
        tagScores: [
          { tag: "computing_software", points: 3 },
          { tag: "data_ai", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "B",
        text: "I like understanding money, markets, and how businesses grow.",
        tagScores: [
          { tag: "finance_accounting", points: 3 },
          { tag: "business_management", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "C",
        text: "I like helping people, improving wellbeing, or working in healthcare-related areas.",
        tagScores: [
          { tag: "healthcare_biomedical", points: 3 },
          { tag: "education_psychology", points: 1 },
        ],
        flagEffects: [{ flag: "people_work" }],
      },
      {
        letter: "D",
        text: "I like learning about science (bio/chem) and how the body or nature works.",
        tagScores: [
          { tag: "life_sciences_chemistry", points: 3 },
          { tag: "healthcare_biomedical", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "E",
        text: "I like writing, reading, or working with languages and ideas.",
        tagScores: [
          { tag: "humanities_languages", points: 3 },
          { tag: "communications_marketing", points: 1 },
        ],
        flagEffects: [],
      },
    ],
  },
  {
    id: 4,
    question: "In group work, you usually prefer to:",
    options: [
      {
        letter: "A",
        text: "Code/build the solution.",
        tagScores: [{ tag: "computing_software", points: 3 }],
        flagEffects: [],
      },
      {
        letter: "B",
        text: "Do research and analyse information.",
        tagScores: [
          { tag: "social_sciences", points: 2 },
          { tag: "data_ai", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "C",
        text: "Present, persuade, and communicate ideas.",
        tagScores: [{ tag: "communications_marketing", points: 3 }],
        flagEffects: [{ flag: "people_work" }],
      },
      {
        letter: "D",
        text: "Organise tasks, timelines, and logistics.",
        tagScores: [
          { tag: "operations_logistics", points: 2 },
          { tag: "business_management", points: 1 },
        ],
        flagEffects: [{ flag: "structure" }],
      },
      {
        letter: "E",
        text: "Think about ethics, fairness, and what rules should be.",
        tagScores: [{ tag: "law_public_policy", points: 3 }],
        flagEffects: [],
      },
    ],
  },
  {
    id: 5,
    question: "Which subject-style do you enjoy more?",
    options: [
      {
        letter: "A",
        text: "Math and solving structured problems.",
        tagScores: [
          { tag: "engineering", points: 2 },
          { tag: "finance_accounting", points: 1 },
          { tag: "data_ai", points: 1 },
        ],
        flagEffects: [{ flag: "analytical_work" }],
      },
      {
        letter: "B",
        text: "Essay writing and discussions.",
        tagScores: [
          { tag: "humanities_languages", points: 2 },
          { tag: "social_sciences", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "C",
        text: "Practical building and hands-on tasks.",
        tagScores: [
          { tag: "engineering", points: 2 },
          { tag: "entrepreneurship_product", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "D",
        text: "Research, reading, and presenting findings.",
        tagScores: [
          { tag: "economics_policy", points: 2 },
          { tag: "social_sciences", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "E",
        text: "Design and creative expression.",
        tagScores: [{ tag: "design_creative_media", points: 3 }],
        flagEffects: [{ flag: "creative_work" }],
      },
    ],
  },
  {
    id: 6,
    question: "If you had to choose, which outcome matters most to you?",
    options: [
      {
        letter: "A",
        text: "High earning potential.",
        tagScores: [
          { tag: "finance_accounting", points: 2 },
          { tag: "computing_software", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "B",
        text: "Meaningful impact on society.",
        tagScores: [
          { tag: "law_public_policy", points: 2 },
          { tag: "economics_policy", points: 1 },
          { tag: "healthcare_biomedical", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "C",
        text: "Job stability and clear career path.",
        tagScores: [
          { tag: "operations_logistics", points: 2 },
          { tag: "engineering", points: 1 },
          { tag: "finance_accounting", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "D",
        text: "Freedom to create and explore.",
        tagScores: [
          { tag: "design_creative_media", points: 2 },
          { tag: "humanities_languages", points: 1 },
        ],
        flagEffects: [{ flag: "exploration" }],
      },
      {
        letter: "E",
        text: "Starting or building something new.",
        tagScores: [
          { tag: "entrepreneurship_product", points: 3 },
          { tag: "business_management", points: 1 },
        ],
        flagEffects: [],
      },
    ],
  },
  {
    id: 7,
    question: "Which type of work environment sounds best?",
    options: [
      {
        letter: "A",
        text: "Solving technical problems quietly, deep focus.",
        tagScores: [
          { tag: "computing_software", points: 2 },
          { tag: "data_ai", points: 2 },
        ],
        flagEffects: [{ flag: "analytical_work" }],
      },
      {
        letter: "B",
        text: "Working with clients and people every day.",
        tagScores: [
          { tag: "communications_marketing", points: 2 },
          { tag: "business_management", points: 2 },
        ],
        flagEffects: [{ flag: "people_work" }],
      },
      {
        letter: "C",
        text: "Planning and running operations, making sure things work smoothly.",
        tagScores: [
          { tag: "operations_logistics", points: 3 },
          { tag: "business_management", points: 1 },
        ],
        flagEffects: [{ flag: "structure" }],
      },
      {
        letter: "D",
        text: "Research and analysis, reading and writing reports.",
        tagScores: [
          { tag: "economics_policy", points: 2 },
          { tag: "social_sciences", points: 2 },
        ],
        flagEffects: [],
      },
      {
        letter: "E",
        text: "Studio or creative environment.",
        tagScores: [{ tag: "design_creative_media", points: 3 }],
        flagEffects: [{ flag: "creative_work" }],
      },
    ],
  },
  {
    id: 8,
    question: "How do you feel about coding?",
    options: [
      {
        letter: "A",
        text: "I like it, I want to do more.",
        tagScores: [
          { tag: "computing_software", points: 3 },
          { tag: "data_ai", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "B",
        text: "I am open to learning if needed.",
        tagScores: [
          { tag: "data_ai", points: 2 },
          { tag: "entrepreneurship_product", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "C",
        text: "I do not like it, prefer minimal coding.",
        tagScores: [
          { tag: "communications_marketing", points: 1 },
          { tag: "business_management", points: 1 },
        ],
        flagEffects: [{ flag: "avoid_heavy_coding", value: true }],
      },
      {
        letter: "D",
        text: "I am not sure yet.",
        tagScores: [{ tag: "social_sciences", points: 1 }],
        flagEffects: [],
      },
      {
        letter: "E",
        text: "I prefer non-coding paths.",
        tagScores: [
          { tag: "humanities_languages", points: 1 },
          { tag: "law_public_policy", points: 1 },
        ],
        flagEffects: [{ flag: "avoid_heavy_coding", value: true }],
      },
    ],
  },
  {
    id: 9,
    question: "How do you feel about heavy math?",
    options: [
      {
        letter: "A",
        text: "I like math a lot.",
        tagScores: [
          { tag: "engineering", points: 3 },
          { tag: "data_ai", points: 1 },
        ],
        flagEffects: [{ flag: "analytical_work" }],
      },
      {
        letter: "B",
        text: "I can handle it if needed.",
        tagScores: [
          { tag: "finance_accounting", points: 2 },
          { tag: "economics_policy", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "C",
        text: "I prefer lighter math.",
        tagScores: [
          { tag: "business_management", points: 1 },
          { tag: "communications_marketing", points: 1 },
        ],
        flagEffects: [{ flag: "avoid_heavy_math", value: true }],
      },
      {
        letter: "D",
        text: "I dislike math.",
        tagScores: [
          { tag: "humanities_languages", points: 1 },
          { tag: "social_sciences", points: 1 },
        ],
        flagEffects: [{ flag: "avoid_heavy_math", value: true }],
      },
      {
        letter: "E",
        text: "Not sure.",
        tagScores: [{ tag: "education_psychology", points: 1 }],
        flagEffects: [],
      },
    ],
  },
  {
    id: 10,
    question: "Which topic do you naturally read/watch more?",
    options: [
      {
        letter: "A",
        text: "Tech gadgets, apps, how things work.",
        tagScores: [
          { tag: "computing_software", points: 2 },
          { tag: "data_ai", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "B",
        text: "Money, investing, business news.",
        tagScores: [
          { tag: "finance_accounting", points: 2 },
          { tag: "economics_policy", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "C",
        text: "Health, medicine, fitness, wellbeing.",
        tagScores: [
          { tag: "healthcare_biomedical", points: 2 },
          { tag: "life_sciences_chemistry", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "D",
        text: "Society, trends, politics, world issues.",
        tagScores: [
          { tag: "economics_policy", points: 1 },
          { tag: "law_public_policy", points: 1 },
          { tag: "social_sciences", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "E",
        text: "Art, design, content creation.",
        tagScores: [
          { tag: "design_creative_media", points: 2 },
          { tag: "communications_marketing", points: 1 },
        ],
        flagEffects: [],
      },
    ],
  },
  {
    id: 11,
    question: "Pick a project you would enjoy most:",
    options: [
      {
        letter: "A",
        text: "Build a simple app that solves a daily problem.",
        tagScores: [
          { tag: "computing_software", points: 2 },
          { tag: "entrepreneurship_product", points: 2 },
        ],
        flagEffects: [],
      },
      {
        letter: "B",
        text: "Analyse a dataset and explain insights in a dashboard.",
        tagScores: [{ tag: "data_ai", points: 3 }],
        flagEffects: [],
      },
      {
        letter: "C",
        text: "Plan a campaign to promote a product or event.",
        tagScores: [
          { tag: "communications_marketing", points: 2 },
          { tag: "business_management", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "D",
        text: "Investigate a social issue and propose solutions.",
        tagScores: [
          { tag: "social_sciences", points: 2 },
          { tag: "economics_policy", points: 1 },
          { tag: "law_public_policy", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "E",
        text: "Create a branding and content package.",
        tagScores: [
          { tag: "design_creative_media", points: 2 },
          { tag: "communications_marketing", points: 1 },
        ],
        flagEffects: [],
      },
    ],
  },
  {
    id: 12,
    question: "Which statement is closest to your personality?",
    options: [
      {
        letter: "A",
        text: "I am systematic, I like clear steps and structure.",
        tagScores: [
          { tag: "operations_logistics", points: 2 },
          { tag: "finance_accounting", points: 1 },
        ],
        flagEffects: [{ flag: "structure" }],
      },
      {
        letter: "B",
        text: "I am curious, I like exploring and learning broadly.",
        tagScores: [
          { tag: "humanities_languages", points: 1 },
          { tag: "social_sciences", points: 1 },
        ],
        flagEffects: [{ flag: "exploration" }],
      },
      {
        letter: "C",
        text: "I like persuading and communicating with people.",
        tagScores: [{ tag: "communications_marketing", points: 3 }],
        flagEffects: [{ flag: "people_work" }],
      },
      {
        letter: "D",
        text: "I like building things and improving them.",
        tagScores: [
          { tag: "engineering", points: 1 },
          { tag: "entrepreneurship_product", points: 2 },
          { tag: "computing_software", points: 1 },
        ],
        flagEffects: [],
      },
      {
        letter: "E",
        text: "I like caring for others or supporting people's growth.",
        tagScores: [
          { tag: "education_psychology", points: 3 },
          { tag: "healthcare_biomedical", points: 1 },
        ],
        flagEffects: [{ flag: "people_work" }],
      },
    ],
  },
];

// ----- Quiz scoring engine -----

export interface QuizAnswer {
  questionId: number;
  selectedLetter: string;
}

export interface QuizResult {
  /** Points per tag */
  tagPoints: Record<InterestTag, number>;
  /** Top 5 tags sorted by points descending */
  topTags: InterestTag[];
  /** Derived preference flags */
  preferences: PreferenceFlags;
  /** Raw counters (for debugging/display) */
  rawCounters: {
    people_work: number;
    analytical_work: number;
    creative_work: number;
    structure_votes: number;
    exploration_votes: number;
    avoid_heavy_coding_set: boolean;
    avoid_heavy_math_set: boolean;
  };
}

export function scoreQuiz(answers: QuizAnswer[]): QuizResult {
  // Initialize tag points
  const tagPoints: Record<InterestTag, number> = {} as Record<
    InterestTag,
    number
  >;
  for (const tag of INTEREST_TAGS) {
    tagPoints[tag] = 0;
  }

  // Counters for preference flags
  let peopleWorkCounter = 0;
  let analyticalWorkCounter = 0;
  let creativeWorkCounter = 0;
  let structureVotes = 0;
  let explorationVotes = 0;
  let avoidHeavyCoding = false;
  let avoidHeavyMath = false;

  // Process each answer
  for (const answer of answers) {
    const question = QUIZ_QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const option = question.options.find(
      (o) => o.letter === answer.selectedLetter
    );
    if (!option) continue;

    // Add tag scores
    for (const ts of option.tagScores) {
      tagPoints[ts.tag] += ts.points;
    }

    // Process flag effects
    for (const fe of option.flagEffects) {
      switch (fe.flag) {
        case "people_work":
          peopleWorkCounter++;
          break;
        case "analytical_work":
          analyticalWorkCounter++;
          break;
        case "creative_work":
          creativeWorkCounter++;
          break;
        case "structure":
          structureVotes++;
          break;
        case "exploration":
          explorationVotes++;
          break;
        case "avoid_heavy_coding":
          avoidHeavyCoding = true;
          break;
        case "avoid_heavy_math":
          avoidHeavyMath = true;
          break;
      }
    }
  }

  // Sort tags by points descending, pick top 5
  const sortedTags = [...INTEREST_TAGS].sort(
    (a, b) => tagPoints[b] - tagPoints[a]
  );
  const topTags = sortedTags.slice(0, 5);

  // Derive preference flags

  // prefers_people_work: true if counter >= 2
  const prefers_people_work = peopleWorkCounter >= 2;

  // prefers_analytical_work: true if counter >= 2
  const prefers_analytical_work = analyticalWorkCounter >= 2;

  // prefers_creative_work: true if counter >= 2
  const prefers_creative_work = creativeWorkCounter >= 2;

  // avoid_heavy_math: true if set by Q9, or if eng+data_ai+fin < humanities+design+comms AND user said prefer lighter/dislike
  const mathHeavyTags =
    tagPoints.engineering + tagPoints.data_ai + tagPoints.finance_accounting;
  const nonMathTags =
    tagPoints.humanities_languages +
    tagPoints.design_creative_media +
    tagPoints.communications_marketing;
  const avoid_heavy_math_final =
    avoidHeavyMath || (avoidHeavyMath && mathHeavyTags < nonMathTags);

  // avoid_heavy_coding: true if set by Q8 C/E, or if computing_software not in top 8 and user selected minimal coding
  const computingRank = sortedTags.indexOf("computing_software");
  const avoid_heavy_coding_final =
    avoidHeavyCoding || (avoidHeavyCoding && computingRank >= 8);

  // likes_structure_vs_exploration
  let likes_structure_vs_exploration: "structure" | "exploration" | "balanced";
  if (structureVotes - explorationVotes >= 2) {
    likes_structure_vs_exploration = "structure";
  } else if (explorationVotes - structureVotes >= 2) {
    likes_structure_vs_exploration = "exploration";
  } else {
    likes_structure_vs_exploration = "balanced";
  }

  return {
    tagPoints,
    topTags,
    preferences: {
      prefers_people_work,
      prefers_analytical_work,
      prefers_creative_work,
      avoid_heavy_math: avoid_heavy_math_final,
      avoid_heavy_coding: avoid_heavy_coding_final,
      likes_structure_vs_exploration,
    },
    rawCounters: {
      people_work: peopleWorkCounter,
      analytical_work: analyticalWorkCounter,
      creative_work: creativeWorkCounter,
      structure_votes: structureVotes,
      exploration_votes: explorationVotes,
      avoid_heavy_coding_set: avoidHeavyCoding,
      avoid_heavy_math_set: avoidHeavyMath,
    },
  };
}
