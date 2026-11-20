// Deterministic relationship / synastry engine.
import { GROUPS, type Report, type ReportSection } from "./report";
import { isBand, isL, type Profile } from "./profile";
import { ELEMENT_OF, type NatalChart } from "./astro";
import { ASPECT_MEANING } from "./interpret/astrology";
import { BIG_FIVE, band } from "./interpret/bigfive";

type Pair = { a: Profile; b: Profile };
type PairRule = {
  kind: "strength" | "friction" | "misunderstanding" | "complement" | "similarity";
  evidence?: "attachment" | "personality" | "astrology" | "clinical" | "general";
  when: (p: Pair) => boolean;
  text: (p: Pair) => string;
};

const nameA = (p: Pair) => p.a.name;
const nameB = (p: Pair) => p.b.name;

const P = (
  kind: PairRule["kind"],
  when: PairRule["when"],
  text: string | PairRule["text"],
  evidence: NonNullable<PairRule["evidence"]> = "general",
): PairRule => ({ kind, evidence, when, text: typeof text === "string" ? () => text : text });

// symmetric helper: true if one side matches x and the other matches y
const pairMatch = (p: Pair, x: (q: Profile) => boolean, y: (q: Profile) => boolean) =>
  (x(p.a) && y(p.b)) || (x(p.b) && y(p.a));

const isAtt = (s: string) => (q: Profile) => q.attachment?.style === s;

export type SynastryEvidence = {
  level: "insufficient" | "partial" | "sufficient";
  sharedDomains: number;
  relationshipDomains: number;
  attachment: boolean;
  personality: boolean;
  astrology: boolean;
  clinicalTraits: boolean;
};

export function synastryEvidence(a: Profile, b: Profile): SynastryEvidence {
  let sharedDomains = 0;
  let relationshipDomains = 0;
  if (a.chart && b.chart) {
    sharedDomains += 1;
    relationshipDomains += 1;
  }
  if (a.mbti && b.mbti) {
    sharedDomains += 1;
    relationshipDomains += 1;
  }
  if (a.bigFive && b.bigFive) {
    sharedDomains += 1;
    relationshipDomains += 1;
  }
  if (a.ennea && b.ennea) {
    sharedDomains += 1;
    relationshipDomains += 1;
  }
  if (a.attachment && b.attachment) {
    sharedDomains += 1;
    relationshipDomains += 1;
  }
  if (a.hexaco && b.hexaco) {
    sharedDomains += 1;
    relationshipDomains += 1;
  }

  for (const slug of Object.keys(a.assessmentResults ?? {})) {
    if (b.assessmentResults?.[slug]) sharedDomains += 1;
  }

  const level =
    relationshipDomains === 0
      ? "insufficient"
      : relationshipDomains === 1
        ? "partial"
        : "sufficient";

  return {
    sharedDomains,
    relationshipDomains,
    level,
    attachment: Boolean(a.attachment && b.attachment),
    personality: Boolean(
      (a.mbti && b.mbti) ||
      (a.bigFive && b.bigFive) ||
      (a.ennea && b.ennea) ||
      (a.hexaco && b.hexaco),
    ),
    astrology: Boolean(a.chart && b.chart),
    clinicalTraits: Boolean(
      (a.assessmentResults?.["adhd-traits"] && b.assessmentResults?.["adhd-traits"]) ||
      (a.assessmentResults?.["autism-quotient"] && b.assessmentResults?.["autism-quotient"]),
    ),
  };
}

export const PAIR_RULES: PairRule[] = [
  P(
    "friction",
    (p) => pairMatch(p, isAtt("Anxious"), isAtt("Avoidant")),
    (p) =>
      `Anxious and avoidant attachment styles may produce a pursue-withdraw dynamic: one may seek contact to settle while the other seeks distance. This is a possible pattern worth naming, not a predictable outcome for ${nameA(p)} and ${nameB(p)}.`,
  ),
  P(
    "friction",
    (p) => pairMatch(p, isAtt("Anxious"), isAtt("Fearful-Avoidant")),
    "Anxious with fearful-avoidant can produce intense closeness followed by abrupt distance, then escalating pursuit. The intensity is real; the oscillation is the risk.",
  ),
  P(
    "strength",
    (p) => p.a.attachment?.style === "Secure" && p.b.attachment?.style === "Secure",
    "Two secure-style baselines may make proportional conflict and overnight uncertainty easier to tolerate. This is a possibility, not a promise of compatibility.",
  ),
  P(
    "strength",
    (p) =>
      pairMatch(
        p,
        isAtt("Secure"),
        (q) => q.attachment?.style !== undefined && q.attachment.style !== "Secure",
      ),
    "One secure partner can meaningfully stabilise the other's pattern, provided the secure one does not slide into managing rather than relating.",
  ),
  P(
    "friction",
    (p) =>
      pairMatch(
        p,
        (q) => isBand(q, "Neuroticism", "high"),
        (q) => isBand(q, "Neuroticism", "low"),
      ),
    "A higher-threat-system band and a lower-threat-system band may create different interpretations of urgency and calm. This is a possible mismatch in stress responses, not a verdict that either reading is wrong.",
  ),
  P(
    "friction",
    (p) =>
      pairMatch(
        p,
        (q) => isBand(q, "Conscientiousness", "high"),
        (q) => isBand(q, "Conscientiousness", "low"),
      ),
    "Different structure expectations are likely: one of you experiences plans as commitments, the other as intentions. Most of the resulting arguments will be about respect while appearing to be about logistics.",
  ),
  P(
    "misunderstanding",
    (p) =>
      pairMatch(
        p,
        (q) => isBand(q, "Extraversion", "high"),
        (q) => isBand(q, "Extraversion", "low"),
      ),
    "Differing social-energy needs mean recovery time and stimulation have to be negotiated explicitly rather than assumed. Silence is not withdrawal, and enthusiasm is not pressure.",
  ),
  P(
    "friction",
    (p) =>
      pairMatch(
        p,
        (q) => isBand(q, "Agreeableness", "high"),
        (q) => isAtt("Avoidant")(q),
      ),
    "High agreeableness on one side and avoidance on the other can suppress conflict entirely: nothing is raised, nothing is resolved, and distance grows without a single argument.",
  ),
  P(
    "similarity",
    (p) =>
      p.a.bigFive && p.b.bigFive
        ? Math.abs((p.a.bigFive["Openness"] ?? 50) - (p.b.bigFive["Openness"] ?? 50)) <= 12
        : false,
    "Similar Openness bands may make conversation, novelty and taste easier to share, though it does not predict compatibility.",
  ),
  P(
    "complement",
    (p) =>
      pairMatch(
        p,
        (q) => isL(q, "J"),
        (q) => isL(q, "P"),
      ),
    "Judging with Perceiving may offer complementary timing: one preference may close decisions while the other keeps options open long enough to consider alternatives.",
  ),
  P(
    "complement",
    (p) =>
      pairMatch(
        p,
        (q) => isL(q, "T"),
        (q) => isL(q, "F"),
      ),
    "Thinking with Feeling means one of you brings decision clarity and the other brings relational accuracy. Each will underestimate the other's contribution under stress.",
  ),
  P(
    "similarity",
    (p) => Boolean(p.a.mbti && p.b.mbti && p.a.mbti.type[1] === p.b.mbti.type[1]),
    "You share the same perceiving function, which is why you tend to notice the same things — the fastest form of feeling understood.",
  ),
  P(
    "misunderstanding",
    (p) => Boolean(p.a.mbti && p.b.mbti && p.a.mbti.type[1] !== p.b.mbti.type[1]),
    "One person may lead with concrete detail and the other with pattern and implication. This is one possible source of misunderstanding, not a fixed prediction.",
  ),
  P(
    "friction",
    (p) =>
      pairMatch(
        p,
        (q) => q.ennea?.type === 8,
        (q) => q.ennea?.type === 9,
      ),
    "Eight and Nine energy: one escalates to make contact, the other withdraws to keep peace. Directness and stillness will each feel like aggression to the other.",
  ),
  P(
    "strength",
    (p) => Boolean(p.a.ennea && p.b.ennea && p.a.ennea.type === p.b.ennea.type),
    "Sharing an Enneagram type means you recognise each other's engine immediately — and share the same blind spot, with nobody positioned to catch it.",
  ),
  P(
    "complement",
    (p) =>
      pairMatch(
        p,
        (q) => q.ennea?.type === 2,
        (q) => q.ennea?.type === 5,
      ),
    "Two-and-Five pairs the person who moves toward with the person who conserves. Warmth may register as demand; independence may register as rejection.",
  ),
];

/* --------------------------- cross-chart synastry -------------------------- */

const CROSS_PAIRS = ["Sun", "Moon", "Venus", "Mars", "Mercury", "Saturn"];
const ANGLES: { type: string; angle: number; orb: number }[] = [
  { type: "conjunction", angle: 0, orb: 6 },
  { type: "opposition", angle: 180, orb: 6 },
  { type: "trine", angle: 120, orb: 5 },
  { type: "square", angle: 90, orb: 5 },
  { type: "sextile", angle: 60, orb: 4 },
];

export function crossAspects(a: NatalChart, b: NatalChart) {
  const out: { a: string; b: string; type: string; orb: number }[] = [];
  for (const pa of a.placements.filter((x) => CROSS_PAIRS.includes(x.label))) {
    for (const pb of b.placements.filter((x) => CROSS_PAIRS.includes(x.label))) {
      const diff = Math.abs(((pa.longitude - pb.longitude + 540) % 360) - 180);
      const sep = 180 - diff;
      for (const asp of ANGLES) {
        const orb = Math.abs(sep - asp.angle);
        if (orb <= asp.orb) out.push({ a: pa.label, b: pb.label, type: asp.type, orb });
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb).slice(0, 8);
}

function elementMix(a: NatalChart, b: NatalChart) {
  const sunA = ELEMENT_OF[a.sun];
  const sunB = ELEMENT_OF[b.sun];
  if (!sunA || !sunB) return "";
  if (sunA === sunB)
    return `Both Suns share the ${sunA} element, which may offer a symbolic similarity in pace or style; it does not establish compatibility.`;
  const easy: Record<string, string> = { Fire: "Air", Air: "Fire", Earth: "Water", Water: "Earth" };
  return easy[sunA] === sunB
    ? `${sunA} and ${sunB} Suns are a traditionally easy mix — different registers that feed each other rather than compete.`
    : `${sunA} and ${sunB} Suns are a traditionally contrasting mix in this symbolic framework. The chart may suggest different tempos or registers to discuss, not a relationship verdict or an empirical cause of conflict.`;
}

/* --------------------------------- public --------------------------------- */

export function generateSynastry(a: Profile, b: Profile): Report {
  const evidence = synastryEvidence(a, b);
  const pair: Pair = { a, b };
  const matched: Record<PairRule["kind"], string[]> = {
    strength: [],
    friction: [],
    misunderstanding: [],
    complement: [],
    similarity: [],
  };
  for (const rule of PAIR_RULES) {
    try {
      const supported =
        rule.evidence === "attachment"
          ? evidence.attachment
          : rule.evidence === "personality"
            ? evidence.personality
            : rule.evidence === "astrology"
              ? evidence.astrology
              : rule.evidence === "clinical"
                ? evidence.clinicalTraits
                : evidence.level !== "insufficient";
      if (supported && rule.when(pair)) matched[rule.kind].push(rule.text(pair));
    } catch {
      /* ignore malformed profile data */
    }
  }

  const sections: ReportSection[] = [];
  const G = GROUPS;

  sections.push({
    group: G.cross,
    title: "Overall Dynamic",
    body:
      evidence.level === "insufficient"
        ? `Insufficient shared data is available for ${a.name} and ${b.name}; no relationship dynamics are established by this report.`
        : evidence.level === "partial"
          ? "Only partial shared assessment data is available, so the observations below are limited examples rather than a comprehensive dynamic."
          : [
              `${a.name} and ${b.name} bring ${describe(a)} together with ${describe(b)}.`,
              matched.friction.length
                ? "Potential friction patterns are listed below as possibilities, not predictions."
                : "No high-friction structural pattern was surfaced, but this does not establish compatibility.",
              matched.complement.length
                ? "Possible complements are differences that may function as capability rather than conflict."
                : "",
            ]
              .filter(Boolean)
              .join(" "),
  });

  sections.push({
    group: G.rel,
    title: "Attachment Dynamic",
    body:
      evidence.attachment && a.attachment && b.attachment
        ? `${a.name} is ${a.attachment.style.toLowerCase()}; ${b.name} is ${b.attachment.style.toLowerCase()}. ${a.attachment.conflict} Meanwhile, ${lower(b.attachment.conflict)} Under stress these patterns may meet before either person chooses a response. This is a possibility, not a prediction.`
        : "Insufficient evidence: both people need a completed attachment assessment to describe an attachment dynamic.",
    premium: true,
  });

  sections.push({
    group: G.rel,
    title: "Communication Compatibility",
    body:
      a.mbti && b.mbti
        ? [
            `${a.name}: ${a.mbti.communication}`,
            `${b.name}: ${b.mbti.communication}`,
            matched.misunderstanding[0] ??
              "No supported personality-based misunderstanding pattern was identified.",
          ].join(" ")
        : "Insufficient evidence: both people need a shared personality framework, such as MBTI, to support this comparison.",
  });

  sections.push({
    group: G.rel,
    title: "Emotional Compatibility",
    body: evidence.personality
      ? [
          a.bigFive && b.bigFive ? bigFiveGap(a, b) : "",
          a.ennea && b.ennea
            ? `Motivationally, a Type ${a.ennea.type} and a Type ${b.ennea.type} may want different things from the same situation: ${lower(a.ennea.coreDesire)} versus ${lower(b.ennea.coreDesire)} This is an interpretive possibility, not a compatibility verdict.`
            : "",
        ]
          .filter(Boolean)
          .join(" ") ||
        "Insufficient evidence: the shared personality data do not support a specific emotional comparison."
      : "Insufficient evidence: both people need shared personality assessment data for an emotional compatibility comparison.",
    premium: true,
  });

  sections.push({
    group: G.rel,
    title: "Conflict Dynamic",
    body:
      evidence.level === "insufficient"
        ? "Insufficient evidence: no relationship-specific conflict pattern can be established from the data provided."
        : evidence.attachment || evidence.personality
          ? matched.friction.join(" ") ||
            "No supported structural conflict pattern was identified. This does not establish compatibility or incompatibility."
          : "Insufficient evidence: the shared data do not support a conflict interpretation.",
    premium: true,
  });

  sections.push({
    group: G.rel,
    title: "Intimacy Dynamic",
    body:
      evidence.attachment || evidence.astrology
        ? [
            evidence.attachment && a.attachment
              ? `${a.name} in closeness: ${lower(a.attachment.intimacy)}`
              : "",
            evidence.attachment && b.attachment
              ? `${b.name} in closeness: ${lower(b.attachment.intimacy)}`
              : "",
            evidence.astrology && a.chart && b.chart
              ? venusMars(a.chart, b.chart, a.name, b.name)
              : "",
          ]
            .filter(Boolean)
            .join(" ") ||
          "Insufficient evidence: the available data do not support a specific intimacy interpretation."
        : "Insufficient evidence: both people need shared attachment or astrology information for this section.",
    premium: true,
  });

  sections.push({
    group: G.strengths,
    title: "Strengths",
    body: "Where your structures support each other.",
    bullets: [...matched.strength, ...matched.complement].length
      ? [...matched.strength, ...matched.complement]
      : ["Not enough shared data yet to identify structural strengths."],
  });

  sections.push({
    group: G.strengths,
    title: "Friction Points",
    body: "Interpretive possibilities, not predictions.",
    bullets: matched.friction.length
      ? matched.friction
      : ["No structural friction pattern detected from the data provided."],
    premium: true,
  });

  sections.push({
    group: G.strengths,
    title: "Potential Misunderstandings",
    body: "The most likely places to mistranslate each other.",
    bullets: matched.misunderstanding.length
      ? matched.misunderstanding
      : ["None flagged from current data."],
    premium: true,
  });

  sections.push({
    group: G.cross,
    title: "Similarities & Differences",
    body: "",
    bullets: [
      ...matched.similarity.map((s) => `Similar: ${s}`),
      ...matched.complement.map((s) => `Complementary: ${s}`),
    ].length
      ? [
          ...matched.similarity.map((s) => `Similar: ${s}`),
          ...matched.complement.map((s) => `Complementary: ${s}`),
        ]
      : ["Complete more assessments for both people to populate this comparison."],
  });

  if (a.chart && b.chart) {
    const cross = crossAspects(a.chart, b.chart);
    sections.push({
      group: G.lenses,
      title: "Astrology — Synastry",
      body: [
        elementMix(a.chart, b.chart),
        modalityNote(a.chart, b.chart),
        "Read symbolically: cross-aspects between two charts are images for how two temperaments meet, not causes.",
      ]
        .filter(Boolean)
        .join(" "),
      bullets: cross.map(
        (c) =>
          `${a.name}'s ${c.a} ${c.type} ${b.name}'s ${c.b} (orb ${c.orb.toFixed(1)}°) — these ${ASPECT_MEANING[c.type] ?? "interact"}.`,
      ),
      premium: true,
    });
  }

  if (a.mbti && b.mbti) {
    sections.push({
      group: G.lenses,
      title: `MBTI Interaction — ${a.mbti.type} × ${b.mbti.type}`,
      body: [
        letterCompare(a, b, 0, "energy direction"),
        letterCompare(a, b, 1, "how you take in information"),
        letterCompare(a, b, 2, "how you decide"),
        letterCompare(a, b, 3, "how you handle structure"),
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  if (a.bigFive && b.bigFive) {
    sections.push({
      group: G.lenses,
      title: "Big Five Interaction",
      body: "Trait-by-trait comparison, read as gaps rather than scores.",
      bullets: BIG_FIVE.map((t) => {
        const va = a.bigFive?.[t] ?? 50;
        const vb = b.bigFive?.[t] ?? 50;
        const gap = Math.abs(va - vb);
        const label =
          gap <= 12 ? "closely matched" : gap <= 30 ? "moderately different" : "sharply different";
        return `${t}: ${a.name} is in the ${band(va)} band while ${b.name} is in the ${band(vb)} band — these bands are ${label} on a self-report estimate.`;
      }),
      premium: true,
    });
  }

  if (a.ennea && b.ennea) {
    sections.push({
      group: G.lenses,
      title: `Enneagram Interaction — ${a.ennea.type} × ${b.ennea.type}`,
      body: `${a.name} is organised around ${lower(a.ennea.coreMotivation)} ${b.name} is organised around ${lower(b.ennea.coreMotivation)} Under pressure, ${lower(a.ennea.stress)} while ${lower(b.ennea.stress)}`,
      premium: true,
    });
  }

  sections.push({
    group: G.final,
    title: "Cross-System Relationship Synthesis",
    body:
      evidence.level === "insufficient"
        ? `Insufficient shared assessment data is available for ${a.name} and ${b.name}. This section does not establish resonance, friction, compatibility, or incompatibility. Complete more assessments for both people before drawing relationship conclusions.`
        : evidence.level === "partial"
          ? `Partial data is available through ${evidence.sharedDomains} shared assessment domain. Observations below are limited and should not be treated as a comprehensive relationship reading.`
          : `Across ${evidence.sharedDomains} shared assessment domains, possible patterns include ${verdict(matched)}. None of this is prediction; the measures use different frameworks and do not establish compatibility or diagnosis.`,
  });

  const evidenceSummary =
    evidence.level === "insufficient"
      ? `Insufficient shared assessment data (${evidence.sharedDomains} shared domains); no relationship conclusion is supported.`
      : evidence.level === "partial"
        ? `Partial shared data (${evidence.sharedDomains} shared domain); only limited observations are available.`
        : `${evidence.sharedDomains} shared assessment domains provide possible cross-system observations, not a compatibility verdict.`;

  return {
    headline:
      evidence.level === "insufficient"
        ? "Insufficient Data"
        : evidence.level === "partial"
          ? "Limited Data — Partial Reading"
          : pairHeadline(matched),
    executiveSummary: `${a.name} and ${b.name}. ${evidenceSummary}`,
    dominantTraits: [
      ...(a.mbti && b.mbti ? [`${a.mbti.type} × ${b.mbti.type}`] : []),
      ...(a.ennea && b.ennea ? [`Type ${a.ennea.type} × Type ${b.ennea.type}`] : []),
      ...(a.attachment && b.attachment ? [`${a.attachment.style} × ${b.attachment.style}`] : []),
      ...(a.chart && b.chart ? [`${a.chart.sun} × ${b.chart.sun} Suns`] : []),
    ],
    sections: sections.filter((s) => s.body || (s.bullets && s.bullets.length)),
    generatedAt: new Date().toISOString(),
    engine: "deterministic",
  };
}

function describe(p: Profile) {
  const bits = [
    p.mbti ? `${p.mbti.type} wiring` : "",
    p.ennea ? `a Type ${p.ennea.type} engine` : "",
    p.attachment ? `${p.attachment.style.toLowerCase()} attachment` : "",
  ].filter(Boolean);
  return bits.length ? bits.join(", ") : "limited data so far";
}

function bigFiveGap(a: Profile, b: Profile) {
  const gaps = BIG_FIVE.map((t) => ({
    t,
    gap: Math.abs((a.bigFive?.[t] ?? 50) - (b.bigFive?.[t] ?? 50)),
  })).sort((x, y) => y.gap - x.gap);
  const biggest = gaps[0];
  const smallest = gaps[gaps.length - 1];
  if (!biggest || !smallest) return "";
  return `The broadest Big Five band difference is ${biggest.t}; the closest band comparison is ${smallest.t}. These are possible areas of translation or recognition, not confirmed causes of relationship difficulty.`;
}

function venusMars(a: NatalChart, b: NatalChart, na: string, nb: string) {
  const va = a.placements.find((x) => x.label === "Venus")?.sign;
  const mb = b.placements.find((x) => x.label === "Mars")?.sign;
  if (!va || !mb) return "";
  return `Symbolically, ${na}'s Venus in ${va} and ${nb}'s Mars in ${mb} describe what one values in closeness meeting how the other pursues it.`;
}

function modalityNote(a: NatalChart, b: NatalChart) {
  const topA = Object.entries(a.modalities).sort((x, y) => y[1] - x[1])[0]?.[0];
  const topB = Object.entries(b.modalities).sort((x, y) => y[1] - x[1])[0]?.[0];
  if (!topA || !topB) return "";
  return topA === topB
    ? `Both charts lean ${topA}, so you tend to approach change at a similar tempo.`
    : `One chart leans ${topA} and the other ${topB}, which traditionally reads as different relationships to change and commitment.`;
}

function letterCompare(a: Profile, b: Profile, i: number, domain: string) {
  const la = a.mbti?.type[i];
  const lb = b.mbti?.type[i];
  if (!la || !lb) return "";
  return la === lb
    ? `You share ${la} on ${domain}, which removes a common source of translation work.`
    : `You differ on ${domain} (${la} vs ${lb}) — a real complement when explicit, a recurring irritation when assumed.`;
}

function verdict(m: Record<PairRule["kind"], string[]>) {
  const support = m.strength.length + m.complement.length + m.similarity.length;
  const friction = m.friction.length + m.misunderstanding.length;
  if (support > friction * 1.5) return "workable ease with identifiable edges";
  if (friction > support * 1.5)
    return "high-contact intensity that will require explicit skill rather than good intentions";
  return "a genuine mix: real resonance alongside real structural friction";
}

function verdictSentence(m: Record<PairRule["kind"], string[]>) {
  return `On balance this reads as ${verdict(m)}.`;
}

function pairHeadline(m: Record<PairRule["kind"], string[]>) {
  const support = m.strength.length + m.complement.length + m.similarity.length;
  const friction = m.friction.length + m.misunderstanding.length;
  if (friction === 0 && support === 0) return "Insufficient Data";
  if (support > friction * 1.5) return "Steady Ground, Sharp Edges";
  if (friction > support * 1.5) return "High Voltage, High Maintenance";
  return "Resonance With Real Friction";
}

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
