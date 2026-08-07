import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chartSummaryText, type NatalChart } from "./astro";
import { callChat } from "./ai-provider.server";
import type { Dossier, PersonInput } from "./session";


const PersonSchema = z.object({
  name: z.string(),
  dob: z.string(),
  birthTime: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.string().optional(),
  relationshipStatus: z.string().optional(),
  mbti: z.string().optional(),
  mbtiEstimates: z.array(z.object({ label: z.string(), percent: z.number() })).optional(),
  enneagramType: z.string().optional(),
  enneagramWing: z.string().optional(),
  enneagramInstinct: z.string().optional(),
  attachment: z.string().optional(),
  bigFive: z.record(z.number()).optional(),
});

const ChartSchema = z.any();

const VOICE = `You are the author of "Cosmic Dossier": a literate, warm, precise personality writer.
Rules:
- WEAVE the systems together. Never present astrology, MBTI, Enneagram, attachment and Big Five as separate silos: name where two or more systems converge on the same underlying pattern, and where they contradict.
- Use hedged, descriptive language about astrology ("whether one reads these systems as symbolic or descriptive, they point toward...").
- Second person ("you"). Specific, non-generic, no flattery filler, no horoscope clichés.
- Reference actual placements, aspects, type dynamics and scores that were provided. Never invent placements.
- Each section body: 90-160 words of flowing prose. No bullet lists inside bodies.
Return ONLY valid JSON, no markdown fences.`;




function parseDossier(raw: string): Dossier {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  let parsed: any;
  try {
    parsed = JSON.parse(slice);
  } catch {
    return {
      headline: "Your Dossier",
      synthesis: cleaned.slice(0, 2000),
      dominantTraits: [],
      sections: [],
    };
  }
  return {
    headline: String(parsed.headline ?? "Your Dossier"),
    synthesis: String(parsed.synthesis ?? ""),
    dominantTraits: Array.isArray(parsed.dominantTraits)
      ? parsed.dominantTraits.map((t: unknown) => String(t)).slice(0, 10)
      : [],
    sections: Array.isArray(parsed.sections)
      ? parsed.sections
          .filter((s: any) => s && s.title)
          .map((s: any) => ({ title: String(s.title), body: String(s.body ?? "") }))
      : [],
  };
}

function personBrief(p: PersonInput | z.infer<typeof PersonSchema>, chart?: NatalChart) {
  const lines = [
    `Name: ${p.name || "Anonymous"}`,
    `Born: ${p.dob} ${p.birthTime || "(time unknown — treat house/rising cautiously)"} in ${p.birthPlace}`,
  ];
  if (p.gender) lines.push(`Gender: ${p.gender}`);
  if (p.relationshipStatus) lines.push(`Relationship status: ${p.relationshipStatus}`);
  if (p.mbti) lines.push(`MBTI: ${p.mbti}`);
  if ((p as PersonInput).mbtiEstimates?.length)
    lines.push(
      `MBTI estimate distribution: ` +
        (p as PersonInput).mbtiEstimates!.map((e) => `${e.label} ${e.percent}%`).join(", "),
    );
  if (p.enneagramType)
    lines.push(
      `Enneagram: type ${p.enneagramType}${p.enneagramWing ? `w${p.enneagramWing}` : ""}${
        p.enneagramInstinct ? `, instinct ${p.enneagramInstinct}` : ""
      }`,
    );
  if (p.attachment) lines.push(`Attachment style: ${p.attachment}`);
  if (p.bigFive)
    lines.push(
      "Big Five (0-100): " +
        Object.entries(p.bigFive)
          .map(([k, v]) => `${k} ${v}`)
          .join(", "),
    );
  if (chart) lines.push("NATAL CHART:\n" + chartSummaryText(chart));
  return lines.join("\n");
}

const DOSSIER_SECTIONS = [
  "Core Motivations",
  "Inner World & Emotional Processing",
  "Strengths",
  "Blind Spots",
  "Communication Style",
  "Stress Responses",
  "Love Style",
  "Friendship Style",
  "Relationship Dynamics",
  "Career & Vocation",
  "Healing Patterns",
  "Personal Growth Path",
];

export const generateDossier = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ person: PersonSchema, chart: ChartSchema }).parse(d),
  )
  .handler(async ({ data }): Promise<Dossier> => {
    const user = `Write the personal Cosmic Dossier for this person.

${personBrief(data.person, data.chart as NatalChart)}

Return JSON of exactly this shape:
{
  "headline": "a short evocative epithet for this person, max 8 words",
  "synthesis": "180-260 words: the single integrated read of this person, explicitly braiding their chart, MBTI, Enneagram, attachment style and Big Five into one pattern",
  "dominantTraits": ["6-8 short trait phrases, 2-5 words each"],
  "sections": [${DOSSIER_SECTIONS.map((s) => `{"title":"${s}","body":"..."}`).join(",")}]
}`;
    return parseDossier(await callChat(VOICE, user));
  });

export const generateSynastry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        person1: PersonSchema,
        chart1: ChartSchema,
        person2: PersonSchema,
        chart2: ChartSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<Dossier> => {
    const user = `Write the relational Synastry & Compatibility dossier for these two people. Compare their charts directly (cross-aspects between their planets, element/modality mix, angles), and cross-reference MBTI, Enneagram, attachment styles and Big Five. Be honest about friction, not just harmony. Never reduce them to a single percentage.

PERSON 1
${personBrief(data.person1, data.chart1 as NatalChart)}

PERSON 2
${personBrief(data.person2, data.chart2 as NatalChart)}

Return JSON of exactly this shape:
{
  "headline": "a short evocative name for this pairing's dynamic, max 8 words",
  "synthesis": "180-260 words on the core dynamic between them",
  "dominantTraits": ["5-7 short phrases naming the relationship's signature qualities"],
  "sections": [
    {"title":"Emotional Compatibility","body":"..."},
    {"title":"Communication","body":"..."},
    {"title":"Conflict Patterns","body":"..."},
    {"title":"Physical Chemistry","body":"..."},
    {"title":"Attachment Interplay","body":"..."},
    {"title":"Love Languages","body":"..."},
    {"title":"Growth Areas","body":"..."},
    {"title":"Potential Challenges","body":"..."}
  ]
}`;
    return parseDossier(await callChat(VOICE, user));
  });
