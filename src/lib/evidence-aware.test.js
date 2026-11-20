import { describe, expect, test } from "bun:test";
import { buildProfile } from "./profile";
import { generateDossier, generateCrossSection } from "./synthesis";
import { generateSynastry, synastryEvidence } from "./synastry";
import { getAssessmentEntries, getAssessmentCategories } from "./assessment-discovery";
import { LOVE_STYLES_TEST } from "./tests/love-styles";
import { AQ_TEST } from "./tests/autism-quotient";
import { scoreTest } from "./tests/types";

const person = (overrides = {}) => ({
  name: "",
  dob: "",
  birthTime: "",
  birthPlace: "",
  ...overrides,
});

const sectionsText = (report) =>
  report.sections
    .map((section) => `${section.title}\n${section.body}\n${section.bullets?.join("\n") ?? ""}`)
    .join("\n");

describe("evidence-aware synthesis", () => {
  test("related high HEXACO and Big Five findings are construct overlap, not confirmation", () => {
    const profile = buildProfile(
      person({
        hexaco: { H: 50, E: 50, X: 50, A: 50, C: 80, O: 80 },
        bigFive: {
          Openness: 80,
          Conscientiousness: 80,
          Extraversion: 50,
          Agreeableness: 50,
          Neuroticism: 50,
        },
      }),
    );
    const text = generateCrossSection(profile)
      .map((section) => section.bullets?.join(" ") ?? "")
      .join(" ");
    expect(text).toContain("different factor structures");
    expect(text).toContain("not interchangeable measurements");
  });

  test("differing MBTI and Big Five findings are unresolved, not invented explanations", () => {
    const profile = buildProfile(
      person({
        mbti: "ISTJ",
        bigFive: {
          Openness: 50,
          Conscientiousness: 50,
          Extraversion: 80,
          Agreeableness: 50,
          Neuroticism: 50,
        },
      }),
    );
    const text = generateCrossSection(profile)
      .map((section) => section.bullets?.join(" ") ?? "")
      .join(" ");
    expect(text).toContain("cannot determine why");
  });

  test("ADHD and autism combinations retain non-diagnostic language", () => {
    const profile = buildProfile(
      person({
        assessmentResults: {
          "adhd-traits": { inattention: 80, hyperactivity: 50, overall: 80 },
          "autism-quotient": { social: 80, detail: 70, overall: 80 },
        },
      }),
    );
    const report = generateDossier(profile);
    const text = sectionsText(report);
    expect(text).toContain("not evidence");
    expect(text).toContain("clinical diagnosis");
  });
});

describe("evidence-aware synastry", () => {
  test("no shared domains is insufficient", () => {
    const evidence = synastryEvidence(
      buildProfile(person({ name: "A" })),
      buildProfile(person({ name: "B" })),
    );
    expect(evidence.level).toBe("insufficient");
    expect(evidence.relationshipDomains).toBe(0);
  });

  test("one shared domain is partial", () => {
    const evidence = synastryEvidence(
      buildProfile(person({ name: "A", mbti: "INTJ" })),
      buildProfile(person({ name: "B", mbti: "ENFP" })),
    );
    expect(evidence.level).toBe("partial");
    expect(evidence.personality).toBe(true);
  });

  test("standalone clinical data does not make relationship evidence sufficient", () => {
    const a = buildProfile(
      person({ name: "A", assessmentResults: { "adhd-traits": { overall: 70 } } }),
    );
    const b = buildProfile(
      person({ name: "B", assessmentResults: { "adhd-traits": { overall: 70 } } }),
    );
    const evidence = synastryEvidence(a, b);
    const report = generateSynastry(a, b);
    expect(evidence.level).toBe("insufficient");
    expect(sectionsText(report)).toContain("no relationship-specific conflict pattern");
  });

  test("two shared personality domains support personality-specific sections", () => {
    const a = buildProfile(
      person({
        name: "A",
        mbti: "INTJ",
        bigFive: {
          Openness: 80,
          Conscientiousness: 80,
          Extraversion: 30,
          Agreeableness: 50,
          Neuroticism: 50,
        },
      }),
    );
    const b = buildProfile(
      person({
        name: "B",
        mbti: "ENFP",
        bigFive: {
          Openness: 75,
          Conscientiousness: 50,
          Extraversion: 80,
          Agreeableness: 60,
          Neuroticism: 50,
        },
      }),
    );
    const evidence = synastryEvidence(a, b);
    expect(evidence.level).toBe("sufficient");
    expect(evidence.personality).toBe(true);
  });

  test("shared attachment assessments support attachment sections", () => {
    const a = buildProfile(person({ name: "A", attachment: "Anxious" }));
    const b = buildProfile(person({ name: "B", attachment: "Secure" }));
    const evidence = synastryEvidence(a, b);
    const report = generateSynastry(a, b);
    expect(evidence.attachment).toBe(true);
    expect(sectionsText(report)).toContain("Attachment Dynamic");
  });

  test("related findings remain possible rather than diagnostic or compatibility verdicts", () => {
    const a = buildProfile(
      person({
        name: "A",
        assessmentResults: {
          "emotional-intelligence": { managing: 80 },
          resilience: { resilience: 80 },
        },
      }),
    );
    const b = buildProfile(
      person({
        name: "B",
        assessmentResults: {
          "emotional-intelligence": { managing: 75 },
          resilience: { resilience: 75 },
        },
      }),
    );
    const report = generateSynastry(a, b);
    const text = sectionsText(report);
    expect(text).not.toContain("compatible partner");
    expect(text).not.toContain("relationship diagnosis");
  });

  test("shared astrology information supports astrology evidence", () => {
    const chart = {
      place: { label: "London", latitude: 51.5, longitude: -0.12 },
      local: "12:00",
      placements: [],
      ascendant: { sign: "Leo", degree: "10" },
      midheaven: { sign: "Taurus", degree: "10" },
      houses: [],
      aspects: [],
      elements: { Fire: 5, Earth: 3, Air: 3, Water: 2 },
      modalities: { Cardinal: 4, Fixed: 5, Mutable: 3 },
      dominantPlanets: [],
      chartShape: "Bowl",
      sun: "Leo",
      moon: "Cancer",
      rising: "Leo",
    };
    const a = buildProfile(person({ name: "A" }), chart);
    const b = buildProfile(person({ name: "B" }), chart);
    const evidence = synastryEvidence(a, b);
    expect(evidence.astrology).toBe(true);
    expect(evidence.relationshipDomains).toBe(0);
  });

  test("two personality domains do not support attachment conclusions", () => {
    const a = buildProfile(
      person({
        name: "A",
        mbti: "INTJ",
        bigFive: {
          Openness: 80,
          Conscientiousness: 80,
          Extraversion: 30,
          Agreeableness: 50,
          Neuroticism: 50,
        },
      }),
    );
    const b = buildProfile(
      person({
        name: "B",
        mbti: "ENFP",
        bigFive: {
          Openness: 75,
          Conscientiousness: 50,
          Extraversion: 80,
          Agreeableness: 60,
          Neuroticism: 50,
        },
      }),
    );
    const evidence = synastryEvidence(a, b);
    const report = generateSynastry(a, b);
    expect(evidence.level).toBe("sufficient");
    expect(evidence.attachment).toBe(false);
    expect(sectionsText(report)).toContain("both people need a completed attachment assessment");
  });

  test("overall completeness keeps astrology distinct from psychometric evidence", () => {
    const chart = {
      place: { label: "London", latitude: 51.5, longitude: -0.12 },
      local: "12:00",
      placements: [],
      ascendant: { sign: "Leo", degree: "10" },
      midheaven: { sign: "Taurus", degree: "10" },
      houses: [],
      aspects: [],
      elements: { Fire: 5, Earth: 3, Air: 3, Water: 2 },
      modalities: { Cardinal: 4, Fixed: 5, Mutable: 3 },
      dominantPlanets: [],
      chartShape: "Bowl",
      sun: "Leo",
      moon: "Cancer",
      rising: "Leo",
    };
    const profile = buildProfile(person(), chart);
    expect(profile.symbolicDomainCount).toBe(1);
    expect(profile.psychometricDomainCount).toBe(0);
    expect(profile.assessmentDomainCount).toBe(1);
  });

  test("clinical assessment sharing never creates psychometric compatibility evidence", () => {
    const a = buildProfile(person({ assessmentResults: { "autism-quotient": { overall: 70 } } }));
    const b = buildProfile(person({ assessmentResults: { "autism-quotient": { overall: 70 } } }));
    const evidence = synastryEvidence(a, b);
    const report = generateSynastry(a, b);
    expect(evidence.relationshipDomains).toBe(0);
    expect(sectionsText(report)).not.toContain("compatibility verdict");
  });
});

describe("assessment discovery", () => {
  test("finds love styles assessment", () => {
    const entries = getAssessmentEntries(person());
    expect(entries.find((entry) => entry.slug === "love-styles")?.label).toBe("Love Styles");
  });

  test("finds autism quotient assessment", () => {
    const entries = getAssessmentEntries(person());
    expect(entries.find((entry) => entry.slug === "autism-quotient")?.label).toContain("Autism");
  });

  test("categories are correctly identified", () => {
    const entries = getAssessmentEntries(person()).filter((entry) => !entry.legacy);
    const categories = getAssessmentCategories(entries);
    expect(
      categories
        .find((group) => group.category === "Relationships & Attachment")
        ?.entries.some((entry) => entry.slug === "love-styles"),
    ).toBe(true);
    expect(
      categories
        .find((group) => group.category === "Neurodiversity")
        ?.entries.some((entry) => entry.slug === "autism-quotient"),
    ).toBe(true);
  });

  test("lists all registered assessments and keeps core duplicates out", () => {
    const entries = getAssessmentEntries(person());
    expect(entries.filter((entry) => entry.legacy)).toHaveLength(4);
    expect(entries.some((entry) => entry.slug === "love-styles")).toBe(true);
    expect(entries.some((entry) => entry.slug === "mbti")).toBe(true);
    expect(entries.some((entry) => entry.slug === "attachment-style")).toBe(false);
  });

  test("completion status is independent for each person", () => {
    const first = getAssessmentEntries(
      person({ mbti: "INTJ", mbtiEstimates: [{ label: "INTJ", percent: 80 }] }),
    );
    const second = getAssessmentEntries(person());
    expect(first.find((entry) => entry.slug === "mbti")?.completed).toBe(true);
    expect(second.find((entry) => entry.slug === "mbti")?.completed).toBe(false);
  });

  test("registered entries retain categories for grouped discovery", () => {
    const entries = getAssessmentEntries(person());
    const categories = getAssessmentCategories(entries.filter((entry) => !entry.legacy));
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.every((group) => group.entries.length > 0)).toBe(true);
  });
});

describe("assessment quality", () => {
  test("Love Styles retains 20 items and four items per style", () => {
    expect(LOVE_STYLES_TEST.items).toHaveLength(20);
    for (const dimension of LOVE_STYLES_TEST.dimensions) {
      expect(
        LOVE_STYLES_TEST.items.filter((item) => item.dimension === dimension.key),
      ).toHaveLength(4);
    }
  });

  test("Love Styles no longer contains the reliability-focused broken-promises item", () => {
    const text = LOVE_STYLES_TEST.items.map((item) => item.text).join(" ");
    expect(text).not.toContain("Broken promises");
    expect(text).toContain("practical task");
  });

  test("AQ higher social difficulty and detail scores stay directionally consistent", () => {
    const highAnswers = Object.fromEntries(AQ_TEST.items.map((item) => [item.id, 5]));
    const lowAnswers = Object.fromEntries(AQ_TEST.items.map((item) => [item.id, 1]));
    const high = scoreTest(AQ_TEST, highAnswers);
    const low = scoreTest(AQ_TEST, lowAnswers);
    expect(high["overall"] ?? 0).toBeGreaterThan(low["overall"] ?? 100);
    expect(AQ_TEST.dimensions.find((dimension) => dimension.key === "detail")?.blurb).toContain(
      "not a difficulty",
    );
  });
});

describe("report presentation", () => {
  test("Enneagram synastry interaction uses sentence boundaries", () => {
    const a = buildProfile(person({ name: "A", enneagramType: "8" }));
    const b = buildProfile(person({ name: "B", enneagramType: "9" }));
    const report = generateSynastry(a, b);
    const text = sectionsText(report);
    expect(text).not.toContain("motivation  Under pressure");
  });

  test("similar strength variants are normalized without removing distinct findings", () => {
    const profile = buildProfile(
      person({ mbti: "INFJ", attachment: "Fearful-Avoidant", enneagramType: "4" }),
    );
    const report = generateDossier(profile);
    const strengths = report.sections.find((section) => section.title === "Possible Strengths");
    expect(strengths?.bullets?.includes("Insight and reflective depth")).toBe(true);
  });
});
