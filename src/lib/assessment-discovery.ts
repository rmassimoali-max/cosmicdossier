import type { PersonInput } from "./session";
import { TEST_CATEGORIES, TESTS } from "./tests";
import { bandFor } from "./tests/types";

export type AssessmentEntry = {
  slug: string;
  label: string;
  category: string;
  completed: boolean;
  manuallyEntered?: boolean;
  detail?: string | undefined;
  legacy: boolean;
};

const CORE_EQUIVALENTS = new Set(["mbti", "enneagram", "attachment-style", "big-five"]);

function legacyDetail(person: PersonInput, slug: string): string | undefined {
  if (slug === "mbti") return person.mbti;
  if (slug === "enneagram") {
    if (!person.enneagramType) return undefined;
    return `${person.enneagramType ?? ""}${person.enneagramWing ? `w${person.enneagramWing}` : ""}`;
  }
  if (slug === "attachment") {
    return person.attachment;
  }
  if (slug === "bigfive") return person.bigFive ? "Scored" : undefined;
  return undefined;
}

export function getAssessmentEntries(person: PersonInput): AssessmentEntry[] {
  const entries: AssessmentEntry[] = [
    {
      slug: "mbti",
      label: "MBTI",
      category: "Personality",
      completed: Boolean(person.mbtiEstimates?.length || person.assessmentResults?.["mbti"]),
      manuallyEntered: Boolean(
        person.mbti && !person.mbtiEstimates?.length && !person.assessmentResults?.["mbti"],
      ),
      detail: legacyDetail(person, "mbti"),
      legacy: true,
    },
    {
      slug: "enneagram",
      label: "Enneagram",
      category: "Personality",
      completed: Boolean(
        person.enneagramEstimates?.length || person.assessmentResults?.["enneagram"],
      ),
      manuallyEntered: Boolean(
        person.enneagramType &&
          !person.enneagramEstimates?.length &&
          !person.assessmentResults?.["enneagram"],
      ),
      detail: legacyDetail(person, "enneagram"),
      legacy: true,
    },
    {
      slug: "attachment",
      label: "Attachment Style",
      category: "Relationships & Attachment",
      completed: Boolean(
        person.attachmentEstimates?.length || person.assessmentResults?.["attachment-style"],
      ),
      manuallyEntered: Boolean(
        person.attachment &&
          !person.attachmentEstimates?.length &&
          !person.assessmentResults?.["attachment-style"],
      ),
      detail: legacyDetail(person, "attachment"),
      legacy: true,
    },
    {
      slug: "bigfive",
      label: "Big Five",
      category: "Personality",
      completed: Boolean(person.bigFive || person.assessmentResults?.["big-five"]),
      detail: legacyDetail(person, "bigfive"),
      legacy: true,
    },
  ];

  for (const test of TESTS) {
    if (CORE_EQUIVALENTS.has(test.slug)) continue;

    let completed = false;
    let detail: string | undefined;
    const scores = person.assessmentResults?.[test.slug];

    if (test.slug === "hexaco" && person.hexaco) {
      completed = true;
      detail = test.resultLabel?.(person.hexaco) ?? "Scored";
    } else if (test.slug === "highly-sensitive-person" && typeof person.hsp === "number") {
      completed = true;
      detail = test.resultLabel?.({ sensitivity: person.hsp }) ?? `${person.hsp}/100`;
    } else if (scores) {
      completed = true;
      detail = test.resultLabel?.(scores);
      if (!detail) {
        const highest = test.dimensions
          .map((dimension) => ({ dimension, score: scores[dimension.key] ?? 0 }))
          .sort((a, b) => b.score - a.score)[0];
        if (highest)
          detail = `${highest.dimension.label}: ${bandFor(highest.dimension, highest.score).label}`;
      }
      detail ??= "Scored";
    }

    entries.push({
      slug: test.slug,
      label: test.name,
      category: test.category,
      completed,
      detail,
      legacy: false,
    });
  }

  return entries;
}

export function getAssessmentCategories(
  entries: AssessmentEntry[],
): Array<{ category: string; entries: AssessmentEntry[] }> {
  return TEST_CATEGORIES.map((category) => ({
    category,
    entries: entries.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0);
}
