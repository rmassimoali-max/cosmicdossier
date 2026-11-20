import { describe, expect, test } from "bun:test";
import { buildProfile } from "./profile";
import { generateDossier, generateCrossSection } from "./synthesis";
import { generateSynastry, synastryEvidence } from "./synastry";

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
    expect(text).not.toContain("compatible");
    expect(text).not.toContain("diagnosis");
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
    expect(evidence.relationshipDomains).toBe(1);
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
});
