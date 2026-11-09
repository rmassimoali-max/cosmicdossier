// Registry of the Cosmic Dossier test library.
import type { TestDef } from "./types";
import { BIG_FIVE_TEST } from "./big-five";
import { ATTACHMENT_TEST } from "./attachment-style";
import { DARK_TRIAD_TEST } from "./dark-triad";
import { HSP_TEST } from "./highly-sensitive-person";
import { MBTI_TEST } from "./mbti";
import { ENNEAGRAM_TEST } from "./enneagram";

export const TEST_CATEGORIES = [
  "Personality",
  "Relationships & Attachment",
  "Dark Traits",
  "Sensitivity & Emotional Style",
] as const;

export const TESTS: TestDef[] = [BIG_FIVE_TEST, MBTI_TEST, ENNEAGRAM_TEST, ATTACHMENT_TEST, DARK_TRIAD_TEST, HSP_TEST];

export function testBySlug(slug: string): TestDef | undefined {
  return TESTS.find((t) => t.slug === slug);
}

export function testsInCategory(category: string): TestDef[] {
  return TESTS.filter((t) => t.category === category);
}
