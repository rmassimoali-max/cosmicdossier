import { describe, expect, test } from "bun:test";
import { RESILIENCE_TEST } from "./resilience";
import { AQ_TEST } from "./autism-quotient";
import { HEXACO_TEST } from "./hexaco";
import { TESTS } from "./index";
import { scoreTest } from "./types";

const all = (t, v) => Object.fromEntries(t.items.map((i) => [i.id, v]));
describe("new tests", () => {
  test("registry has 12 tests", () => expect(TESTS).toHaveLength(12));
  test("resilience reverse items: all-agree lands mid", () => expect(scoreTest(RESILIENCE_TEST, all(RESILIENCE_TEST, 5)).resilience).toBe(60));
  test("AQ overall averages areas", () => expect(scoreTest(AQ_TEST, all(AQ_TEST, 3)).overall).toBe(50));
  test("HEXACO yields six factors", () => expect(Object.keys(scoreTest(HEXACO_TEST, all(HEXACO_TEST, 4)))).toHaveLength(6));
});
