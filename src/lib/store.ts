/**
 * Zustand store for client-side state management.
 * Persists quiz results, RP calculation, filters, and preferences
 * in client state (no login needed). Also persists key state to URL params.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Grade, SubjectEntry, PWResult, RPResult } from "./rp-calculator";
import type { QuizAnswer, QuizResult, InterestTag, PreferenceFlags } from "./quiz-engine";
import type { UniStyleAnswer, UniStyleProfile } from "./uni-style-quiz";
import type { FilterSettings, PortfolioInput } from "./reco/engine";
import { DEFAULT_FILTERS } from "./reco/engine";
import { calculateRP } from "./rp-calculator";
import { scoreQuiz } from "./quiz-engine";
import { scoreUniStyle } from "./uni-style-quiz";

export interface AppState {
  // Step 1: Results input
  h2Subjects: SubjectEntry[];
  gpGrade: Grade;
  h1ContentSubject: SubjectEntry | null;
  mtlGrade: Grade | null;
  pwResult: PWResult;
  rpResult: RPResult | null;

  // Step 2: Quiz
  quizAnswers: QuizAnswer[];
  quizResult: QuizResult | null;

  // Step 2b: Uni style quiz
  uniStyleAnswers: UniStyleAnswer[];
  uniStyleProfile: UniStyleProfile | null;

  // Step 3: Filters and preferences
  filters: FilterSettings;
  hidePrereqNotMet: boolean;
  prioritiseEligibility: boolean;
  openToCompetitive: boolean;

  // ABA Portfolio
  portfolio: PortfolioInput;

  // Manual tag overrides
  manualTagOverrides: InterestTag[];
  manualPreferenceOverrides: Partial<PreferenceFlags>;
  selectedCourseSlugs: string[];

  // Actions
  setH2Subjects: (subjects: SubjectEntry[]) => void;
  setGPGrade: (grade: Grade) => void;
  setH1ContentSubject: (subject: SubjectEntry | null) => void;
  setMTLGrade: (grade: Grade | null) => void;
  setPWResult: (result: PWResult) => void;
  computeRP: () => void;
  setQuizAnswer: (answer: QuizAnswer) => void;
  computeQuizResult: () => void;
  setUniStyleAnswer: (answer: UniStyleAnswer) => void;
  computeUniStyleResult: () => void;
  setFilter: <K extends keyof FilterSettings>(key: K, value: FilterSettings[K]) => void;
  resetFilters: () => void;
  setHidePrereqNotMet: (hide: boolean) => void;
  setPrioritiseEligibility: (prioritise: boolean) => void;
  setOpenToCompetitive: (open: boolean) => void;
  setPortfolio: (portfolio: Partial<PortfolioInput>) => void;
  setManualTagOverrides: (tags: InterestTag[]) => void;
  setManualPreferenceOverrides: (overrides: Partial<PreferenceFlags>) => void;
  toggleCompareCourse: (slug: string) => void;
  removeCompareCourse: (slug: string) => void;
  clearCompareCourses: () => void;
  resetAll: () => void;
}

function getInitialState() {
  return {
    h2Subjects: [
      { name: "", level: "H2" as const, grade: "A" as const },
      { name: "", level: "H2" as const, grade: "A" as const },
      { name: "", level: "H2" as const, grade: "A" as const },
    ],
    gpGrade: "A" as Grade,
    h1ContentSubject: null as SubjectEntry | null,
    mtlGrade: null as Grade | null,
    pwResult: "Pass" as PWResult,
    rpResult: null as RPResult | null,
    quizAnswers: [] as QuizAnswer[],
    quizResult: null as QuizResult | null,
    uniStyleAnswers: [] as UniStyleAnswer[],
    uniStyleProfile: null as UniStyleProfile | null,
    filters: { ...DEFAULT_FILTERS },
    hidePrereqNotMet: false,
    prioritiseEligibility: true,
    openToCompetitive: true,
    portfolio: {
      leadershipRoles: "0" as const,
      awardsLevel: "none" as const,
      relevantActivities: 0,
      personalStatementStrength: 3,
    },
    manualTagOverrides: [] as InterestTag[],
    manualPreferenceOverrides: {} as Partial<PreferenceFlags>,
    selectedCourseSlugs: [] as string[],
  };
}

export const useAppStore = create<AppState>()(persist((set, get) => ({
  ...getInitialState(),

  setH2Subjects: (subjects) => set({ h2Subjects: subjects }),
  setGPGrade: (grade) => set({ gpGrade: grade }),
  setH1ContentSubject: (subject) => set({ h1ContentSubject: subject }),
  setMTLGrade: (grade) => set({ mtlGrade: grade }),
  setPWResult: (result) => set({ pwResult: result }),

  computeRP: () => {
    const state = get();
    const validH2 = state.h2Subjects.filter((s) => s.name.trim() !== "");
    if (validH2.length < 3) {
      set({ rpResult: null });
      return;
    }
    try {
      const result = calculateRP({
        h2Subjects: validH2,
        gpGrade: state.gpGrade,
        h1ContentSubject: state.h1ContentSubject,
        mtlGrade: state.mtlGrade,
        pwResult: state.pwResult,
      });
      set({ rpResult: result });
    } catch {
      set({ rpResult: null });
    }
  },

  setQuizAnswer: (answer) => {
    const state = get();
    const existing = state.quizAnswers.filter(
      (a) => a.questionId !== answer.questionId
    );
    set({ quizAnswers: [...existing, answer] });
  },

  computeQuizResult: () => {
    const state = get();
    const result = scoreQuiz(state.quizAnswers);
    set({ quizResult: result });
  },

  setUniStyleAnswer: (answer) => {
    const state = get();
    const existing = state.uniStyleAnswers.filter(
      (a) => a.questionId !== answer.questionId
    );
    set({ uniStyleAnswers: [...existing, answer] });
  },

  computeUniStyleResult: () => {
    const state = get();
    const profile = scoreUniStyle(state.uniStyleAnswers);
    set({ uniStyleProfile: profile });
  },

  setFilter: (key, value) => {
    const state = get();
    set({ filters: { ...state.filters, [key]: value } });
  },

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  setHidePrereqNotMet: (hide) => set({ hidePrereqNotMet: hide }),
  setPrioritiseEligibility: (p) => set({ prioritiseEligibility: p }),
  setOpenToCompetitive: (o) => set({ openToCompetitive: o }),

  setPortfolio: (partial) => {
    const state = get();
    set({ portfolio: { ...state.portfolio, ...partial } });
  },

  setManualTagOverrides: (tags) => set({ manualTagOverrides: tags }),
  setManualPreferenceOverrides: (overrides) =>
    set({ manualPreferenceOverrides: overrides }),
  toggleCompareCourse: (slug) => {
    const selected = get().selectedCourseSlugs;
    if (selected.includes(slug)) {
      set({
        selectedCourseSlugs: selected.filter((s) => s !== slug),
      });
      return;
    }
    if (selected.length >= 5) return;
    set({ selectedCourseSlugs: [...selected, slug] });
  },
  removeCompareCourse: (slug) =>
    set({
      selectedCourseSlugs: get().selectedCourseSlugs.filter((s) => s !== slug),
    }),
  clearCompareCourses: () => set({ selectedCourseSlugs: [] }),
  resetAll: () => set({ ...getInitialState() }),
}), {
  name: "uni-match-sg-store",
  // Only persist user inputs, not computed results (those get recomputed)
  partialize: (state) => ({
    h2Subjects: state.h2Subjects,
    gpGrade: state.gpGrade,
    h1ContentSubject: state.h1ContentSubject,
    mtlGrade: state.mtlGrade,
    pwResult: state.pwResult,
    rpResult: state.rpResult,
    quizAnswers: state.quizAnswers,
    quizResult: state.quizResult,
    uniStyleAnswers: state.uniStyleAnswers,
    uniStyleProfile: state.uniStyleProfile,
    filters: state.filters,
    hidePrereqNotMet: state.hidePrereqNotMet,
    prioritiseEligibility: state.prioritiseEligibility,
    openToCompetitive: state.openToCompetitive,
    portfolio: state.portfolio,
    manualTagOverrides: state.manualTagOverrides,
    manualPreferenceOverrides: state.manualPreferenceOverrides,
    selectedCourseSlugs: state.selectedCourseSlugs,
  }),
}));
