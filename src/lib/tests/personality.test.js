import { describe, expect, test } from "bun:test";
import { MBTI_QUESTIONS, ENNEAGRAM_QUESTIONS, scoreMbti, scoreEnneagram } from "../assessments";
import { ARCHETYPES } from "../archetypes";
import { MBTI_TEST } from "./mbti";
import { ENNEAGRAM_TEST } from "./enneagram";
import { BIG_FIVE_TEST } from "./big-five";
import { ATTACHMENT_TEST } from "./attachment-style";
import { DARK_TRIAD_TEST } from "./dark-triad";
import { HSP_TEST } from "./highly-sensitive-person";
import { decodeAnswers, encodeAnswers, scoreDimensions, scoreTest } from "./types";

describe("legacy personality adapters", () => {
  test("20 MBTI choices reuse original objects, scoring and Person 1 patch", () => {
    expect(MBTI_TEST.items).toHaveLength(20);
    const answers = Object.fromEntries(MBTI_QUESTIONS.map((q) => [q.id, 1]));
    const original = scoreMbti(Object.fromEntries(MBTI_QUESTIONS.map((q) => [q.id, q.a.value])));
    expect(original[0]?.label).toBe("INTJ");
    expect(MBTI_TEST.items[0]?.choices?.[0]).toBe(MBTI_QUESTIONS[0]?.a);
    expect(MBTI_TEST.dossierPatch?.(scoreTest(MBTI_TEST, answers))).toEqual({ mbti: "INTJ", mbtiEstimates: original });
  });
  test("18 Enneagram responses preserve numeric core and wing as saved strings", () => {
    expect(ENNEAGRAM_TEST.items).toHaveLength(18);
    const answers = Object.fromEntries(ENNEAGRAM_QUESTIONS.map((q) => [q.id, q.type === 9 ? 5 : q.type === 8 ? 4 : 1]));
    const original = scoreEnneagram(answers);
    expect(original.label).toBe("9w8");
    expect(ENNEAGRAM_TEST.dossierPatch?.(scoreTest(ENNEAGRAM_TEST, answers))).toEqual({ enneagramType: "9", enneagramWing: "8", enneagramEstimates: original.estimates });
  });
  test("all 16 MBTI types derive matching NT NF SJ SP archetypes", () => {
    for (const type of ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"]) {
      const code = type[1] === "N" ? type.slice(1, 3) : `S${type[3]}`;
      expect(MBTI_TEST.archetypeNote({ [type]: 100 }).slugs).toEqual(ARCHETYPES.filter((a) => a.flavor.mbti.includes(code)).map((a) => a.slug));
    }
  });
  test("Type 1 has no unrelated archetype card", () => {
    expect(ENNEAGRAM_TEST.archetypeNote({ core: 1 }).slugs).toEqual([]);
    expect(ENNEAGRAM_TEST.archetypeNote({ core: 4 }).slugs).toEqual(["the-empath"]);
  });
  test("compact MBTI and Enneagram links round-trip and reject broken values", () => {
    for (const definition of [MBTI_TEST, ENNEAGRAM_TEST]) {
      const answers = Object.fromEntries(definition.items.map((q) => [q.id, definition.scale.max]));
      const encoded = encodeAnswers(definition.items, answers);
      expect(encoded.length).toBe(definition.items.length + 2);
      expect(decodeAnswers(definition.items, encoded, definition.scale)).toEqual(answers);
      for (const broken of ["", "v1", encoded + "1", "v1" + "0".repeat(definition.items.length), "v1" + "z".repeat(definition.items.length), "v1" + "!".repeat(definition.items.length)]) {
        expect(decodeAnswers(definition.items, broken, definition.scale)).toBeNull();
      }
    }
  });
  test("four existing tests retain scale scoring and shared answer behavior", () => {
    for (const definition of [BIG_FIVE_TEST, ATTACHMENT_TEST, DARK_TRIAD_TEST, HSP_TEST]) {
      for (const value of [definition.scale.min, 3, definition.scale.max]) {
        const answers = Object.fromEntries(definition.items.map((q) => [q.id, value]));
        expect(scoreTest(definition, answers)).toEqual(scoreDimensions(definition.items, definition.scale, answers));
        expect(decodeAnswers(definition.items, encodeAnswers(definition.items, answers), definition.scale)).toEqual(answers);
      }
    }
  });
});