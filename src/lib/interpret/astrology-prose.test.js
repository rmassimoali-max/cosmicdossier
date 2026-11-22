import { describe, expect, test } from "bun:test";
import { aspectText, placementText } from "./astrology";

describe("astrology report prose", () => {
  test("placements use grammatically consistent framing", () => {
    const sun = placementText("Sun", "Scorpio", 5, false);
    const moon = placementText("Moon", "Aries", 10, false);
    const mercury = placementText("Mercury", "Scorpio", 5, true);
    expect(sun).toContain("brings an intense and penetrating quality to identity");
    expect(moon).toContain("brings a direct and initiating quality to emotional rhythms");
    expect(mercury).toContain("Retrograde motion");
    expect(sun).not.toContain("direction takes on");
    expect(moon).not.toContain("comfort takes on");
  });

  test("aspects identify each planetary theme without run-on conjunctions", () => {
    const conjunction = aspectText("Sun", "Mercury", "conjunction");
    expect(conjunction).toContain("the Sun theme (identity and creative direction)");
    expect(conjunction).toContain("the Mercury theme (thought and communication)");
    expect(conjunction).toContain("fuse");
    expect(aspectText("Venus", "Pluto", "conjunction")).toContain("fuse");
    expect(aspectText("Mars", "Uranus", "sextile")).toContain("assist each other");
  });
});
