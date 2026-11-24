import { describe, expect, test } from "bun:test";
import { RESILIENCE_TEST } from "./resilience";
import { AQ_TEST } from "./autism-quotient";
import { HEXACO_TEST } from "./hexaco";
import { TESTS } from "./index";
import { scoreTest } from "./types";

const all = (t, v) => Object.fromEntries(t.items.map((i) => [i.id, v]));
describe("new tests", () => {
  test("registry has 12 tests", () => expect(TESTS).toHaveLength(12));
  test("resilience v2 has diverse, distinct items and preserves reverse scoring", () => {
    expect(RESILIENCE_TEST.items).toHaveLength(12);
    expect(new Set(RESILIENCE_TEST.items.map((item) => item.text)).size).toBe(12);
    expect(RESILIENCE_TEST.items.every((item) => item.id.startsWith("rs2_"))).toBe(true);
    expect(RESILIENCE_TEST.items.filter((item) => item.reverse)).toHaveLength(4);
    expect(scoreTest(RESILIENCE_TEST, all(RESILIENCE_TEST, 5)).resilience).toBe(67);
    expect(scoreTest(RESILIENCE_TEST, all(RESILIENCE_TEST, 3)).resilience).toBe(50);
  });
  test("AQ overall averages areas", () =>
    expect(scoreTest(AQ_TEST, all(AQ_TEST, 3)).overall).toBe(50));
  test("HEXACO yields six factors", () =>
    expect(Object.keys(scoreTest(HEXACO_TEST, all(HEXACO_TEST, 4)))).toHaveLength(6));
});
