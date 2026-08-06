import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  ELEMENT_OF,
  MODALITY_OF,
  type AspectInfo,
  type NatalChart,
  type Placement,
} from "./astro";

const Input = z.object({
  date: z.string(), // YYYY-MM-DD
  time: z.string().optional(), // HH:MM
  place: z.string().min(1),
});

const WEIGHTS: Record<string, number> = {
  Sun: 6,
  Moon: 6,
  Mercury: 4,
  Venus: 4,
  Mars: 4,
  Jupiter: 3,
  Saturn: 3,
  Uranus: 2,
  Neptune: 2,
  Pluto: 2,
};

const CORE = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

function chartShape(longs: number[]): string {
  if (longs.length < 5) return "Undetermined";
  const sorted = [...longs].sort((a, b) => a - b);
  const gaps = sorted.map((v, i) => {
    const next = sorted[(i + 1) % sorted.length] ?? v;
    return (next - v + 360) % 360;
  });
  const maxGap = Math.max(...gaps);
  const span = 360 - maxGap;
  const big = gaps.filter((g) => g >= 60).length;
  if (span <= 120) return "Bundle — concentrated focus in one life area";
  if (span <= 180) return "Bowl — a self-contained hemisphere, seeking what is missing";
  if (span <= 240) return "Locomotive — a driving engine with one open trailing gap";
  if (big >= 2) return "Splay / Seesaw — energy split between opposing arenas";
  return "Splash — energy distributed widely across many arenas";
}

export const computeNatalChart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<NatalChart> => {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=${encodeURIComponent(
        data.place,
      )}`,
    );
    const geo = (await geoRes.json()) as {
      results?: { name: string; country?: string; admin1?: string; latitude: number; longitude: number }[];
    };
    const hit = geo.results?.[0];
    if (!hit) throw new Error(`Could not find birth place "${data.place}". Try "City, Country".`);

    // The package's "module" field points at files it does not ship, so resolve the
    // built CommonJS bundle explicitly and let Vite's interop unwrap it.
    // The UMD bundle references a bare `module` global; provide one before loading.
    const g = globalThis as any;
    if (typeof g.module === "undefined") g.module = { exports: {} };
    const mod: any = await import(
      /* @vite-ignore */ "circular-natal-horoscope-js/dist/index.js"
    );
    const candidates = [mod, mod?.default, g.module?.exports, g.module?.exports?.default];
    const lib = candidates.find((c: any) => typeof c?.Origin === "function");
    if (!lib) throw new Error("Astrology engine failed to load.");
    const { Origin, Horoscope } = lib as typeof import("circular-natal-horoscope-js");

    const [y = 2000, m = 1, d = 1] = data.date.split("-").map(Number);
    const [hh = 12, mm = 0] = (data.time || "12:00").split(":").map(Number);

    const origin = new Origin({
      year: y,
      month: m - 1,
      date: d,
      hour: hh,
      minute: mm,
      latitude: hit.latitude,
      longitude: hit.longitude,
    });

    const h = new Horoscope({
      origin,
      houseSystem: "placidus",
      zodiac: "tropical",
      aspectPoints: ["bodies", "points", "angles"],
      aspectWithPoints: ["bodies", "points", "angles"],
      aspectTypes: ["major", "minor"],
      language: "en",
    });

    const toPlacement = (b: any): Placement => ({
      label: b.label,
      sign: b.Sign?.label ?? "—",
      degree: b.ChartPosition?.Ecliptic?.ArcDegreesFormatted30 ?? "",
      house: b.House?.id ?? null,
      retrograde: Boolean(b.isRetrograde),
      longitude: b.ChartPosition?.Ecliptic?.DecimalDegrees ?? 0,
    });

    const bodies = (h.CelestialBodies.all as any[])
      .filter((b) => b.label !== "Sirius")
      .map(toPlacement);
    const points = (h.CelestialPoints.all as any[]).map(toPlacement);

    const asc = h.Ascendant as any;
    const mc = h.Midheaven as any;

    const placements: Placement[] = [
      ...bodies,
      { ...toPlacement(asc), label: "Rising" },
      { ...toPlacement(mc), label: "Midheaven" },
      ...points,
    ];

    const aspects: AspectInfo[] = (h.Aspects.all as any[]).map((a) => ({
      a: a.point1Label,
      b: a.point2Label,
      type: a.label,
      orb: a.orb,
      level: a.aspectLevel,
    }));

    const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    const modalities = { Cardinal: 0, Fixed: 0, Mutable: 0 };
    for (const p of placements) {
      if (!CORE.includes(p.label) && p.label !== "Rising") continue;
      const el = ELEMENT_OF[p.sign];
      const mo = MODALITY_OF[p.sign];
      if (el) elements[el] += 1;
      if (mo) modalities[mo] += 1;
    }

    const aspectCount: Record<string, number> = {};
    for (const a of aspects) {
      if (a.level !== "major") continue;
      aspectCount[a.a] = (aspectCount[a.a] ?? 0) + 1;
      aspectCount[a.b] = (aspectCount[a.b] ?? 0) + 1;
    }

    const dominantPlanets = placements
      .filter((p) => CORE.includes(p.label))
      .map((p) => {
        let score = WEIGHTS[p.label] ?? 1;
        if (p.house === 1 || p.house === 10) score += 3;
        if (p.house === 4 || p.house === 7) score += 1;
        score += Math.min(aspectCount[p.label] ?? 0, 6);
        return { label: p.label, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      place: {
        label: [hit.name, hit.admin1, hit.country].filter(Boolean).join(", "),
        latitude: hit.latitude,
        longitude: hit.longitude,
      },
      local: `${data.date} ${data.time || "12:00"}`,
      placements,
      ascendant: { sign: asc.Sign.label, degree: asc.ChartPosition.Ecliptic.ArcDegreesFormatted30 },
      midheaven: { sign: mc.Sign.label, degree: mc.ChartPosition.Ecliptic.ArcDegreesFormatted30 },
      houses: (h.Houses as any[]).map((x) => ({ id: x.id, sign: x.Sign.label })),
      aspects,
      elements,
      modalities,
      dominantPlanets,
      chartShape: chartShape(
        placements.filter((p) => CORE.includes(p.label)).map((p) => p.longitude),
      ),
      sun: placements.find((p) => p.label === "Sun")?.sign ?? "—",
      moon: placements.find((p) => p.label === "Moon")?.sign ?? "—",
      rising: asc.Sign.label,
    };
  });
