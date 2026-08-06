// Assessment question banks + scoring. Pure client-safe logic.

export type Choice = { text: string; value: string };
export type Question = { id: string; prompt: string; a: Choice; b: Choice };

/* ---------------------------------- MBTI ---------------------------------- */

export const MBTI_QUESTIONS: Question[] = [
  {
    id: "m1",
    prompt: "Which sounds more like you?",
    a: { text: "I recharge alone.", value: "I" },
    b: { text: "I recharge around people.", value: "E" },
  },
  {
    id: "m2",
    prompt: "At a gathering where you know few people, you usually…",
    a: { text: "Wait for someone to approach and go deep with one person.", value: "I" },
    b: { text: "Circulate, introduce yourself, keep it light and lively.", value: "E" },
  },
  {
    id: "m3",
    prompt: "After an intense week, the ideal reset is…",
    a: { text: "A quiet room, no plans, no notifications.", value: "I" },
    b: { text: "Friends, movement, somewhere with a bit of noise.", value: "E" },
  },
  {
    id: "m4",
    prompt: "You think best…",
    a: { text: "By writing or turning it over silently first.", value: "I" },
    b: { text: "Out loud, in conversation, as you speak.", value: "E" },
  },
  {
    id: "m5",
    prompt: "Your attention naturally goes to…",
    a: { text: "Patterns, meanings, and what something could become.", value: "N" },
    b: { text: "Details, facts, and what is concretely here.", value: "S" },
  },
  {
    id: "m6",
    prompt: "When learning something new you prefer…",
    a: { text: "The underlying theory and how it all connects.", value: "N" },
    b: { text: "A clear, practical, step-by-step method.", value: "S" },
  },
  {
    id: "m7",
    prompt: "People have described your mind as…",
    a: { text: "Imaginative, abstract, sometimes hard to follow.", value: "N" },
    b: { text: "Grounded, observant, reliably precise.", value: "S" },
  },
  {
    id: "m8",
    prompt: "You trust…",
    a: { text: "A hunch that arrives whole, before you can explain it.", value: "N" },
    b: { text: "What you have personally seen work before.", value: "S" },
  },
  {
    id: "m9",
    prompt: "Making a hard decision, you weigh most heavily…",
    a: { text: "What is logically sound and consistent.", value: "T" },
    b: { text: "Who is affected and how it will land for them.", value: "F" },
  },
  {
    id: "m10",
    prompt: "Someone criticizes your work. Your first reaction is to…",
    a: { text: "Assess whether the critique is accurate.", value: "T" },
    b: { text: "Feel the tone of it before the content.", value: "F" },
  },
  {
    id: "m11",
    prompt: "You would rather be seen as…",
    a: { text: "Competent and fair.", value: "T" },
    b: { text: "Warm and understanding.", value: "F" },
  },
  {
    id: "m12",
    prompt: "In conflict you tend to…",
    a: { text: "Separate the problem from the feelings and solve it.", value: "T" },
    b: { text: "Restore the relationship first, then solve it.", value: "F" },
  },
  {
    id: "m13",
    prompt: "Your ideal week…",
    a: { text: "Is planned in advance, with things settled.", value: "J" },
    b: { text: "Stays open so you can follow what emerges.", value: "P" },
  },
  {
    id: "m14",
    prompt: "Deadlines are…",
    a: { text: "Something you like to beat comfortably early.", value: "J" },
    b: { text: "A useful spike of pressure near the end.", value: "P" },
  },
  {
    id: "m15",
    prompt: "An unexpected change of plan feels…",
    a: { text: "Disruptive — you had already arranged your day.", value: "J" },
    b: { text: "Kind of exciting — new options just opened.", value: "P" },
  },
  {
    id: "m16",
    prompt: "Your physical and digital spaces are…",
    a: { text: "Ordered by a system you maintain.", value: "J" },
    b: { text: "Organized chaos that somehow works.", value: "P" },
  },
  {
    id: "m17",
    prompt: "In a group project you gravitate toward…",
    a: { text: "Quietly doing the deep work yourself.", value: "I" },
    b: { text: "Coordinating people and keeping energy up.", value: "E" },
  },
  {
    id: "m18",
    prompt: "Conversation you find more satisfying…",
    a: { text: "Speculating about ideas and possibilities.", value: "N" },
    b: { text: "Sharing real experiences in vivid detail.", value: "S" },
  },
  {
    id: "m19",
    prompt: "You give advice by…",
    a: { text: "Naming the honest truth even if it stings.", value: "T" },
    b: { text: "Making sure they feel supported first.", value: "F" },
  },
  {
    id: "m20",
    prompt: "You feel most at ease when…",
    a: { text: "A decision is finally made and locked in.", value: "J" },
    b: { text: "Nothing is locked in yet.", value: "P" },
  },
];

export const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

export type Estimate = { label: string; percent: number };

export function scoreMbti(answers: Record<string, string>): Estimate[] {
  const axes: [string, string][] = [
    ["I", "E"],
    ["N", "S"],
    ["T", "F"],
    ["J", "P"],
  ];
  const counts: Record<string, number> = {};
  for (const q of MBTI_QUESTIONS) {
    const v = answers[q.id];
    if (v) counts[v] = (counts[v] ?? 0) + 1;
  }
  const probs: Record<string, number> = {};
  for (const [x, y] of axes) {
    const cx = counts[x] ?? 0;
    const cy = counts[y] ?? 0;
    const total = cx + cy || 1;
    // Laplace-smoothed axis confidence
    probs[x] = (cx + 0.6) / (total + 1.2);
    probs[y] = 1 - probs[x];
  }
  const scored = MBTI_TYPES.map((t) => {
    const p = t.split("").reduce((acc, letter) => acc * (probs[letter] ?? 0.5), 1);
    return { label: t as string, weight: p };
  }).sort((a, b) => b.weight - a.weight);
  const top = scored.slice(0, 3);
  const sum = top.reduce((s, t) => s + t.weight, 0) || 1;
  return normalize(top.map((t) => ({ label: t.label, percent: (t.weight / sum) * 100 })));
}

/* -------------------------------- Enneagram ------------------------------- */

export const ENNEAGRAM_NAMES: Record<number, string> = {
  1: "The Reformer",
  2: "The Helper",
  3: "The Achiever",
  4: "The Individualist",
  5: "The Investigator",
  6: "The Loyalist",
  7: "The Enthusiast",
  8: "The Challenger",
  9: "The Peacemaker",
};

type EnneaQuestion = { id: string; prompt: string; type: number };

export const ENNEAGRAM_QUESTIONS: EnneaQuestion[] = [
  { id: "e1", prompt: "I notice what is wrong or imprecise before I notice what is good.", type: 1 },
  { id: "e2", prompt: "I hold myself to standards most people would find punishing.", type: 1 },
  { id: "e3", prompt: "I sense what others need and provide it, often before being asked.", type: 2 },
  { id: "e4", prompt: "Being needed matters more to me than being admired.", type: 2 },
  { id: "e5", prompt: "I measure myself by what I have accomplished.", type: 3 },
  { id: "e6", prompt: "I adjust how I present myself so I read as impressive.", type: 3 },
  { id: "e7", prompt: "I feel fundamentally different from other people.", type: 4 },
  { id: "e8", prompt: "I am drawn to what is missing and to melancholy beauty.", type: 4 },
  { id: "e9", prompt: "I withdraw to gather knowledge before I engage.", type: 5 },
  { id: "e10", prompt: "My energy and time feel like limited resources to protect.", type: 5 },
  { id: "e11", prompt: "I mentally rehearse what could go wrong so I am prepared.", type: 6 },
  { id: "e12", prompt: "Trust is something I test carefully and grant slowly.", type: 6 },
  { id: "e13", prompt: "I keep several exciting options open at once.", type: 7 },
  { id: "e14", prompt: "I move quickly away from pain toward the next good thing.", type: 7 },
  { id: "e15", prompt: "I would rather confront directly than tiptoe.", type: 8 },
  { id: "e16", prompt: "I instinctively protect people who cannot protect themselves.", type: 8 },
  { id: "e17", prompt: "I merge with others' preferences and lose track of my own.", type: 9 },
  { id: "e18", prompt: "Keeping the peace is worth some of my own discomfort.", type: 9 },
];

export const INSTINCTS = ["Self-Preservation", "Social", "Sexual / One-to-One"] as const;

export function scoreEnneagram(answers: Record<string, number>) {
  const totals: Record<number, number> = {};
  for (const q of ENNEAGRAM_QUESTIONS) {
    totals[q.type] = (totals[q.type] ?? 0) + (answers[q.id] ?? 3);
  }
  const ranked = Object.entries(totals)
    .map(([t, v]) => ({ type: Number(t), score: v }))
    .sort((a, b) => b.score - a.score);
  const core = ranked[0]?.type ?? 9;
  const wingCandidates = [core === 1 ? 9 : core - 1, core === 9 ? 1 : core + 1];
  const wing =
    (totals[wingCandidates[0] as number] ?? 0) >= (totals[wingCandidates[1] as number] ?? 0)
      ? wingCandidates[0]
      : wingCandidates[1];
  const sum = ranked.slice(0, 3).reduce((s, r) => s + r.score, 0) || 1;
  return {
    core,
    wing: wing as number,
    label: `${core}w${wing}`,
    estimates: normalize(
      ranked.slice(0, 3).map((r) => ({
        label: `Type ${r.type} — ${ENNEAGRAM_NAMES[r.type]}`,
        percent: (r.score / sum) * 100,
      })),
    ),
  };
}

/* ------------------------------- Attachment ------------------------------- */

export const ATTACHMENT_STYLES = [
  "Secure",
  "Anxious",
  "Dismissive Avoidant",
  "Fearful Avoidant",
] as const;

type ScaleQuestion = { id: string; prompt: string; key: string; reverse?: boolean };

export const ATTACHMENT_QUESTIONS: ScaleQuestion[] = [
  { id: "a1", prompt: "I find it easy to depend on a partner.", key: "Secure" },
  { id: "a2", prompt: "I can be close without losing myself.", key: "Secure" },
  { id: "a3", prompt: "I trust that people who love me will stay.", key: "Secure" },
  { id: "a4", prompt: "I worry a partner will stop wanting me.", key: "Anxious" },
  { id: "a5", prompt: "Slow replies make my mind spiral.", key: "Anxious" },
  { id: "a6", prompt: "I need frequent reassurance to feel settled.", key: "Anxious" },
  { id: "a7", prompt: "I prefer independence over deep interdependence.", key: "Dismissive Avoidant" },
  { id: "a8", prompt: "When someone gets too close I need distance.", key: "Dismissive Avoidant" },
  { id: "a9", prompt: "I rarely ask for help, even when I need it.", key: "Dismissive Avoidant" },
  { id: "a10", prompt: "I crave closeness and fear it at the same time.", key: "Fearful Avoidant" },
  { id: "a11", prompt: "I pull away right when things get real.", key: "Fearful Avoidant" },
  { id: "a12", prompt: "Intimacy feels unsafe even when nothing is wrong.", key: "Fearful Avoidant" },
];

export function scoreAttachment(answers: Record<string, number>) {
  const totals: Record<string, number> = {};
  for (const q of ATTACHMENT_QUESTIONS) {
    totals[q.key] = (totals[q.key] ?? 0) + (answers[q.id] ?? 3);
  }
  const ranked = Object.entries(totals).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const sum = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
  return {
    primary: ranked[0]?.[0] ?? "Secure",
    estimates: normalize(
      Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ label: k, percent: (v / sum) * 100 })),
    ),
  };
}

/* --------------------------------- Big Five ------------------------------- */

export const BIGFIVE_TRAITS = [
  "Openness",
  "Conscientiousness",
  "Extraversion",
  "Agreeableness",
  "Neuroticism",
] as const;

export const BIGFIVE_QUESTIONS: ScaleQuestion[] = [
  { id: "b1", prompt: "I am fascinated by abstract ideas and art.", key: "Openness" },
  { id: "b2", prompt: "I seek out unfamiliar experiences on purpose.", key: "Openness" },
  { id: "b3", prompt: "I prefer routine over novelty.", key: "Openness", reverse: true },
  { id: "b4", prompt: "I finish what I start, on time.", key: "Conscientiousness" },
  { id: "b5", prompt: "I keep my commitments meticulously.", key: "Conscientiousness" },
  { id: "b6", prompt: "I often leave things until the last moment.", key: "Conscientiousness", reverse: true },
  { id: "b7", prompt: "I feel energized in large social settings.", key: "Extraversion" },
  { id: "b8", prompt: "I speak up readily in groups.", key: "Extraversion" },
  { id: "b9", prompt: "I need long stretches of solitude.", key: "Extraversion", reverse: true },
  { id: "b10", prompt: "I give people the benefit of the doubt.", key: "Agreeableness" },
  { id: "b11", prompt: "I go out of my way to avoid hurting people.", key: "Agreeableness" },
  { id: "b12", prompt: "I am blunt, even when it costs me.", key: "Agreeableness", reverse: true },
  { id: "b13", prompt: "My mood shifts more than most people's.", key: "Neuroticism" },
  { id: "b14", prompt: "I replay stressful moments long afterward.", key: "Neuroticism" },
  { id: "b15", prompt: "I stay calm under pressure.", key: "Neuroticism", reverse: true },
];

export function scoreBigFive(answers: Record<string, number>): Record<string, number> {
  const sums: Record<string, { total: number; n: number }> = {};
  for (const q of BIGFIVE_QUESTIONS) {
    const raw = answers[q.id] ?? 3;
    const v = q.reverse ? 6 - raw : raw;
    const acc = sums[q.key] ?? { total: 0, n: 0 };
    acc.total += v;
    acc.n += 1;
    sums[q.key] = acc;
  }
  const out: Record<string, number> = {};
  for (const trait of BIGFIVE_TRAITS) {
    const acc = sums[trait];
    out[trait] = acc ? Math.round(((acc.total / acc.n - 1) / 4) * 100) : 50;
  }
  return out;
}

/* --------------------------------- helpers -------------------------------- */

function normalize(items: Estimate[]): Estimate[] {
  const rounded = items.map((i) => ({ ...i, percent: Math.round(i.percent) }));
  const drift = 100 - rounded.reduce((s, i) => s + i.percent, 0);
  if (rounded[0]) rounded[0].percent += drift;
  return rounded;
}

export const LIKERT = [
  "Strongly disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly agree",
] as const;
