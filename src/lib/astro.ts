// Pure helpers + types for natal chart data. Safe to import on client (types/helpers only).

export const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export type Sign = (typeof SIGNS)[number];

export const ELEMENT_OF: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire",
  Leo: "Fire",
  Sagittarius: "Fire",
  Taurus: "Earth",
  Virgo: "Earth",
  Capricorn: "Earth",
  Gemini: "Air",
  Libra: "Air",
  Aquarius: "Air",
  Cancer: "Water",
  Scorpio: "Water",
  Pisces: "Water",
};

export const MODALITY_OF: Record<string, "Cardinal" | "Fixed" | "Mutable"> = {
  Aries: "Cardinal",
  Cancer: "Cardinal",
  Libra: "Cardinal",
  Capricorn: "Cardinal",
  Taurus: "Fixed",
  Leo: "Fixed",
  Scorpio: "Fixed",
  Aquarius: "Fixed",
  Gemini: "Mutable",
  Virgo: "Mutable",
  Sagittarius: "Mutable",
  Pisces: "Mutable",
};

export const SIGN_GLYPH: Record<string, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

export const PLANET_GLYPH: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Rising: "↑",
  Ascendant: "↑",
  Midheaven: "MC",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  Chiron: "⚷",
  Lilith: "⚸",
  "North Node": "☊",
  "South Node": "☋",
};

export type Placement = {
  label: string;
  sign: string;
  degree: string;
  house: number | null;
  retrograde: boolean;
  longitude: number;
};

export type AspectInfo = {
  a: string;
  b: string;
  type: string;
  orb: number;
  level: string;
};

export type NatalChart = {
  place: { label: string; latitude: number; longitude: number };
  local: string;
  placements: Placement[];
  ascendant: { sign: string; degree: string };
  midheaven: { sign: string; degree: string };
  houses: { id: number; sign: string }[];
  aspects: AspectInfo[];
  elements: Record<"Fire" | "Earth" | "Air" | "Water", number>;
  modalities: Record<"Cardinal" | "Fixed" | "Mutable", number>;
  dominantPlanets: { label: string; score: number }[];
  chartShape: string;
  sun: string;
  moon: string;
  rising: string;
};

export function chartSummaryText(chart: NatalChart): string {
  const lines: string[] = [];
  lines.push(`Birth place: ${chart.place.label}`);
  lines.push(`Sun ${chart.sun} | Moon ${chart.moon} | Rising ${chart.rising}`);
  lines.push(
    "Placements: " +
      chart.placements
        .map(
          (p) =>
            `${p.label} in ${p.sign} ${p.degree}${p.house ? ` (house ${p.house})` : ""}${p.retrograde ? " R" : ""}`,
        )
        .join("; "),
  );
  lines.push(
    "Elements: " +
      Object.entries(chart.elements)
        .map(([k, v]) => `${k} ${v}`)
        .join(", "),
  );
  lines.push(
    "Modalities: " +
      Object.entries(chart.modalities)
        .map(([k, v]) => `${k} ${v}`)
        .join(", "),
  );
  lines.push("Chart shape: " + chart.chartShape);
  lines.push(
    "Dominant planets: " + chart.dominantPlanets.map((d) => `${d.label} (${d.score})`).join(", "),
  );
  lines.push(
    "Major aspects: " +
      chart.aspects
        .filter((a) => a.level === "major")
        .slice(0, 20)
        .map((a) => `${a.a} ${a.type} ${a.b} (orb ${a.orb.toFixed(1)}°)`)
        .join("; "),
  );
  return lines.join("\n");
}
