/**
 * Shared constants for the application.
 */

import type { Grade } from "./rp-calculator";

/** All possible grades in order */
export const GRADES: Grade[] = ["A", "B", "C", "D", "E", "S", "U"];

/** Common H2 subject options */
export const H2_SUBJECTS = [
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
] as const;

/** Common H1 content subject options */
export const H1_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "History",
  "Geography",
  "Literature in English",
  "Art",
  "China Studies in English",
] as const;

/** Mother Tongue options */
export const MTL_OPTIONS = [
  "Higher Chinese",
  "Higher Malay",
  "Higher Tamil",
  "H1 Chinese",
  "H1 Malay",
  "H1 Tamil",
] as const;
