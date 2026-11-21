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
import { TESTS } from "./tests";
import { bandFor } from "./tests/types";

/* ------------------------------- rule engine ------------------------------ */

type RuleKind =
  | "convergence"
  | "construct_overlap"
  | "complementary"
  | "tension"
  | "unresolved"
  | "contradiction"
  | "amplifier"
  | "hidden";
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
    "Your MBTI introversion and low Big Five Extraversion may point toward a similar pattern: solitude could be especially useful as recovery time. This is a possible interpretation rather than a fixed rule.",
  ),
  R(
    "unresolved",
    (p) => isL(p, "I") && isBand(p, "Extraversion", "high"),
    "MBTI introversion and high Big Five Extraversion differ on how social energy is described. This may reflect differences between preference and measured behavior, but the available results cannot determine why.",
  ),
  R(
    "convergence",
    (p) => isL(p, "N") && isBand(p, "Openness", "high"),
    "Intuition and high Openness converge on the same appetite: you would rather understand a pattern than memorise a procedure, and unfamiliar territory reliably interests you more than mastery of the known.",
  ),
  R(
    "unresolved",
    (p) => isL(p, "N") && isBand(p, "Openness", "low"),
    "Abstract preference sits beside low measured Openness. The frameworks may describe different modes or contexts, but this difference is unresolved rather than proof that either result is wrong.",
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
    "unresolved",
    (p) => isL(p, "F") && isBand(p, "Agreeableness", "low"),
    "Feeling preference and low measured Agreeableness differ in emphasis. They may describe values and interpersonal behavior in different contexts, but the available evidence cannot explain the difference.",
  ),
  R(
    "unresolved",
    (p) => isL(p, "T") && isBand(p, "Agreeableness", "high"),
    "Thinking preference and high Agreeableness may describe decision style and interpersonal warmth together. They do not establish a fixed contradiction; context may explain a difference in style or delivery.",
  ),

  /* ---- MBTI <-> Enneagram ---- */
  R(
    "amplifier",
    (p) => isL(p, "I") && [4, 5, 9].includes(p.ennea?.type ?? 0),
    (p) =>
      `Introversion and a possible Type ${p.ennea?.type} withdrawal pattern may reinforce one another. Consider whether retreat helps you recover and whether it can also become avoidance; the two are not always easy to distinguish.`,
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
  /* Astrology remains a standalone symbolic lens; it does not participate in psychometric cross-assessment rules. */

  /* ---- Three-system combinations ---- */
  R(
    "hidden",
    (p) => isL(p, "I") && isBand(p, "Openness", "high") && p.attachment?.style !== "Secure",
    "Interior, curious and not-yet-secure is a possible combination: a detailed inner map of intimacy may coexist with keeping distance.",
  ),
  R(
    "amplifier",
    (p) =>
      isBand(p, "Conscientiousness", "high") &&
      isBand(p, "Neuroticism", "high") &&
      [1, 3, 6].includes(p.ennea?.type ?? 0),
    "High standards, a sensitive threat system and a compliance-oriented Enneagram type may combine into over-functioning; this is a hypothesis, not a fixed outcome.",
  ),
  R(
    "tension",
    (p) =>
      isBand(p, "Agreeableness", "high") && isBand(p, "Conscientiousness", "high") && isL(p, "F"),
    "Warmth, duty and value-driven decisions may make refusing requests harder. This is a possible cost to consider, not a required pattern.",
  ),

  /* ---- Added assessment relationships ---- */
  R(
    "construct_overlap",
    (p) => (p.hexaco?.["C"] ?? 0) >= 66 && isBand(p, "Conscientiousness", "high"),
    "High HEXACO Conscientiousness and high Big Five Conscientiousness point toward a related tendency, but the frameworks use different factor structures and are not interchangeable measurements.",
  ),
  R(
    "construct_overlap",
    (p) => (p.hexaco?.["O"] ?? 0) >= 66 && isBand(p, "Openness", "high"),
    "High HEXACO Openness and high Big Five Openness suggest overlapping curiosity or idea-seeking tendencies. This overlap is descriptive, not direct confirmation by either instrument.",
  ),
  R(
    "complementary",
    (p) =>
      (p.assessmentResults?.["emotional-intelligence"]?.["managing"] ?? 0) >= 66 &&
      (p.assessmentResults?.["resilience"]?.["resilience"] ?? 0) >= 66,
    "High reported emotional management and resilience may describe complementary capacities: self-regulation and recovery are related but distinct snapshots.",
  ),
  R(
    "tension",
    (p) =>
      (p.assessmentResults?.["emotional-intelligence"]?.["managing"] ?? 0) >= 66 &&
      isBand(p, "Neuroticism", "high"),
    "Strong reported emotional management alongside high Big Five Neuroticism may suggest a difference between perceived coping ability and the frequency or intensity of emotional strain.",
  ),
  R(
    "tension",
    (p) =>
      (p.assessmentResults?.["resilience"]?.["resilience"] ?? 0) <= 35 &&
      isBand(p, "Neuroticism", "low"),
    "A lower resilience snapshot and low Neuroticism may reflect current recovery conditions rather than fixed temperament.",
  ),
  R(
    "tension",
    (p) =>
      (p.assessmentResults?.["adhd-traits"]?.["inattention"] ?? 0) >= 66 &&
      isBand(p, "Conscientiousness", "high"),
    "Reported ADHD-related inattention alongside high Conscientiousness may indicate that organized behaviour and executive difficulties can coexist. These findings come from different frameworks.",
  ),
  R(
    "construct_overlap",
    (p) =>
      typeof p.hsp === "number" &&
      p.hsp >= 66 &&
      (p.assessmentResults?.["autism-quotient"]?.["social"] ?? 0) >= 66,
    "Higher reported sensitivity and social-effort indicators may describe overlapping experiences of overload or social demand. HSP and autism-related trait measures remain distinct, and this overlap does not establish a diagnosis.",
  ),
  R(
    "tension",
    (p) =>
      (p.assessmentResults?.["autism-quotient"]?.["social"] ?? 0) >= 66 &&
      isBand(p, "Extraversion", "high"),
    "Reported social effort alongside high Extraversion may suggest that someone can seek or enjoy social interaction while still finding social cue-processing demanding.",
  ),
  R(
    "tension",
    (p) =>
      (p.assessmentResults?.["dark-triad"]?.["psychopathy"] ?? 0) >= 66 &&
      isBand(p, "Agreeableness", "high"),
    "A high dark-triad psychopathy indicator alongside high Agreeableness could describe different reported modes in different situations. It does not determine character or clinical status.",
  ),
  R(
    "amplifier",
    (p) =>
      (p.assessmentResults?.["adhd-traits"]?.["inattention"] ?? 0) >= 66 &&
      (p.assessmentResults?.["autism-quotient"]?.["overall"] ?? 0) >= 66,
    "Reported ADHD-associated inattention traits and autistic-trait indicators may coexist, but this is not evidence of either clinical diagnosis. The combination may suggest individualized needs around focus, routine or sensory support.",
  ),
];

/* --------------------------- composition helpers -------------------------- */

const KIND_TITLE: Record<RuleKind, string> = {
  convergence: "Convergences",
  construct_overlap: "Construct Overlap",
  complementary: "Complementary Findings",
  tension: "Potential Tensions",
  unresolved: "Unresolved Differences",
  contradiction: "Contradictions",
  amplifier: "Amplifiers",
  hidden: "Hidden Patterns",
};

const KIND_INTRO: Record<RuleKind, string> = {
  convergence:
    "Related assessments may point toward a similar tendency, but they measure different constructs and should not be treated as interchangeable.",
  construct_overlap:
    "These findings touch related traits or experiences. The overlap is descriptive, not independent confirmation or a clinical equivalence.",
  complementary:
    "These results describe different aspects of functioning that may complement rather than duplicate one another.",
  tension:
    "These findings may describe competing tendencies or contexts and deserve careful interpretation.",
  unresolved:
    "The available results differ, but the information is not sufficient to explain why or determine which context applies.",
  contradiction:
    "Where systems differ, the difference may reflect distinct constructs or context rather than one result being wrong.",
  amplifier:
    "Some reported patterns may reinforce one another, but this is a possible interaction rather than a fixed outcome.",
  hidden:
    "Combinations that become visible only when several completed assessments are considered together.",
};

function matched(p: Profile) {
  const out: Record<RuleKind, string[]> = {
    convergence: [],
    construct_overlap: [],
    complementary: [],
    tension: [],
    unresolved: [],
    contradiction: [],
    amplifier: [],
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
    const core = c.placements.filter((pl) =>
      ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(pl.label),
    );
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
        ...bigThree.map((k) =>
          placementText(
            k === "Rising" ? "Rising" : k,
            c[k === "Rising" ? "rising" : k === "Sun" ? "sun" : "moon"],
            null,
            false,
          ),
        ),
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
      body: "The Big Five is a self-report trait framework. Scores are estimates on a 0–100 scale and are most useful as bands rather than exact values.",
      bullets: BIG_FIVE.map((t) => {
        const v = p.bigFive?.[t] ?? 50;
        const e = bigFiveEntry(t, v);
        return `${t} ${BAND_LABEL[e.band]} band — ${BIG_FIVE_BLURB[t]} ${e.read} ${e.interpersonal} ${e.work} Watch for: ${e.difficulties.join(", ")}.`;
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
        p.instinct
          ? `Your dominant instinct reads as ${p.instinct}, which sets where the type's attention goes first.`
          : "",
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

  if (p.hexaco) {
    const hexacoTest = TESTS.find((test) => test.slug === "hexaco");
    const bullets = Object.entries(p.hexaco).map(([key, value]) => {
      const dimension = hexacoTest?.dimensions.find((item) => item.key === key);
      if (!dimension) return `${key} ${value}/100`;
      const band = bandFor(dimension, value);
      return `${dimension.label} — ${band.label}: ${band.text}`;
    });
    out.push({
      group: GROUPS.lenses,
      title: "HEXACO — Six-Factor Personality",
      body: "The HEXACO framework preserves six distinct factors and should be read independently of the Big Five, especially for Honesty-Humility.",
      bullets,
    });
  }

  if (typeof p.hsp === "number") {
    const hspTest = TESTS.find((test) => test.slug === "highly-sensitive-person");
    const dimension = hspTest?.dimensions.find((item) => item.key === "sensitivity");
    const band = dimension ? bandFor(dimension, p.hsp) : undefined;
    out.push({
      group: GROUPS.lenses,
      title: "Highly Sensitive Person — Temperament",
      body: band
        ? `Sensitivity — ${band.label}. ${band.text} This is a neutral temperament dimension, not a disorder or diagnosis.`
        : "This describes reported sensitivity and responsiveness to environment; it is not a disorder or diagnosis.",
    });
  }

  if (p.assessmentResults) {
    for (const test of TESTS) {
      const scores = p.assessmentResults[test.slug];
      if (!scores) continue;
      const bullets = test.dimensions.map((dimension) => {
        const value = scores[dimension.key] ?? 0;
        const band = bandFor(dimension, value);
        return `${dimension.label} — ${band.label}: ${band.text}`;
      });
      out.push({
        group: GROUPS.lenses,
        title: `${test.name} — Assessment Lens`,
        body: test.disclaimer
          ? `This is a self-reported assessment result. ${test.disclaimer}`
          : "This is a self-reported assessment result and should be interpreted within its original framework.",
        bullets,
        premium: test.slug === "adhd-traits" || test.slug === "autism-quotient",
      });
    }
  }

  return out;
}

function crossSections(p: Profile): ReportSection[] {
  const m = matched(p);
  const kinds: RuleKind[] = [
    "convergence",
    "construct_overlap",
    "complementary",
    "tension",
    "unresolved",
    "contradiction",
    "amplifier",
    "hidden",
  ];
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
      title: "Insufficient cross-assessment data",
      body: "Complete at least two assessments from distinct frameworks to support limited cross-sectional observations. Individual assessment lenses remain available, but this section will not fill gaps with speculation.",
    });
  }
  return out;
}

function innerWorld(p: Profile): ReportSection[] {
  const n = p.bands.Neuroticism;
  const emotional = join([
    n === "high"
      ? "The Big Five threat-system band is high. Emotion may arrive strongly and rumination may take longer to settle."
      : n === "low"
        ? "The Big Five threat-system band is low. Emotional intensity may feel more contained, while others' distress can sometimes be harder to register."
        : "",
    p.mbti
      ? isL(p, "F")
        ? "Your MBTI pattern may give emotional meaning a prominent role in interpretation."
        : "Your MBTI pattern may give reasoning or structure a prominent role before emotional interpretation."
      : "",
  ]);

  const motivation = join([
    p.ennea
      ? `${p.ennea.coreMotivation} Underneath it sits the fear of ${p.ennea.coreFear.toLowerCase().replace(/\.$/, "")}.`
      : "",
    p.mbti ? p.mbti.core : "",
  ]);

  const stress = join([p.mbti ? p.mbti.stress : "", p.ennea ? p.ennea.stress : ""]);

  return [
    {
      group: GROUPS.inner,
      title: "Emotional Processing",
      body:
        emotional || "No completed assessments yet describe emotional processing in enough detail.",
    },
    {
      group: GROUPS.inner,
      title: "Internal Motivation",
      body:
        motivation ||
        "Add an Enneagram or MBTI assessment to support a motivational interpretation.",
    },
    {
      group: GROUPS.inner,
      title: "Stress Response",
      body:
        stress ||
        "Add assessments that describe stress or relational patterns to support this section.",
      premium: true,
    },
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
        isBand(p, "Agreeableness", "low")
          ? "Low Big Five Agreeableness may make delivery direct; this is a possibility rather than a fixed communication style."
          : "",
      ]),
    },
    {
      group: GROUPS.rel,
      title: "Conflict Style",
      body: join([
        a ? a.conflict : "",
        isBand(p, "Agreeableness", "low")
          ? "Low Big Five Agreeableness may make delivery direct; this is a possibility rather than a fixed communication style."
          : "",
      ]),
      premium: true,
    },
    {
      group: GROUPS.rel,
      title: "Intimacy Style",
      body: join([a ? a.intimacy : "", p.ennea ? p.ennea.interpersonal : ""]),
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

  if (!strengths.length && !blind.length) {
    return [{
      group: GROUPS.strengths,
      title: "Strengths & Blind Spots",
      body: "Complete a personality or attachment assessment to explore possible strengths and blind spots. A birth chart alone is not evidence of psychological traits.",
    }];
  }

  return [
    {
      group: GROUPS.strengths,
      title: "Possible Strengths",
      body: "These are possible capacities suggested by completed assessments. They are not confirmed by agreement between unrelated measures.",
      bullets: dedupe(strengths).slice(0, 10),
    },
    {
      group: GROUPS.strengths,
      title: "Possible Blind Spots",
      body: "Stated as contextual tendencies, not verdicts.",
      bullets: dedupe(blind).slice(0, 10),
      premium: true,
    },
  ];
}

function careerAndGrowth(p: Profile): ReportSection[] {
  const career = join([
    p.mbti ? p.mbti.work : "",
    isBand(p, "Conscientiousness", "high")
      ? "High Big Five Conscientiousness may support roles that require follow-through and reliable scope management."
      : "",
    isBand(p, "Openness", "high")
      ? "High Big Five Openness may make novelty, ideas or experimentation valuable in work."
      : "",
  ]);
  const growth = join([
    p.attachment ? `Relationally: ${lowerFirst(p.attachment.growth)}` : "",
    p.ennea
      ? `Motivationally: the Type ${p.ennea.type} growth question is to notice ${p.ennea.coreFear.toLowerCase().replace(/\.$/, "")} without letting that fear determine every choice.`
      : "",
  ]);
  return [
    {
      group: GROUPS.career,
      title: "Career & Work Style",
      body: career || "Add relevant assessments to support this section.",
      premium: true,
    },
    {
      group: GROUPS.career,
      title: "Growth Areas",
      body: growth || "Add more assessment data to support growth observations.",
      premium: true,
    },
  ];
}

function finalDossier(p: Profile): ReportSection {
  const m = matched(p);
  const conv = m.convergence[0] ?? m.construct_overlap[0] ?? m.complementary[0];
  const ten = m.tension[0] ?? m.unresolved[0] ?? m.contradiction[0];
  return {
    group: GROUPS.final,
    title: "The Integrated Read",
    body: join([
      p.psychometricDomainCount > 0
        ? `${p.name} reads most consistently as ${headlineFor(p).toLowerCase().replace(/^the /, "")}.`
        : p.chart
          ? `This dossier currently contains a symbolic natal-chart interpretation for ${p.name}, not a psychological personality profile.`
          : `No assessment evidence is available yet for ${p.name}.`,
      conv ? `A possible overlap across completed domains: ${lowerFirst(conv)}` : "",
      ten ? `A possible difference or tension to consider: ${lowerFirst(ten)}` : "",
      `Completed psychological assessment domains: ${p.psychometricDomainCount}. Symbolic astrology chart: ${p.symbolicDomainCount ? "included" : "not included"}. Additional assessments may provide context, but no number of tests can establish a complete or definitive personality profile.`,
      "Read these findings as hypotheses from self-report and interpretive frameworks, not as diagnoses or verdicts.",
    ]),
  };
}

function executiveSummary(p: Profile): string {
  const m = matched(p);
  return join([
    p.mbti && p.ennea
      ? `Possible type and motivational patterns include ${p.mbti.type} and Enneagram Type ${p.ennea.type}${p.wing ? `w${p.wing}` : ""}.`
      : p.mbti
        ? `An MBTI preference pattern is available: ${p.mbti.type}.`
        : "",
    p.attachment ? `A relational pattern to consider is ${p.attachment.style.toLowerCase()}.` : "",
    p.bigFive ? bigFiveHeadline(p) : "",
    p.chart
      ? `The natal chart may be read symbolically as ${p.chart.sun} Sun, ${p.chart.moon} Moon, and ${p.chart.rising} Rising.`
      : "",
    m.convergence.length ||
    m.construct_overlap.length ||
    m.complementary.length ||
    m.tension.length ||
    m.unresolved.length ||
    m.contradiction.length
      ? `The cross-assessment section contains ${m.convergence.length + m.construct_overlap.length + m.complementary.length} possible overlap or complementary finding${m.convergence.length + m.construct_overlap.length + m.complementary.length === 1 ? "" : "s"} and ${m.tension.length + m.unresolved.length + m.contradiction.length} possible tension or unresolved difference${m.tension.length + m.unresolved.length + m.contradiction.length === 1 ? "" : "s"}.`
      : "",
  ]);
}

function bigFiveHeadline(p: Profile): string {
  const bands = BIG_FIVE.map((t) => ({ t, band: p.bands[t] ?? "moderate" })).filter((x) => x.band);
  const hi = bands.filter((x) => x.band === "high")[0];
  const lo = bands.filter((x) => x.band === "low")[0];
  if (!hi && !lo) return "The available Big Five traits are largely in moderate bands.";
  return join([hi ? `${hi.t} is in the high band.` : "", lo ? `${lo.t} is in the low band.` : ""]);
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const dedupe = (a: string[]) => {
  const normalized = a.map((value) => {
    const cleaned = value.trim();
    if (
      /^(depth|depth of insight|analytical depth|emotional depth|high capacity for insight)$/i.test(
        cleaned,
      )
    )
      return "Insight and reflective depth";
    if (/^(listening|considered speech|pattern-reading of people)$/i.test(cleaned))
      return "Attuned listening and insight";
    if (/^(perfectionism|rigidity when plans change|difficulty resting)$/i.test(cleaned))
      return "Structure may become rigid under pressure";
    if (/^(rumination|reactivity to ambiguity|physical stress load)$/i.test(cleaned))
      return "Uncertainty may increase stress";
    return cleaned;
  });
  return Array.from(new Set(normalized));
};

export function generateCrossSection(profile: Profile): ReportSection[] {
  return crossSections(profile);
}

export function generateDossier(profile: Profile): Report {
  return {
    headline: headlineFor(profile),
    executiveSummary:
      executiveSummary(profile) || "Complete at least one assessment to generate your dossier.",
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
