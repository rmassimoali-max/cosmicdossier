// Pure, edge-safe ephemeris math built on astronomy-engine (pure ESM, no native deps).
import {
  Body,
  Ecliptic,
  GeoVector,
  SiderealTime,
  type AstroTime,
  MakeTime,
} from "astronomy-engine";
import {
  ELEMENT_OF,
  MODALITY_OF,
  SIGNS,
  type AspectInfo,
  type NatalChart,
  type Placement,
} from "./astro";

const DEG = Math.PI / 180;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

export const PLANETS: { label: string; body: Body }[] = [
  { label: "Sun", body: Body.Sun },
  { label: "Moon", body: Body.Moon },
  { label: "Mercury", body: Body.Mercury },
  { label: "Venus", body: Body.Venus },
  { label: "Mars", body: Body.Mars },
  { label: "Jupiter", body: Body.Jupiter },
  { label: "Saturn", body: Body.Saturn },
  { label: "Uranus", body: Body.Uranus },
  { label: "Neptune", body: Body.Neptune },
  { label: "Pluto", body: Body.Pluto },
];

export const CORE = PLANETS.map((p) => p.label);

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

const ASPECTS: { type: string; angle: number; orb: number; level: "major" | "minor" }[] = [
  { type: "conjunction", angle: 0, orb: 8, level: "major" },
  { type: "opposition", angle: 180, orb: 8, level: "major" },
  { type: "trine", angle: 120, orb: 7, level: "major" },
  { type: "square", angle: 90, orb: 7, level: "major" },
  { type: "sextile", angle: 60, orb: 5, level: "major" },
  { type: "quincunx", angle: 150, orb: 3, level: "minor" },
  { type: "semisquare", angle: 45, orb: 2, level: "minor" },
  { type: "sesquiquadrate", angle: 135, orb: 2, level: "minor" },
  { type: "semisextile", angle: 30, orb: 2, level: "minor" },
  { type: "quintile", angle: 72, orb: 1.5, level: "minor" },
];

export function signOf(longitude: number): string {
  return SIGNS[Math.floor(norm360(longitude) / 30) % 12] as string;
}

export function formatDegree(longitude: number): string {
  const within = norm360(longitude) % 30;
  const deg = Math.floor(within);
  const min = Math.round((within - deg) * 60);
  return `${min === 60 ? deg + 1 : deg}° ${String(min === 60 ? 0 : min).padStart(2, "0")}'`;
}

function obliquity(time: AstroTime): number {
  const t = time.tt / 36525;
  return 23.439291111 - 0.0130041667 * t - 1.66667e-7 * t * t + 5.02778e-7 * t * t * t;
}

function eclipticLongitude(body: Body, time: AstroTime): number {
  const vec = GeoVector(body, time, true);
  return norm360(Ecliptic(vec).elon);
}

function meanNodeLongitude(time: AstroTime): number {
  const t = time.tt / 36525;
  return norm360(125.0445479 - 1934.1362891 * t + 0.0020754 * t * t);
}

/** Ascendant / Midheaven from local sidereal time and geographic latitude. */
export function angles(time: AstroTime, latitude: number, longitude: number) {
  const eps = obliquity(time) * DEG;
  const ramc = norm360(SiderealTime(time) * 15 + longitude) * DEG;
  const phi = latitude * DEG;

  let mc = norm360(Math.atan2(Math.tan(ramc), Math.cos(eps)) / DEG);
  if (Math.abs(norm360(mc) - norm360(ramc / DEG)) > 90 && Math.abs(norm360(mc) - norm360(ramc / DEG)) < 270) {
    mc = norm360(mc + 180);
  }

  let asc = norm360(
    Math.atan2(-Math.cos(ramc), Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)) /
      DEG,
  );
  // The ascendant must lead the midheaven by roughly a quadrant.
  if (norm360(asc - mc) > 180) asc = norm360(asc + 180);

  return { asc, mc };
}

/** Porphyry-style quadrant houses: cusps trisect each ASC/MC quadrant on the ecliptic. */
export function houseCusps(asc: number, mc: number): number[] {
  const ic = norm360(mc + 180);
  const dsc = norm360(asc + 180);
  const q1 = norm360(mc - asc) || 90; // asc -> ic quadrant span (houses 1-3)
  const spanA = norm360(ic - asc);
  const spanB = norm360(dsc - ic);
  const spanC = norm360(mc - dsc);
  const spanD = norm360(asc - mc);
  void q1;
  const cusps = new Array<number>(12);
  cusps[0] = asc;
  cusps[1] = norm360(asc + spanA / 3);
  cusps[2] = norm360(asc + (2 * spanA) / 3);
  cusps[3] = ic;
  cusps[4] = norm360(ic + spanB / 3);
  cusps[5] = norm360(ic + (2 * spanB) / 3);
  cusps[6] = dsc;
  cusps[7] = norm360(dsc + spanC / 3);
  cusps[8] = norm360(dsc + (2 * spanC) / 3);
  cusps[9] = mc;
  cusps[10] = norm360(mc + spanD / 3);
  cusps[11] = norm360(mc + (2 * spanD) / 3);
  return cusps;
}

export function houseOf(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i] as number;
    const end = cusps[(i + 1) % 12] as number;
    const span = norm360(end - start) || 360;
    if (norm360(longitude - start) < span) return i + 1;
  }
  return 1;
}

export function computeAspects(placements: Placement[]): AspectInfo[] {
  const pool = placements.filter(
    (p) => CORE.includes(p.label) || ["Rising", "Midheaven", "North Node"].includes(p.label),
  );
  const out: AspectInfo[] = [];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i] as Placement;
      const b = pool[j] as Placement;
      let sep = norm360(a.longitude - b.longitude);
      if (sep > 180) sep = 360 - sep;
      for (const def of ASPECTS) {
        const orb = Math.abs(sep - def.angle);
        if (orb <= def.orb) {
          out.push({ a: a.label, b: b.label, type: def.type, orb, level: def.level });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

export function chartShape(longs: number[]): string {
  if (longs.length < 5) return "Undetermined";
  const sorted = [...longs].map(norm360).sort((a, b) => a - b);
  const gaps = sorted.map((v, i) => {
    const next = sorted[(i + 1) % sorted.length] ?? v;
    return norm360(next - v);
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

/** Offset in minutes for an IANA timezone at a given UTC instant. */
function tzOffsetMinutes(timeZone: string, utcMs: number): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts["year"]),
    Number(parts["month"]) - 1,
    Number(parts["day"]),
    Number(parts["hour"]) % 24,
    Number(parts["minute"]),
    Number(parts["second"]),
  );
  return (asUtc - utcMs) / 60000;
}

export function localToUtc(
  date: string,
  time: string,
  timeZone: string | undefined,
): { utc: Date; offsetMinutes: number } {
  const [y = 2000, m = 1, d = 1] = date.split("-").map(Number);
  const [hh = 12, mm = 0] = (time || "12:00").split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  if (!timeZone) return { utc: new Date(naive), offsetMinutes: 0 };
  let offset = tzOffsetMinutes(timeZone, naive);
  offset = tzOffsetMinutes(timeZone, naive - offset * 60000);
  return { utc: new Date(naive - offset * 60000), offsetMinutes: offset };
}

export function buildChart(args: {
  date: string;
  time: string | undefined;
  latitude: number;
  longitude: number;
  placeLabel: string;
  timeZone?: string | undefined;
}): NatalChart {
  const timeStr = args.time || "12:00";
  const { utc } = localToUtc(args.date, timeStr, args.timeZone);
  const time = MakeTime(utc);
  const later = MakeTime(new Date(utc.getTime() + 12 * 3600 * 1000));

  const { asc, mc } = angles(time, args.latitude, args.longitude);
  const cusps = houseCusps(asc, mc);

  const make = (label: string, longitude: number, retrograde = false): Placement => ({
    label,
    sign: signOf(longitude),
    degree: formatDegree(longitude),
    house: houseOf(longitude, cusps),
    retrograde,
    longitude: norm360(longitude),
  });

  const planets = PLANETS.map(({ label, body }) => {
    const lon = eclipticLongitude(body, time);
    const lonLater = eclipticLongitude(body, later);
    let delta = norm360(lonLater - lon);
    if (delta > 180) delta -= 360;
    return make(label, lon, delta < 0);
  });

  const node = meanNodeLongitude(time);

  const placements: Placement[] = [
    ...planets,
    { ...make("Rising", asc), house: 1 },
    { ...make("Midheaven", mc), house: 10 },
    make("North Node", node, true),
    make("South Node", norm360(node + 180), true),
  ];

  const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modalities = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of placements) {
    if (!CORE.includes(p.label) && p.label !== "Rising") continue;
    const el = ELEMENT_OF[p.sign];
    const mo = MODALITY_OF[p.sign];
    if (el) elements[el] += 1;
    if (mo) modalities[mo] += 1;
  }

  const aspects = computeAspects(placements);
  const aspectCount: Record<string, number> = {};
  for (const a of aspects) {
    if (a.level !== "major") continue;
    aspectCount[a.a] = (aspectCount[a.a] ?? 0) + 1;
    aspectCount[a.b] = (aspectCount[a.b] ?? 0) + 1;
  }

  const dominantPlanets = planets
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
    place: { label: args.placeLabel, latitude: args.latitude, longitude: args.longitude },
    local: `${args.date} ${timeStr}`,
    placements,
    ascendant: { sign: signOf(asc), degree: formatDegree(asc) },
    midheaven: { sign: signOf(mc), degree: formatDegree(mc) },
    houses: cusps.map((c, i) => ({ id: i + 1, sign: signOf(c) })),
    aspects,
    elements,
    modalities,
    dominantPlanets,
    chartShape: chartShape(planets.map((p) => p.longitude)),
    sun: planets.find((p) => p.label === "Sun")?.sign ?? "—",
    moon: planets.find((p) => p.label === "Moon")?.sign ?? "—",
    rising: signOf(asc),
  };
}
