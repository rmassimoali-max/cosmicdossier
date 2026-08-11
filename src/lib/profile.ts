// Builds a normalized Profile from stored person data + chart. Pure, deterministic.
import type { NatalChart } from "./astro";
import type { PersonInput } from "./session";
import { MBTI_LIBRARY, type MbtiProfile } from "./interpret/mbti";
import { ENNEAGRAM_LIBRARY, type EnneaProfile } from "./interpret/enneagram";
import {
  ATTACHMENT_LIBRARY,
  normalizeAttachment,
  type AttachmentProfile,
} from "./interpret/attachment";
import { BIG_FIVE, band, type Band, type BigFiveTrait } from "./interpret/bigfive";

export type Profile = {
  person: PersonInput;
  name: string;
  chart?: NatalChart | undefined;
  mbti?: MbtiProfile | undefined;
  mbtiLetters: string[];
  bigFive?: Record<string, number> | undefined;
  bands: Partial<Record<BigFiveTrait, Band>>;
  ennea?: EnneaProfile | undefined;
  wing?: number | undefined;
  instinct?: string | undefined;
  attachment?: AttachmentProfile | undefined;
  has: {
    chart: boolean;
    mbti: boolean;
    bigFive: boolean;
    ennea: boolean;
    attachment: boolean;
  };
  completeness: number; // 0-100
};

export function buildProfile(person: PersonInput, chart?: NatalChart | undefined): Profile {
  const mbtiType = (person.mbti || "").toUpperCase();
  const mbti = MBTI_LIBRARY[mbtiType];
  const coreType = person.enneagramType ? Number(person.enneagramType) : undefined;
  const ennea = coreType ? ENNEAGRAM_LIBRARY[coreType] : undefined;
  const attStyle = normalizeAttachment(person.attachment);
  const attachment = attStyle ? ATTACHMENT_LIBRARY[attStyle] : undefined;

  const bands: Partial<Record<BigFiveTrait, Band>> = {};
  if (person.bigFive) {
    for (const t of BIG_FIVE) {
      const v = person.bigFive[t];
      if (typeof v === "number") bands[t] = band(v);
    }
  }

  const has = {
    chart: Boolean(chart),
    mbti: Boolean(mbti),
    bigFive: Boolean(person.bigFive),
    ennea: Boolean(ennea),
    attachment: Boolean(attachment),
  };
  const completeness = Math.round((Object.values(has).filter(Boolean).length / 5) * 100);

  return {
    person,
    name: person.name?.trim() || "This profile",
    chart,
    mbti,
    mbtiLetters: mbti ? mbti.type.split("") : [],
    bigFive: person.bigFive,
    bands,
    ennea,
    wing: person.enneagramWing ? Number(person.enneagramWing) : undefined,
    instinct: person.enneagramInstinct,
    attachment,
    has,
    completeness,
  };
}

export const isL = (p: Profile, letter: string) => p.mbtiLetters.includes(letter);
export const isBand = (p: Profile, trait: BigFiveTrait, b: Band | Band[]) => {
  const v = p.bands[trait];
  return v ? (Array.isArray(b) ? b.includes(v) : v === b) : false;
};
export const score = (p: Profile, trait: BigFiveTrait) => p.bigFive?.[trait];
export const att = (p: Profile) => p.attachment?.style;
export const enneaType = (p: Profile) => p.ennea?.type;

export function headlineFor(p: Profile): string {
  const bits: string[] = [];
  if (isL(p, "N")) bits.push("Pattern-Reader");
  else if (isL(p, "S")) bits.push("Grounded");
  if (isBand(p, "Conscientiousness", "high")) bits.push("Disciplined");
  if (isBand(p, "Openness", "high") && !bits.includes("Pattern-Reader")) bits.push("Restless");
  const nouns: Record<number, string> = {
    1: "Perfecter",
    2: "Caretaker",
    3: "Performer",
    4: "Individualist",
    5: "Observer",
    6: "Sentinel",
    7: "Seeker",
    8: "Protector",
    9: "Harmoniser",
  };
  const noun = p.ennea ? nouns[p.ennea.type] : isL(p, "F") ? "Empath" : "Strategist";
  const prefix = isL(p, "I") ? "Interior" : "Outward";
  const label = [prefix, ...bits.slice(0, 1), noun].filter(Boolean).join(" ");
  return `The ${label}`;
}

export function dominantTraits(p: Profile): string[] {
  const out: string[] = [];
  if (p.mbti) out.push(p.mbti.nickname.replace("The ", ""));
  if (p.ennea) out.push(p.ennea.name.replace("The ", ""));
  if (p.attachment) out.push(`${p.attachment.style} attachment`);
  if (p.bigFive) {
    const ranked = BIG_FIVE.map((t) => ({ t, v: p.bigFive?.[t] ?? 50 })).sort((a, b) => b.v - a.v);
    const top = ranked[0];
    const low = ranked[ranked.length - 1];
    if (top) out.push(`High ${top.t}`);
    if (low) out.push(`Low ${low.t}`);
  }
  if (p.chart) out.push(`${p.chart.sun} Sun`, `${p.chart.moon} Moon`, `${p.chart.rising} Rising`);
  return out.slice(0, 9);
}
