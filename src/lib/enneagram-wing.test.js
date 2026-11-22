import { describe, expect, test } from "bun:test";
import { isValidEnneagramWing, validEnneagramWings } from "./enneagram-wing";
import { buildProfile } from "./profile";
import { wingText } from "./interpret/enneagram";

const person = (type, wing) => ({
  name: "Test",
  dob: "",
  birthTime: "",
  birthPlace: "",
  enneagramType: type,
  enneagramWing: wing,
});

describe("Enneagram wing validation", () => {
  test("only adjacent types are allowed, including wraparound", () => {
    const expected = {
      1: ["9", "2"],
      2: ["1", "3"],
      3: ["2", "4"],
      4: ["3", "5"],
      5: ["4", "6"],
      6: ["5", "7"],
      7: ["6", "8"],
      8: ["7", "9"],
      9: ["8", "1"],
    };
    for (const [type, wings] of Object.entries(expected)) {
      expect(validEnneagramWings(type)).toEqual(wings);
      for (let candidate = 1; candidate <= 9; candidate++) {
        expect(isValidEnneagramWing(type, String(candidate))).toBe(
          wings.includes(String(candidate)),
        );
      }
    }
  });

  test("missing and invalid types or wings are rejected", () => {
    expect(validEnneagramWings(undefined)).toEqual([]);
    expect(validEnneagramWings("10")).toEqual([]);
    expect(isValidEnneagramWing("4", undefined)).toBe(false);
    expect(isValidEnneagramWing("4", "4")).toBe(false);
    expect(isValidEnneagramWing("4", "5")).toBe(true);
  });

  test("invalid stored wings never enter a normalized profile or interpretation", () => {
    expect(buildProfile(person("4", "4")).wing).toBeUndefined();
    expect(wingText(4, 4)).toBe("");
    expect(buildProfile(person("4", "5")).wing).toBe(5);
    expect(wingText(4, 5)).toContain("4w5");
  });
});
