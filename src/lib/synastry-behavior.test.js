import { describe, expect, test } from "bun:test";
import { buildProfile } from "./profile";
import { buildDossier, buildSynastry } from "./generate";
import { synastryEvidence, PAIR_RULES } from "./synastry";

const person = (overrides = {}) => ({
  name: "",
  dob: "",
  birthTime: "",
  birthPlace: "",
  ...overrides,
});

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

const personality = (name, mbti, bigFive, enneagramType) =>
  person({ name, mbti, bigFive, enneagramType });

const attachment = (name, style) => person({ name, attachment: style });

const sectionsText = (report) =>
  report.sections.map((section) => `${section.title}\n${section.body}`).join("\n");

const activatedRules = (a, b) => {
  const pair = { a, b };
  return PAIR_RULES.filter((rule) => {
    try {
      return rule.when(pair);
    } catch {
      return false;
    }
  });
};

describe("controlled synthesis and synastry scenarios", () => {
  test("1 astrology-only profiles keep astrology symbolic and relationship evidence insufficient", () => {
    const aPerson = person({ name: "A" });
    const bPerson = person({ name: "B" });
    const a = buildProfile(aPerson, chart);
    const b = buildProfile(bPerson, chart);

    expect(a.psychometricDomainCount).toBe(0);
    expect(a.symbolicDomainCount).toBe(1);
    expect(a.assessmentDomainCount).toBe(1);
    expect(a.completeness).toBeGreaterThan(0);

    const evidence = synastryEvidence(a, b);
    expect(evidence.level).toBe("insufficient");
    expect(evidence.relationshipDomains).toBe(0);
    expect(evidence.personality).toBe(false);
    expect(evidence.attachment).toBe(false);

    const report = buildSynastry(aPerson, chart, bPerson, chart);
    const text = sectionsText(report);
    expect(report.headline).toBe("Insufficient Data");
    expect(text).toContain("Astrology — Synastry");
    expect(text).toContain("Insufficient evidence");
    expect(text).not.toContain("MBTI Interaction");
    expect(text).not.toContain("Big Five Interaction");
  });

  test("2 personality-only profiles support personality but not attachment observations", () => {
    const aPerson = personality(
      "A",
      "INTJ",
      { Openness: 80, Conscientiousness: 80, Extraversion: 30, Agreeableness: 50, Neuroticism: 50 },
      "5",
    );
    const bPerson = personality(
      "B",
      "ENFP",
      { Openness: 75, Conscientiousness: 50, Extraversion: 80, Agreeableness: 60, Neuroticism: 50 },
      "7",
    );
    const a = buildProfile(aPerson);
    const b = buildProfile(bPerson);

    expect(a.psychometricDomainCount).toBe(3);
    expect(a.symbolicDomainCount).toBe(0);

    const evidence = synastryEvidence(a, b);
    expect(evidence.level).toBe("sufficient");
    expect(evidence.personality).toBe(true);
    expect(evidence.attachment).toBe(false);

    const report = buildSynastry(aPerson, undefined, bPerson, undefined);
    const text = sectionsText(report);
    expect(text).toContain("MBTI Interaction");
    expect(text).toContain("Big Five Interaction");
    expect(text).toContain(
      "Insufficient evidence: both people need a completed attachment assessment",
    );

    const rules = activatedRules(a, b);
    expect(rules.every((rule) => rule.evidence.includes("personality"))).toBe(true);
  });

  test("3 attachment-only profiles support attachment patterns but no personality conclusions", () => {
    const aPerson = attachment("A", "Anxious");
    const bPerson = attachment("B", "Avoidant");
    const a = buildProfile(aPerson);
    const b = buildProfile(bPerson);

    expect(a.psychometricDomainCount).toBe(1);
    expect(a.symbolicDomainCount).toBe(0);

    const evidence = synastryEvidence(a, b);
    expect(evidence.level).toBe("partial");
    expect(evidence.attachment).toBe(true);
    expect(evidence.personality).toBe(false);

    const report = buildSynastry(aPerson, undefined, bPerson, undefined);
    const text = sectionsText(report);
    expect(text).toContain("Attachment Dynamic");
    expect(text).toContain("pursue-withdraw");
    expect(text).not.toContain("MBTI Interaction");
    expect(text).not.toContain("Big Five Interaction");
    expect(text).not.toContain("Enneagram Interaction");
  });

  test("4 clinical-assessment-only profiles remain non-diagnostic and insufficient for relationship evidence", () => {
    const aPerson = person({
      name: "A",
      assessmentResults: {
        "adhd-traits": { inattention: 80, hyperactivity: 70, overall: 75 },
        "autism-quotient": { social: 75, detail: 70, overall: 72 },
      },
    });
    const bPerson = person({
      name: "B",
      assessmentResults: {
        "adhd-traits": { inattention: 65, hyperactivity: 60, overall: 62 },
        "autism-quotient": { social: 68, detail: 75, overall: 70 },
      },
    });
    const a = buildProfile(aPerson);
    const b = buildProfile(bPerson);

    expect(a.psychometricDomainCount).toBe(2);

    const evidence = synastryEvidence(a, b);
    expect(evidence.level).toBe("insufficient");
    expect(evidence.relationshipDomains).toBe(0);
    expect(evidence.clinicalTraits).toBe(true);

    const dossier = buildDossier(aPerson);
    const dossierText = dossier.sections
      .map((section) => `${section.title}\n${section.body}`)
      .join("\n");
    expect(dossierText).toContain("not evidence");
    expect(dossierText).toContain("clinical diagnosis");

    const syn = buildSynastry(aPerson, undefined, bPerson, undefined);
    const text = sectionsText(syn);
    expect(syn.headline).toBe("Insufficient Data");
    expect(text).not.toContain("compatible");
    expect(text).not.toContain("incompatible");
  });

  test("5 mixed personality and attachment evidence activates only complete mixed rules", () => {
    const aPerson = person({
      name: "A",
      mbti: "INFJ",
      bigFive: {
        Openness: 80,
        Conscientiousness: 50,
        Extraversion: 30,
        Agreeableness: 80,
        Neuroticism: 70,
      },
      attachment: "Avoidant",
    });
    const bPerson = person({
      name: "B",
      mbti: "ENFP",
      bigFive: {
        Openness: 75,
        Conscientiousness: 60,
        Extraversion: 80,
        Agreeableness: 50,
        Neuroticism: 50,
      },
      attachment: "Secure",
    });
    const a = buildProfile(aPerson);
    const b = buildProfile(bPerson);

    const evidence = synastryEvidence(a, b);
    expect(evidence.personality).toBe(true);
    expect(evidence.attachment).toBe(true);
    expect(evidence.relationshipDomains).toBe(3);

    const report = buildSynastry(aPerson, undefined, bPerson, undefined);
    const text = sectionsText(report);
    expect(text).toContain("MBTI Interaction");
    expect(text).toContain("Big Five Interaction");
    expect(text).toContain("Attachment Dynamic");

    const rules = activatedRules(a, b);
    const mixed = rules.filter(
      (rule) => rule.evidence.includes("personality") && rule.evidence.includes("attachment"),
    );
    expect(mixed.length).toBeGreaterThanOrEqual(0);

    const attachmentOnly = buildProfile(person({ name: "C", attachment: "Secure" }));
    const personalityOnly = buildProfile(
      person({
        name: "D",
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
    expect(
      activatedRules(attachmentOnly, personalityOnly).every(
        (rule) => !rule.evidence.includes("personality") || !rule.evidence.includes("attachment"),
      ),
    ).toBe(true);
  });

  test("6 full assessment profiles enrich reports without diagnostic or astrology confirmation", () => {
    const full = (name) =>
      person({
        name,
        mbti: "INFJ",
        bigFive: {
          Openness: 80,
          Conscientiousness: 70,
          Extraversion: 30,
          Agreeableness: 80,
          Neuroticism: 70,
        },
        enneagramType: "5",
        attachment: "Secure",
        hexaco: { H: 70, E: 60, X: 40, A: 80, C: 75, O: 85 },
        hsp: 75,
        assessmentResults: {
          "love-styles": { words: 70, time: 80, gifts: 40, service: 75, touch: 60 },
          "emotional-intelligence": { perceiving: 70, using: 65, understanding: 75, managing: 80 },
          resilience: { resilience: 72 },
          "adhd-traits": { inattention: 55, hyperactivity: 40, overall: 50 },
          "autism-quotient": { social: 60, detail: 75, overall: 62 },
        },
      });

    const aPerson = full("A");
    const bPerson = full("B");
    const a = buildProfile(aPerson, chart);
    const b = buildProfile(bPerson, chart);

    expect(a.psychometricDomainCount).toBeGreaterThan(6);
    expect(a.symbolicDomainCount).toBe(1);
    expect(a.assessmentDomainCount).toBe(a.psychometricDomainCount + 1);

    const evidence = synastryEvidence(a, b);
    expect(evidence.personality).toBe(true);
    expect(evidence.attachment).toBe(true);
    expect(evidence.relationshipDomains).toBeGreaterThanOrEqual(4);

    const dossier = buildDossier(aPerson, chart);
    const syn = buildSynastry(aPerson, chart, bPerson, chart);
    const dossierText = sectionsText(dossier);
    const synText = sectionsText(syn);

    expect(dossierText).toContain("HEXACO");
    expect(dossierText).toContain("Love Styles");
    expect(dossierText).toContain("Astrology — Natal Chart");
    expect(dossierText).not.toContain("astrology confirms");
    expect(dossierText).toContain("not a diagnosis");
    expect(synText).toContain("Astrology — Synastry");
    expect(synText).not.toContain("compatible partner");
  });

  test("standalone Love Styles and Resilience results do not become relationship sufficiency evidence", () => {
    const aPerson = person({
      name: "A",
      assessmentResults: {
        "love-styles": { words: 70, time: 80, gifts: 50, service: 75, touch: 60 },
        resilience: { resilience: 72 },
      },
    });
    const bPerson = person({
      name: "B",
      assessmentResults: {
        "love-styles": { words: 65, time: 75, gifts: 55, service: 70, touch: 65 },
        resilience: { resilience: 68 },
      },
    });
    const evidence = synastryEvidence(buildProfile(aPerson), buildProfile(bPerson));
    expect(evidence.sharedDomains).toBe(2);
    expect(evidence.relationshipDomains).toBe(0);
    expect(evidence.level).toBe("insufficient");
  });
});
