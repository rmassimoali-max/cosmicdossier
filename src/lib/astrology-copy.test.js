import { describe, expect, test } from "bun:test";
import { placementText } from "./interpret/astrology";

describe("planet-specific symbolic astrology copy", () => {
  test("same sign differentiates planetary domains", () => {
    const sun = placementText("Sun", "Scorpio", 5, false);
    const mercury = placementText("Mercury", "Scorpio", 5, false);
    const venus = placementText("Venus", "Scorpio", 5, false);
    expect(sun).toContain("identity and creative direction");
    expect(mercury).toContain("thought and communication");
    expect(venus).toContain("affection, attraction and values");
    expect(new Set([sun, mercury, venus]).size).toBe(3);
  });

  test("placements retain symbolic language, valid houses and retrograde context", () => {
    const text = placementText("Mercury", "Scorpio", 5, true);
    expect(text).toContain("symbolically");
    expect(text).toContain("5th house");
    expect(text).toContain("Retrograde motion");
    expect(placementText("Sun", "Scorpio", 99, false)).not.toContain("undefined");
  });

  test("unknown placement values do not invent an interpretation", () => {
    expect(placementText("Unknown", "Scorpio", null, false)).toBe("");
    expect(placementText("Sun", "Unknown", null, false)).toBe("");
  });
});
