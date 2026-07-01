import { describe, expect, it } from "vitest";
import { bindingCode, gradeAnswer } from "@/editor/cells/check/knowledgeCheck";

describe("gradeAnswer", () => {
  it("choice: unanswered is neutral, matches the correct option", () => {
    const config = { options: ["a", "b", "c"], correctChoice: 1 };
    expect(gradeAnswer("choice", "", config)).toEqual({
      answered: false,
      correct: false,
    });
    expect(gradeAnswer("choice", "a", config)).toEqual({
      answered: true,
      correct: false,
    });
    expect(gradeAnswer("choice", "b", config)).toEqual({
      answered: true,
      correct: true,
    });
    // no correct option configured → never correct
    expect(gradeAnswer("choice", "b", { options: ["a", "b"] }).correct).toBe(
      false,
    );
  });

  it("number: exact by default, honors tolerance", () => {
    expect(gradeAnswer("number", "", { correctNumber: 256 }).answered).toBe(
      false,
    );
    expect(gradeAnswer("number", 256, { correctNumber: 256 })).toEqual({
      answered: true,
      correct: true,
    });
    expect(gradeAnswer("number", 255, { correctNumber: 256 }).correct).toBe(
      false,
    );
    expect(
      gradeAnswer("number", 255, { correctNumber: 256, tolerance: 2 }).correct,
    ).toBe(true);
    // strings coerce
    expect(gradeAnswer("number", "10", { correctNumber: 10 }).correct).toBe(
      true,
    );
  });

  it("text: trims, case-insensitive by default", () => {
    expect(gradeAnswer("text", "  ", { correctText: "bit" }).answered).toBe(
      false,
    );
    expect(gradeAnswer("text", " Bit ", { correctText: "bit" }).correct).toBe(
      true,
    );
    expect(
      gradeAnswer("text", "Bit", { correctText: "bit", caseSensitive: true })
        .correct,
    ).toBe(false);
  });
});

describe("bindingCode", () => {
  it("publishes the pass boolean under the bound key", () => {
    expect(bindingCode("q1", true)).toBe('$["q1"] = true;');
    expect(bindingCode("q3", false)).toBe('$["q3"] = false;');
  });
});
