// Deterministic cross-sectional synthesis engine.
// Same interface an AI provider could implement later: generateDossier(profile).

import { GROUPS, type Report, type ReportSection } from "./report";
import {
  buildProfile,
  dominantTraits,
  headlineFor,
  isBand,
  isL,
  score,
  type Profile,
} from "./profile";
import { BIG_FIVE, bigFiveEntry, BAND_LABEL, BIG_FIVE_BLURB } from "./interpret/bigfive";
import { mbtiDimensionText } from "./interpret/mbti";
import { wingText } from "./interpret/enneagram";
import {
  ASTROLOGY_DISCLAIMER,
  aspectText,
  elementText,
  modalityText,
  placementText,
} from "./interpret/astrology";
import type { NatalChart } from "./astro";
import type { PersonInput } from "./session";

/* ------------------------------- rule engine ------------------------------ */

type RuleKind = "convergence" | "contradiction" | "amplifier" | "tension" | "hidden";
type Rule = { kind: RuleKind; when: (p: Profile) => boolean; text: (p: Profile) => string };

const R = (kind: RuleKind, when: Rule["when"], text: string | Rule["text"]): Rule => ({
  kind,
  when,
  text: typeof text === "string" ? () => text : text,
});

export const RULES: Rule[] = [
  /* ---- MBTI <-> Big Five ---- */
  R(
    "convergence",
    (p) => isL(p, "I") && isBand(p, "Extraversion", "low"),
    "Your MBTI introversion and your low Big Five Extraversion agree: solitude is not a preference you can talk yourself out of, it is how your system refuels.",
  ),
  R(
    "contradiction",
    (p) => isL(p, "I") && isBand(p, "Extraversion", "high"),
    "Your type reads as introverted while your measured Extraversion is high. That usually means you are socially capable and outwardly warm, but the energy is spent rather than generated — a sociable introvert who pays afterwards.",
  ),
  R(
    "convergence",
    (p) => isL(p, "N") && isBand(p, "Openness", "high"),
    "Intuition and high Openness converge on the same appetite: you would rather understand a pattern than memorise a procedure, and unfamiliar territory reliably interests you more than mastery of the known.",
  ),
  R(
    "contradiction",
    (p) => isL(p, "N") && isBand(p, "Openness", "low"),
    "Abstract preference sits beside low measured Openness — you may think conceptually but live conservatively, generating ideas you rarely act on.",
  ),
  R(
    "convergence",
    (p) => isL(p, "J") && isBand(p, "Conscientiousness", "high"),
    "Judging preference and high Conscientiousness reinforce each other: closure calms you, and unfinished things carry a low background hum until they are handled.",
  ),
  R(
    "tension",
    (p) => isL(p, "J") && isBand(p, "Conscientiousness", "low"),
    "You want things settled but do not reliably execute the structure that would settle them. The gap between intended order and actual order is likely a recurring source of self-criticism.",
  ),
  R(
    "convergence",
    (p) => isL(p, "F") && isBand(p, "Agreeableness", "high"),
    "Feeling preference and high Agreeableness stack: the relational cost of a decision registers before its logic does.",
  ),
  R(
    "contradiction",
    (p) => isL(p, "F") && isBand(p, "Agreeableness", "low"),
    "You weigh values heavily but are not automatically accommodating — a combination that produces principled bluntness: warm about people in general, unyielding in the specific case.",
  ),
  R(
    "contradiction",
    (p) => isL(p, "T") && isBand(p, "Agreeableness", "high"),
    "Thinking preference with high Agreeableness means you reason coldly and deliver warmly, which can leave people unsure whether they were just helped or just assessed.",
  ),

  /* ---- MBTI <-> Enneagram ---- */
  R(
    "amplifier",
    (p) => isL(p, "I") && [4, 5, 9].includes(p.ennea?.type ?? 0),
    (p) =>
      `Introversion amplifies your Type ${p.ennea?.type} withdrawal reflex. Retreat is both your recovery strategy and your avoidance strategy, and from the inside the two feel identical.`,
  ),
  R(
    "amplifier",
    (p) => isL(p, "J") && [1, 3, 6].includes(p.ennea?.type ?? 0),
    (p) =>
      `Your Judging preference sharpens the Type ${p.ennea?.type} drive: standards become schedules, and self-worth quietly attaches to whether the plan was met.`,
  ),
  R(
    "tension",
    (p) => isL(p, "P") && [1, 3].includes(p.ennea?.type ?? 0),
    "You hold high internal standards while resisting fixed structure, so you often judge unstructured output by structured criteria — a reliable recipe for feeling behind.",
  ),
  R(
    "hidden",
    (p) => isL(p, "N") && p.ennea?.type === 5,
    "Intuition plus a Five's conservation of energy produces someone who can build an entire model of a situation without entering it. The risk is a rich understanding of things you never actually did.",
  ),
  R(
    "hidden",
    (p) => isL(p, "E") && p.ennea?.type === 7,
    "Extraversion and Type 7 make momentum your anaesthetic: nothing hurts while there is a next thing.",
  ),

  /* ---- Attachment <-> Big Five ---- */
  R(
    "amplifier",
    (p) => p.attachment?.style === "Anxious" && isBand(p, "Neuroticism", "high"),
    "Anxious attachment on top of high Neuroticism is the sharpest combination in your profile: ambiguity does not stay neutral for long, and a delayed reply can generate a full narrative before any facts arrive.",
  ),
  R(
    "convergence",
    (p) => p.attachment?.style === "Secure" && isBand(p, "Neuroticism", ["low", "moderate"]),
    "Secure attachment with a settled threat system means you can usually stay in a hard conversation without needing it resolved immediately.",
  ),
  R(
    "tension",
    (p) => p.attachment?.style === "Avoidant" && isBand(p, "Agreeableness", "high"),
    "High Agreeableness with avoidant attachment produces conflict suppression: you accommodate rather than argue, then create distance instead of stating the objection. The complaint never gets made, only enacted.",
  ),
  R(
    "hidden",
    (p) => p.attachment?.style === "Fearful-Avoidant" && isBand(p, "Openness", "high"),
    "Fearful-avoidance with high Openness gives you unusual insight into your own cycle — you can narrate the approach-and-retreat pattern accurately while still inside it. Insight is not yet regulation.",
  ),
  R(
    "amplifier",
    (p) => p.attachment?.style === "Avoidant" && isBand(p, "Extraversion", "low"),
    "Low Extraversion and avoidant attachment reinforce the same move: withdrawal reads to you as rest and to a partner as disappearance.",
  ),
  R(
    "convergence",
    (p) => p.attachment?.style === "Anxious" && isBand(p, "Agreeableness", "high"),
    "Anxious attachment plus high Agreeableness means you tend to over-adapt inside relationships and only notice the cost once resentment has already collected.",
  ),

  /* ---- Enneagram <-> Attachment ---- */
  R(
    "convergence",
    (p) => p.ennea?.type === 2 && p.attachment?.style === "Anxious",
    "Type 2 and anxious attachment describe the same engine from two angles: closeness secured by usefulness, with your own needs filed last.",
  ),
  R(
    "convergence",
    (p) => p.ennea?.type === 5 && p.attachment?.style === "Avoidant",
    "Type 5 and avoidant attachment converge on conservation: intimacy is priced in energy, and the price feels high before it feels worth it.",
  ),
  R(
    "convergence",
    (p) => p.ennea?.type === 6 && p.attachment?.style === "Anxious",
    "Type 6 vigilance and anxious attachment reinforce each other into relational scanning: you check for inconsistency and then feel guilty for checking.",
  ),
  R(
    "contradiction",
    (p) => p.ennea?.type === 8 && p.attachment?.style === "Fearful-Avoidant",
    "Type 8's refusal to be vulnerable sits over fearful-avoidant longing for closeness. Outwardly formidable, inwardly ambivalent — few people see the second half.",
  ),
  R(
    "tension",
    (p) => p.ennea?.type === 9 && p.attachment?.style === "Avoidant",
    "Nine merging and avoidant distancing pull opposite ways: you go along with things and then quietly leave the room emotionally.",
  ),

  /* ---- Astrology <-> psychology ---- */
  R(
    "convergence",
    (p) => Boolean(p.chart) && (p.chart?.elements.Water ?? 0) >= 4 && isBand(p, "Neuroticism", "high"),
    "A water-weighted chart and high Neuroticism point at the same sensitivity: you register atmosphere early and carry it longer than the people who produced it.",
  ),
  R(
    "convergence",
    (p) => Boolean(p.chart) && (p.chart?.elements.Air ?? 0) >= 4 && isL(p, "N"),
    "Air emphasis in the chart matches your intuitive preference — you process by abstraction and language rather than by sensation.",
  ),
  R(
    "contradiction",
    (p) => Boolean(p.chart) && (p.chart?.elements.Fire ?? 0) >= 4 && isBand(p, "Extraversion", "low"),
    "Fire emphasis with low Extraversion is a genuine internal contradiction: strong drive and appetite, low tolerance for the social exposure that usually carries it. Ambition that prefers to work privately.",
  ),
  R(
    "convergence",
    (p) => Boolean(p.chart) && (p.chart?.elements.Earth ?? 0) >= 4 && isBand(p, "Conscientiousness", "high"),
    "Earth-heavy chart and high Conscientiousness say the same thing in two languages: you are trusted with things because you finish them.",
  ),
  R(
    "hidden",
    (p) => Boolean(p.chart) && p.chart?.modalities.Fixed !== undefined && (p.chart?.modalities.Fixed ?? 0) >= 5 && isL(p, "P"),
    "A fixed-heavy chart under a Perceiving preference produces someone flexible about plans and immovable about positions.",
  ),
  R(
    "hidden",
    (p) => Boolean(p.chart) && (p.chart?.aspects.filter((a) => a.type === "square").length ?? 0) >= 5,
    "Your chart carries an unusual number of squares. Read symbolically, that suggests a life organised around friction that produces capability rather than ease that produces comfort.",
  ),

  /* ---- Three-system combinations ---- */
  R(
    "hidden",
    (p) => isL(p, "I") && isBand(p, "Openness", "high") && p.attachment?.style !== "Secure",
    "Interior, curious and not-yet-secure is a specific combination: you can build an extremely accurate map of intimacy while keeping the territory at arm's length.",
  ),
  R(
    "amplifier",
    (p) =>
      isBand(p, "Conscientiousness", "high") &&
      isBand(p, "Neuroticism", "high") &&
      [1, 3, 6].includes(p.ennea?.type ?? 0),
    "High standards, a sensitive threat system and a compliance-oriented Enneagram type stack into over-functioning: you will meet the bar and still feel you got away with something.",
  ),
  R(
    "tension",
    (p) => isBand(p, "Agreeableness", "high") && isBand(p, "Conscientiousness", "high") && isL(p, "F"),
    "Warmth, duty and value-driven decisions combine into difficulty refusing legitimate requests. The word 'no' feels like a character flaw rather than a boundary.",
  ),
];

/* --------------------------- composition helpers -------------------------- */

const KIND_TITLE: Record<RuleKind, string> = {
  convergence: "Convergences",
  contradiction: "Contradictions",
  amplifier: "Amplifiers",
  tension: "Tensions",
  hidden: "Hidden Patterns",
};

const KIND_INTRO: Record<RuleKind, string> = {
  convergence: "Where two or more of your systems describe the same underlying trait, the reading gets more reliable.",
  contradiction: "Where systems disagree, the disagreement itself is usually the interesting part.",
  amplifier: "Some of your traits do not just coexist — they multiply each other.",
  tension: "These pairs pull you in different directions and are likely to feel like internal argument.",
  hidden: "Combinations that none of the five systems would surface on its own.",
};

function matched(p: Profile) {
  const out: Record<RuleKind, string[]> = {
    convergence: [],
    contradiction: [],
    amplifier: [],
    tension: [],
    hidden: [],
  };
  for (const rule of RULES) {
    try {
      if (rule.when(p)) out[rule.kind].push(rule.text(p));
    } catch {
      /* skip malformed data */
    }
  }
  return out;
}

function join(parts: (string | undefined | false)[], sep = " ") {
  return parts.filter(Boolean).join(sep);
}

/* -------------------------------- sections -------------------------------- */

function lensSections(p: Profile): ReportSection[] {
  const out: ReportSection[] = [];

  if (p.chart) {
    const c = p.chart;
    const bigThree = ["Sun", "Moon", "Rising"] as const;
    const core = c.placements.filter((pl) => ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(pl.label));
    out.push({
      group: GROUPS.lenses,
      title: "Astrology — Natal Chart",
      body: join([
        `${c.sun} Sun, ${c.moon} Moon, ${c.rising} Rising, calculated for ${c.place.label} at ${c.local}.`,
        elementText(c.elements),
        modalityText(c.modalities),
        `Chart shape reads as ${c.chartShape.toLowerCase()}.`,
        ASTROLOGY_DISCLAIMER,
      ]),
      bullets: [
        ...bigThree.map((k) => placementText(k === "Rising" ? "Rising" : k, c[k === "Rising" ? "rising" : k === "Sun" ? "sun" : "moon"], null, false)),
        ...core
          .filter((pl) => !["Sun", "Moon"].includes(pl.label))
          .map((pl) => placementText(pl.label, pl.sign, pl.house, pl.retrograde)),
        ...c.aspects
          .filter((a) => a.level === "major")
          .sort((a, b) => a.orb - b.orb)
          .slice(0, 5)
          .map((a) => aspectText(a.a, a.b, a.type)),
      ].filter(Boolean),
    });
  }

  if (p.mbti) {
    const m = p.mbti;
    out.push({
      group: GROUPS.lenses,
      title: `MBTI — ${m.type}, ${m.nickname}`,
      body: join([m.core, m.communication, m.decisions]),
      bullets: [
        ...mbtiDimensionText(m.type),
        `Strengths: ${m.strengths.join(", ")}.`,
        `Blind spots: ${m.blindSpots.join(", ")}.`,
        `Under stress: ${m.stress}`,
        `In relationships: ${m.relationships}`,
        `At work: ${m.work}`,
      ],
    });
  }

  if (p.bigFive) {
    out.push({
      group: GROUPS.lenses,
      title: "Big Five — Trait Profile",
      body: "The Big Five is the most empirically grounded of your five lenses. Scores are self-report estimates on a 0–100 scale, read as bands rather than exact values.",
      bullets: BIG_FIVE.map((t) => {
        const v = p.bigFive?.[t] ?? 50;
        const e = bigFiveEntry(t, v);
        return `${t} ${v} (${BAND_LABEL[e.band]}) — ${BIG_FIVE_BLURB[t]} ${e.read} ${e.interpersonal} ${e.work} Watch for: ${e.difficulties.join(", ")}.`;
      }),
    });
  }

  if (p.ennea) {
    const e = p.ennea;
    out.push({
      group: GROUPS.lenses,
      title: `Enneagram — Type ${e.type}${p.wing ? `w${p.wing}` : ""}, ${e.name}`,
      body: join([
        `Core motivation: ${e.coreMotivation} Core fear: ${e.coreFear} Core desire: ${e.coreDesire}`,
        p.wing ? wingText(e.type, p.wing) : "",
        p.instinct ? `Your dominant instinct reads as ${p.instinct}, which sets where the type's attention goes first.` : "",
        "The Enneagram is an interpretive framework for motivation, not a clinical classification.",
      ]),
      bullets: [
        `Strengths: ${e.strengths.join(", ")}.`,
        `Blind spots: ${e.blindSpots.join(", ")}.`,
        `Stress pattern: ${e.stress}`,
        `Interpersonal pattern: ${e.interpersonal}`,
        `Emotional pattern: ${e.emotional}`,
      ],
    });
  }

  if (p.attachment) {
    const a = p.attachment;
    out.push({
      group: GROUPS.lenses,
      title: `Attachment — ${a.style}`,
      body: join([a.read, a.relationships]),
      bullets: [
        `Communication: ${a.communication}`,
        `Conflict: ${a.conflict}`,
        `Intimacy: ${a.intimacy}`,
        `Likely triggers: ${a.triggers.join(", ")}.`,
        `Strengths: ${a.strengths.join(", ")}.`,
        `Growth edge: ${a.growth}`,
      ],
    });
  }

  return out;
}

function crossSections(p: Profile): ReportSection[] {
  const m = matched(p);
  const kinds: RuleKind[] = ["convergence", "contradiction", "amplifier", "tension", "hidden"];
  const out: ReportSection[] = [];
  for (const k of kinds) {
    if (!m[k].length) continue;
    out.push({
      group: GROUPS.cross,
      title: KIND_TITLE[k],
      body: KIND_INTRO[k],
      bullets: m[k],
      premium: k !== "convergence",
    });
  }
  if (!out.length) {
    out.push({
      group: GROUPS.cross,
      title: "Not enough lenses yet",
      body: "Complete at least two of the five assessments to generate a cross-sectional reading. The synthesis compares systems against each other, so it needs more than one input.",
    });
  }
  return out;
}

function innerWorld(p: Profile): ReportSection[] {
  const n = p.bands.Neuroticism;
  const emotional = join([
    p.attachment ? p.attachment.read : "",
    p.mbti ? (isL(p, "F") ? "You process by feeling first and reason second, and a decision that is logically clean but emotionally wrong will not settle." : "You process by reasoning first, which means feelings often arrive after the decision, sometimes days after.") : "",
    n === "high"
      ? "Your threat system is sensitive: emotion arrives fast, stays longer, and rumination is the main tax you pay."
      : n === "low"
        ? "Your baseline is unusually even, which is a real advantage and can leave you slow to notice distress in yourself or others."
        : "",
    p.ennea ? p.ennea.emotional : "",
  ]);

  const motivation = join([
    p.ennea ? `${p.ennea.coreMotivation} Underneath it sits the fear of ${p.ennea.coreFear.toLowerCase().replace(/\.$/, "")}.` : "",
    p.mbti ? p.mbti.core : "",
    p.chart ? `Symbolically, your ${p.chart.sun} Sun frames the same drive as a matter of what you are here to develop rather than what you are avoiding.` : "",
  ]);

  const stress = join([
    p.mbti ? p.mbti.stress : "",
    p.ennea ? p.ennea.stress : "",
    p.attachment ? `Relationally, stress shows up as: ${lowerFirst(p.attachment.conflict)}` : "",
    isBand(p, "Conscientiousness", "high") ? "Your default coping move is to work — which is effective right up until it becomes the problem." : "",
  ]);

  const selfPerception = join([
    isBand(p, "Neuroticism", "high") && isBand(p, "Conscientiousness", "high")
      ? "You likely hold yourself to a standard you would never impose on anyone else, and read meeting it as the minimum rather than an achievement."
      : "",
    p.ennea?.type === 4 ? "You measure yourself against an internal ideal of authenticity, which makes ordinary contentment feel suspect." : "",
    p.ennea?.type === 3 ? "Your self-image tracks recent output more closely than you would like to admit." : "",
    "Where the systems agree about you, the reading is probably accurate. Where they disagree, the contradiction is usually the more useful thing to sit with.",
  ]);

  return [
    { group: GROUPS.inner, title: "Emotional Processing", body: emotional || "Add the attachment and Big Five assessments to unlock this section." },
    { group: GROUPS.inner, title: "Internal Motivation", body: motivation || "Add the Enneagram assessment to unlock this section." },
    { group: GROUPS.inner, title: "Stress Response", body: stress || "Add more assessments to unlock this section.", premium: true },
    { group: GROUPS.inner, title: "Self-Perception", body: selfPerception, premium: true },
  ];
}

function relationships(p: Profile): ReportSection[] {
  const a = p.attachment;
  return [
    {
      group: GROUPS.rel,
      title: "Communication Style",
      body: join([
        p.mbti ? p.mbti.communication : "",
        a ? a.communication : "",
        isBand(p, "Agreeableness", "low") ? "Low Agreeableness means your delivery is honest by default; people rarely have to guess, and occasionally wish they could." : "",
        isBand(p, "Extraversion", "low") ? "Because you process internally, a partner may hear the conclusion without the reasoning that produced it." : "",
      ]),
    },
    {
      group: GROUPS.rel,
      title: "Conflict Style",
      body: join([
        a ? a.conflict : "",
        p.mbti ? (isL(p, "T") ? "You try to separate the problem from the feelings, which is efficient and can read as dismissive mid-argument." : "You need the relationship to feel intact before the problem can be solved, and cannot think clearly while it is in doubt.") : "",
        isBand(p, "Agreeableness", "high") ? "Your accommodating default means small grievances tend to be absorbed rather than raised — until they are raised all at once." : "",
      ]),
      premium: true,
    },
    {
      group: GROUPS.rel,
      title: "Intimacy Style",
      body: join([
        a ? a.intimacy : "",
        p.chart ? `Symbolically, Venus in ${p.chart.placements.find((x) => x.label === "Venus")?.sign ?? "your chart"} points at what you find valuable in closeness, while Mars in ${p.chart.placements.find((x) => x.label === "Mars")?.sign ?? "your chart"} describes how you pursue it.` : "",
        p.ennea ? p.ennea.interpersonal : "",
      ]),
      premium: true,
    },
    {
      group: GROUPS.rel,
      title: "What You Need From a Partner",
      body: join([
        a?.style === "Anxious" ? "Predictability stated out loud: not more love, but more legible love — times, plans, explicit reassurance before you have to ask." : "",
        a?.style === "Avoidant" ? "Room that is granted rather than taken, and a partner who does not read your need for space as a verdict on them." : "",
        a?.style === "Fearful-Avoidant" ? "Consistency that survives your withdrawal — someone steady enough not to match your oscillation." : "",
        a?.style === "Secure" ? "A partner whose instability you are not quietly compensating for." : "",
        isBand(p, "Extraversion", "low") ? "Recovery time that is not treated as rejection." : "",
        isBand(p, "Openness", "high") ? "Conversation that goes somewhere; you can survive most things except being bored." : "",
      ]),
      premium: true,
    },
  ].filter((s) => s.body.length > 0);
}

function strengthsAndBlind(p: Profile): ReportSection[] {
  const strengths: string[] = [];
  const blind: string[] = [];
  if (p.mbti) {
    strengths.push(...p.mbti.strengths);
    blind.push(...p.mbti.blindSpots);
  }
  if (p.ennea) {
    strengths.push(...p.ennea.strengths);
    blind.push(...p.ennea.blindSpots);
  }
  if (p.attachment) strengths.push(...p.attachment.strengths);
  if (p.bigFive) {
    for (const t of BIG_FIVE) {
      const e = bigFiveEntry(t, p.bigFive[t] ?? 50);
      strengths.push(...e.strengths.slice(0, 1));
      blind.push(...e.difficulties.slice(0, 1));
    }
  }

  const sabotage = join([
    p.attachment?.style === "Anxious" ? "Seeking reassurance in a form that makes reassurance harder to give — testing rather than asking." : "",
    p.attachment?.style === "Avoidant" ? "Solving the discomfort of closeness by creating distance, then explaining the distance as circumstance." : "",
    p.attachment?.style === "Fearful-Avoidant" ? "Leaving right after the moment that went well, because it went well." : "",
    isBand(p, "Conscientiousness", "high") ? "Using productivity as the answer to feelings that are not productivity problems." : "",
    isBand(p, "Conscientiousness", "low") ? "Waiting for the pressure that makes action possible, and calling the resulting stress bad luck." : "",
    p.ennea?.type === 5 ? "Preparing indefinitely so that entry never has to be risked." : "",
    p.ennea?.type === 9 ? "Agreeing in the moment and withdrawing effort later, so the disagreement never has to be spoken." : "",
    p.ennea?.type === 3 ? "Substituting a better result for the harder conversation." : "",
  ]);

  return [
    {
      group: GROUPS.strengths,
      title: "Strengths",
      body: "Drawn from the points where your systems agree — these are the capacities most likely to be genuinely yours rather than situational.",
      bullets: dedupe(strengths).slice(0, 10),
    },
    {
      group: GROUPS.strengths,
      title: "Blind Spots",
      body: "Stated as tendencies, not verdicts. Each of these is the cost side of something you are good at.",
      bullets: dedupe(blind).slice(0, 10),
      premium: true,
    },
    ...(sabotage
      ? [{ group: GROUPS.strengths, title: "Self-Sabotage Patterns", body: sabotage, premium: true }]
      : []),
  ];
}

function careerAndGrowth(p: Profile): ReportSection[] {
  const career = join([
    p.mbti ? p.mbti.work : "",
    isBand(p, "Conscientiousness", "high") ? "High Conscientiousness makes you the person work accretes around; guard scope deliberately." : "",
    isBand(p, "Openness", "high") ? "High Openness means a role without novel problems will erode you slowly even if everything else is good." : "",
    isBand(p, "Extraversion", "low") ? "Roles that require constant visibility will cost energy you would rather spend on the work itself." : "",
    p.chart ? `Symbolically, the Midheaven in ${p.chart.midheaven.sign} suggests a public direction coloured by that sign's register.` : "",
  ]);

  const growth = join([
    p.attachment ? `Relationally: ${lowerFirst(p.attachment.growth)}` : "",
    p.ennea ? `Motivationally: the Type ${p.ennea.type} growth move is to stop solving ${p.ennea.coreFear.toLowerCase().replace(/\.$/, "")} and start tolerating the possibility of it.` : "",
    isBand(p, "Neuroticism", "high") ? "Practically: the highest-leverage habit for you is anything that shortens rumination — writing it down, saying it out loud, or acting before certainty arrives." : "",
    isBand(p, "Agreeableness", "high") ? "Practically: practise the small no, in low-stakes situations, before you need the large one." : "",
    isBand(p, "Conscientiousness", "low") ? "Practically: external structure works better for you than resolve — commitments with other people in them." : "",
  ]);

  return [
    { group: GROUPS.career, title: "Career & Work Style", body: career || "Add the MBTI and Big Five assessments to unlock this section.", premium: true },
    { group: GROUPS.career, title: "Growth Areas", body: growth || "Add more assessments to unlock this section.", premium: true },
  ];
}

function finalDossier(p: Profile): ReportSection {
  const m = matched(p);
  const conv = m.convergence[0];
  const ten = m.tension[0] ?? m.contradiction[0];
  return {
    group: GROUPS.final,
    title: "The Integrated Read",
    body: join([
      `${p.name} reads most consistently as ${headlineFor(p).toLowerCase().replace("the ", "")}.`,
      conv ? `The strongest agreement across systems: ${lowerFirst(conv)}` : "",
      ten ? `The live tension: ${lowerFirst(ten)}` : "",
      p.completeness < 100
        ? `This dossier is built from ${p.completeness}% of the available lenses; completing the rest will sharpen the cross-section rather than simply add length.`
        : "All five lenses are present, which is why the cross-section above can be this specific.",
      "Read all of this as a set of well-supported hypotheses about yourself, not a verdict. The useful question is not whether each line is true, but which ones you recognised before you finished reading them.",
    ]),
  };
}

function executiveSummary(p: Profile): string {
  const m = matched(p);
  return join([
    p.mbti && p.ennea
      ? `You come out as ${p.mbti.type} — ${p.mbti.nickname.toLowerCase().replace("the ", "")} — running a Type ${p.ennea.type}${p.wing ? `w${p.wing}` : ""} motivational engine.`
      : p.mbti
        ? `You come out as ${p.mbti.type}, ${p.mbti.nickname.toLowerCase().replace("the ", "")}.`
        : "",
    p.attachment ? `Your relational baseline is ${p.attachment.style.toLowerCase()}: ${lowerFirst(p.attachment.read)}` : "",
    p.bigFive ? bigFiveHeadline(p) : "",
    p.chart ? `Symbolically the chart agrees in its own language: ${p.chart.sun} Sun, ${p.chart.moon} Moon, ${p.chart.rising} Rising.` : "",
    m.convergence.length
      ? `Across systems, ${m.convergence.length} clear convergence${m.convergence.length === 1 ? "" : "s"} and ${m.tension.length + m.contradiction.length} point${m.tension.length + m.contradiction.length === 1 ? "" : "s"} of tension emerged — the tensions are where the interesting reading lives.`
      : "",
  ]);
}

function bigFiveHeadline(p: Profile): string {
  const ranked = BIG_FIVE.map((t) => ({ t, v: p.bigFive?.[t] ?? 50 })).sort((a, b) => b.v - a.v);
  const hi = ranked[0];
  const lo = ranked[ranked.length - 1];
  if (!hi || !lo) return "";
  return `On the Big Five your highest trait is ${hi.t} (${hi.v}) and your lowest is ${lo.t} (${lo.v}), which sets the practical shape of everything above.`;
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const dedupe = (a: string[]) => Array.from(new Set(a));

/* --------------------------------- public --------------------------------- */

export function generateCrossSection(profile: Profile): ReportSection[] {
  return crossSections(profile);
}

export function generateDossier(profile: Profile): Report {
  return {
    headline: headlineFor(profile),
    executiveSummary: executiveSummary(profile) || "Complete at least one assessment to generate your dossier.",
    dominantTraits: dominantTraits(profile),
    sections: [
      ...lensSections(profile),
      ...crossSections(profile),
      ...innerWorld(profile),
      ...relationships(profile),
      ...strengthsAndBlind(profile),
      ...careerAndGrowth(profile),
      finalDossier(profile),
    ].filter((s) => s.body || (s.bullets && s.bullets.length)),
    generatedAt: new Date().toISOString(),
    engine: "deterministic",
  };
}

export function dossierFor(person: PersonInput, chart?: NatalChart | undefined): Report {
  return generateDossier(buildProfile(person, chart));
}
