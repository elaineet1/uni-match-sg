/**
 * Unit tests for the RP (UAS) Calculator.
 *
 * Tests cover:
 * - 3 H2 + GP only (core UAS)
 * - 4 H2 (best 3 used, 4th as optional H1-weight via rebasing)
 * - With MTL included only if improves
 * - With both 4th and MTL
 * - Edge cases
 */

import {
  calculateRP,
  igpGradeStringToRP,
  H2_POINTS,
  H1_POINTS,
  h2ToH1Weight,
} from "../rp-calculator";
import type { RPInput, SubjectEntry, Grade } from "../rp-calculator";

// Helper to create H2 subjects
function h2(name: string, grade: Grade): SubjectEntry {
  return { name, level: "H2", grade };
}

describe("Grade-to-points mapping", () => {
  test("H2 grade points are correct", () => {
    expect(H2_POINTS.A).toBe(20);
    expect(H2_POINTS.B).toBe(17.5);
    expect(H2_POINTS.C).toBe(15);
    expect(H2_POINTS.D).toBe(12.5);
    expect(H2_POINTS.E).toBe(10);
    expect(H2_POINTS.S).toBe(5);
    expect(H2_POINTS.U).toBe(0);
  });

  test("H1 grade points are correct", () => {
    expect(H1_POINTS.A).toBe(10);
    expect(H1_POINTS.B).toBe(8.75);
    expect(H1_POINTS.C).toBe(7.5);
    expect(H1_POINTS.D).toBe(6.25);
    expect(H1_POINTS.E).toBe(5);
    expect(H1_POINTS.S).toBe(2.5);
    expect(H1_POINTS.U).toBe(0);
  });

  test("H2 to H1 weight conversion", () => {
    expect(h2ToH1Weight("A")).toBe(10);
    expect(h2ToH1Weight("B")).toBe(8.75);
    expect(h2ToH1Weight("C")).toBe(7.5);
  });
});

describe("Core UAS (3 H2 + GP only)", () => {
  test("All A grades = 70 RP", () => {
    const result = calculateRP({
      h2Subjects: [h2("Math", "A"), h2("Chem", "A"), h2("Phys", "A")],
      gpGrade: "A",
    });
    expect(result.coreUAS).toBe(70);
    expect(result.bestUAS).toBe(70);
    expect(result.bestUASIncludes).toEqual([]);
  });

  test("Mixed grades", () => {
    const result = calculateRP({
      h2Subjects: [h2("Math", "A"), h2("Chem", "B"), h2("Phys", "C")],
      gpGrade: "B",
    });
    // 20 + 17.5 + 15 + 8.75 = 61.25
    expect(result.coreUAS).toBe(61.25);
    expect(result.bestUAS).toBe(61.25);
  });

  test("All U grades = 0 RP", () => {
    const result = calculateRP({
      h2Subjects: [h2("Math", "U"), h2("Chem", "U"), h2("Phys", "U")],
      gpGrade: "U",
    });
    expect(result.coreUAS).toBe(0);
  });

  test("Throws error with fewer than 3 H2 subjects", () => {
    expect(() =>
      calculateRP({
        h2Subjects: [h2("Math", "A"), h2("Chem", "A")],
        gpGrade: "A",
      })
    ).toThrow("At least 3 H2 subjects are required.");
  });
});

describe("4 H2 subjects (best 3 used, 4th rebased)", () => {
  test("4th H2 improves score via rebasing", () => {
    // Best 3: A(20) + A(20) + B(17.5) = 57.5, GP A(10) = 67.5 core
    // 4th: B(17.5) → H1 weight = 8.75
    // Rebased: (67.5 + 8.75) / 80 * 70 = 76.25 / 80 * 70 = 66.72
    // 66.72 < 67.5, so 4th is NOT included
    const result = calculateRP({
      h2Subjects: [h2("Math", "A"), h2("Chem", "A"), h2("Phys", "B"), h2("Econ", "B")],
      gpGrade: "A",
    });
    expect(result.coreUAS).toBe(67.5);
    // Since rebased (66.72) < core (67.5), bestUAS should be core
    expect(result.bestUAS).toBe(67.5);
    expect(result.bestUASIncludes).toEqual([]);
  });

  test("4th H2 with all A grades doesn't change score", () => {
    // Core: 20+20+20+10 = 70
    // With 4th: (70 + 10) / 80 * 70 = 70
    // Same, so should equal 70
    const result = calculateRP({
      h2Subjects: [h2("Math", "A"), h2("Chem", "A"), h2("Phys", "A"), h2("Econ", "A")],
      gpGrade: "A",
    });
    expect(result.coreUAS).toBe(70);
    expect(result.bestUAS).toBe(70);
  });

  test("4th H2 improves when core is lower", () => {
    // Best 3: C(15)+C(15)+C(15)=45, GP C(7.5) = 52.5 core
    // 4th: C(15) → H1 weight = 7.5
    // Rebased: (52.5 + 7.5) / 80 * 70 = 60/80*70 = 52.5
    // Same! So no improvement.
    // With D(12.5) 4th: H1 weight = 6.25
    // Rebased: (52.5 + 6.25) / 80 * 70 = 58.75/80*70 = 51.41
    // Worse! So not included.
    const result = calculateRP({
      h2Subjects: [h2("Math", "C"), h2("Chem", "C"), h2("Phys", "C"), h2("Econ", "D")],
      gpGrade: "C",
    });
    expect(result.coreUAS).toBe(52.5);
    expect(result.bestUAS).toBe(52.5);
  });

  test("Selects best 3 of 4 H2 subjects", () => {
    // Grades: A, B, C, D → best 3 are A, B, C
    const result = calculateRP({
      h2Subjects: [h2("Econ", "D"), h2("Math", "A"), h2("Phys", "C"), h2("Chem", "B")],
      gpGrade: "A",
    });
    // Best 3: A(20) + B(17.5) + C(15) = 52.5, GP A(10) = 62.5
    expect(result.coreUAS).toBe(62.5);
    // 4th is D(12.5) → H1 weight 6.25
    // Rebased: (62.5 + 6.25) / 80 * 70 = 60.16
    // 60.16 < 62.5, so not included
    expect(result.bestUAS).toBe(62.5);
  });
});

describe("With MTL (Mother Tongue)", () => {
  test("MTL improves via rebasing only if it helps", () => {
    // Core: A+A+A + GP A = 70
    // MTL A (H1: 10): Rebased: (70 + 10)/80*70 = 70
    // Same, so no improvement
    const result = calculateRP({
      h2Subjects: [h2("Math", "A"), h2("Chem", "A"), h2("Phys", "A")],
      gpGrade: "A",
      mtlGrade: "A",
    });
    expect(result.coreUAS).toBe(70);
    expect(result.bestUAS).toBe(70);
  });

  test("MTL does not decrease score", () => {
    // Core: A+B+B + GP B = 20+17.5+17.5+8.75 = 63.75
    // MTL D (H1: 6.25): Rebased: (63.75+6.25)/80*70 = 70/80*70 = 61.25
    // 61.25 < 63.75, so NOT included
    const result = calculateRP({
      h2Subjects: [h2("Math", "A"), h2("Chem", "B"), h2("Phys", "B")],
      gpGrade: "B",
      mtlGrade: "D",
    });
    expect(result.coreUAS).toBe(63.75);
    expect(result.bestUAS).toBe(63.75);
    expect(result.bestUASIncludes).toEqual([]);
  });
});

describe("With both 4th subject and MTL", () => {
  test("Both included only if improves", () => {
    // Core: B+B+B(17.5*3=52.5) + GP B(8.75) = 61.25
    // 4th H2 B → H1 weight 8.75
    // MTL B → H1 8.75
    // With 4th only: (61.25+8.75)/80*70 = 70/80*70 = 61.25 → same
    // With MTL only: (61.25+8.75)/80*70 = 61.25 → same
    // With both: (61.25+8.75+8.75)/90*70 = 78.75/90*70 = 61.25 → same
    const result = calculateRP({
      h2Subjects: [h2("Math", "B"), h2("Chem", "B"), h2("Phys", "B"), h2("Econ", "B")],
      gpGrade: "B",
      mtlGrade: "B",
    });
    expect(result.coreUAS).toBe(61.25);
    expect(result.bestUAS).toBe(61.25);
  });

  test("All perfect grades, all perfect MTL, stays at 70", () => {
    const result = calculateRP({
      h2Subjects: [h2("Math", "A"), h2("Chem", "A"), h2("Phys", "A"), h2("Econ", "A")],
      gpGrade: "A",
      mtlGrade: "A",
    });
    expect(result.bestUAS).toBe(70);
  });
});

describe("Breakdown table", () => {
  test("Shows all subjects with correct roles", () => {
    const result = calculateRP({
      h2Subjects: [h2("Math", "A"), h2("Chem", "B"), h2("Phys", "C")],
      gpGrade: "B",
      mtlGrade: "A",
    });
    expect(result.breakdown.length).toBe(5); // 3 H2 + GP + MTL
    expect(result.breakdown[0].role).toBe("core_h2");
    expect(result.breakdown[3].role).toBe("gp");
    expect(result.breakdown[4].role).toBe("mtl");
  });
});

describe("IGP grade string to RP", () => {
  test("AAA/A = 70", () => {
    expect(igpGradeStringToRP("AAA/A")).toBe(70);
  });

  test("ABB/B = 63.75", () => {
    // A(20) + B(17.5) + B(17.5) + B(8.75) = 63.75
    expect(igpGradeStringToRP("ABB/B")).toBe(63.75);
  });

  test("CCC/C = 52.5", () => {
    expect(igpGradeStringToRP("CCC/C")).toBe(52.5);
  });

  test("Invalid format returns 0", () => {
    expect(igpGradeStringToRP("")).toBe(0);
    expect(igpGradeStringToRP("-")).toBe(0);
    expect(igpGradeStringToRP("NA")).toBe(0);
    expect(igpGradeStringToRP("AAAA/A")).toBe(0);
  });
});
