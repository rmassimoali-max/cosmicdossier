import { describe, expect, test } from "bun:test";
import { buildProfile, headlineFor } from "./profile";
import { generateDossier } from "./synthesis";
import { placementText } from "./interpret/astrology";

const person = (overrides = {}) => ({
  name: "Example",
  dob: "",
  birthTime: "",
  birthPlace: "",
  ...overrides,
});

const chart = {
  sun: "Scorpio",
  moon: "Aries",
  rising: "Cancer",
  placements: [],
  aspects: [],
  elements: { Fire: 3, Earth: 1, Air: 1, Water: 6 },
  modalities: { Cardinal: 3, Fixed: 5, Mutable: 3 },
  chartShape: "Bowl",
  place: { label: "Aurora", latitude: 39.7, longitude: -104.8 },
  local: "19:31",
  ascendant: { sign: "Cancer", degree: "5" },
  midheaven: { sign: "Pisces", degree: "13" },
  houses: [],
  dominantPlanets: [],
};

describe("astrology-only dossier evidence and copy", () => {
  test("astrology-only does not assign a personality archetype", () => {
    const profile = buildProfile(person(), chart);
    const report = generateDossier(profile);
    expect(profile.psychometricDomainCount).toBe(0);
    expect(report.headline).toBe("Your Natal Chart");
    const final = report.sections.find((s) => s.title === "The Integrated Read");
    expect(final?.body).toContain("not a psychological personality profile");
    expect(final?.body).not.toContain("reads most consistently as");
    expect(final?.body).toContain("Completed psychological assessment domains: 0");
  });

  test("no-assessment report does not invent an archetype", () => {
    const profile = buildProfile(person());
    expect(headlineFor(profile)).toBe("Your Dossier Preview");
    expect(generateDossier(profile).sections.find((s) => s.title === "The Integrated Read")?.body)
      .toContain("No assessment evidence");
  });

  test("astrology-only report avoids empty strengths and blind-spots headings", () => {
    const report = generateDossier(buildProfile(person(), chart));
    expect(report.sections.find((s) => s.title === "Strengths & Blind Spots")?.body)
      .toContain("A birth chart alone is not evidence");
    expect(report.sections.some((s) => s.title === "Possible Strengths")).toBe(false);
    expect(report.sections.some((s) => s.title === "Possible Blind Spots")).toBe(false);
  });

  test("personality data still provides a personality headline", () => {
    const profile = buildProfile(person({ mbti: "INFJ" }));
    expect(profile.psychometricDomainCount).toBeGreaterThan(0);
    expect(headlineFor(profile)).not.toBe("Your Dossier Preview");
  });

  test("astrological descriptions use the correct article", () => {
    expect(placementText("Sun", "Scorpio", 5, false)).toContain("an intense");
    expect(placementText("Moon", "Aries", 10, false)).toContain("a direct");
  });
});
