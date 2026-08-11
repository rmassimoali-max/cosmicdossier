// Big Five interpretation library. Deterministic band-based lookups.

export const BIG_FIVE = [
  "Openness",
  "Conscientiousness",
  "Extraversion",
  "Agreeableness",
  "Neuroticism",
] as const;
export type BigFiveTrait = (typeof BIG_FIVE)[number];

export type Band = "low" | "moderate" | "high";

export function band(score: number): Band {
  if (score >= 66) return "high";
  if (score <= 35) return "low";
  return "moderate";
}

export const BAND_LABEL: Record<Band, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

type TraitBand = {
  read: string;
  strengths: string[];
  difficulties: string[];
  interpersonal: string;
  emotional: string;
  work: string;
};

export const BIG_FIVE_BLURB: Record<BigFiveTrait, string> = {
  Openness: "Appetite for ideas, novelty, art and internal complexity.",
  Conscientiousness: "Orderliness, follow-through and impulse regulation.",
  Extraversion: "Where your energy comes from and how outwardly you spend it.",
  Agreeableness: "Default posture toward others: accommodation versus challenge.",
  Neuroticism: "Sensitivity of the threat and distress system.",
};

export const BIG_FIVE_LIBRARY: Record<BigFiveTrait, Record<Band, TraitBand>> = {
  Openness: {
    high: {
      read: "You are drawn to the unfamiliar and think in abstractions, metaphors and possibilities.",
      strengths: ["Original thinking", "Comfort with complexity", "Aesthetic sensitivity"],
      difficulties: ["Restlessness with routine", "Idea churn over completion", "Overthinking simple choices"],
      interpersonal: "You bond over ideas and want conversation that goes somewhere unexpected.",
      emotional: "Your inner life is vivid and layered, which deepens both pleasure and unease.",
      work: "You do best with problems that are genuinely open rather than procedures to maintain.",
    },
    moderate: {
      read: "You can move between novelty and reliability without needing either constantly.",
      strengths: ["Practical creativity", "Willing to try, willing to keep", "Balanced curiosity"],
      difficulties: ["Can under-commit to a direction", "May defer to stronger voices on taste"],
      interpersonal: "You adapt to both concrete and conceptual conversation partners.",
      emotional: "Your inner world is active but not overwhelming.",
      work: "You handle both innovation and steady execution.",
    },
    low: {
      read: "You prefer the proven, the concrete and the clearly useful over the speculative.",
      strengths: ["Focus", "Practical grounding", "Consistency of taste and method"],
      difficulties: ["Discomfort with sudden change", "Undervaluing abstract framing", "Slower to adopt new methods"],
      interpersonal: "You bond over shared activity and real experience more than theory.",
      emotional: "Your inner life is steadier and less prone to imaginative amplification.",
      work: "You excel where mastery, precision and reliability matter more than reinvention.",
    },
  },
  Conscientiousness: {
    high: {
      read: "You plan, finish and hold standards, often past the point of comfort.",
      strengths: ["Reliability", "Long-horizon discipline", "Detail integrity"],
      difficulties: ["Perfectionism", "Rigidity when plans change", "Difficulty resting"],
      interpersonal: "You are the person others rely on, and you can quietly resent carrying more.",
      emotional: "Control soothes you; disorder registers as threat.",
      work: "You are highly effective in structured, accountable roles and dislike ambiguity in ownership.",
    },
    moderate: {
      read: "You are organised when it matters and flexible when it does not.",
      strengths: ["Adaptive structure", "Reasonable follow-through", "Tolerable with both planners and improvisers"],
      difficulties: ["Occasional slippage under low pressure", "Inconsistent systems"],
      interpersonal: "You neither impose structure nor resist it strongly.",
      emotional: "You handle disorder without spiralling and order without rigidity.",
      work: "You cope with both process-driven and fluid environments.",
    },
    low: {
      read: "You work in bursts driven by interest rather than schedule.",
      strengths: ["Spontaneity", "Comfort with mess", "Fast pivots"],
      difficulties: ["Deadline pressure as the main engine", "Unfinished threads", "Administrative drag"],
      interpersonal: "You may frustrate structured people and relieve rigid ones.",
      emotional: "Constraint feels heavier to you than chaos does.",
      work: "You need flexible deadlines, interest-led tasks and support on logistics.",
    },
  },
  Extraversion: {
    high: {
      read: "Contact energises you and you think partly by talking.",
      strengths: ["Momentum", "Social ease", "Visible leadership"],
      difficulties: ["Understimulated when alone", "Speaking before processing", "Filling silence that needed to stay open"],
      interpersonal: "You initiate readily and expect responsiveness.",
      emotional: "You metabolise feeling by expressing it outward.",
      work: "You do best in collaborative, high-contact, fast-feedback settings.",
    },
    moderate: {
      read: "You enjoy people in doses and recover in solitude.",
      strengths: ["Flexible social range", "Comfortable leading or listening"],
      difficulties: ["Can be misread by both extremes", "Energy budgeting matters"],
      interpersonal: "You can meet both louder and quieter people where they are.",
      emotional: "You process partly aloud and partly alone.",
      work: "You handle teamwork and solo depth about equally.",
    },
    low: {
      read: "Solitude restores you and stimulation depletes faster than others realise.",
      strengths: ["Depth of focus", "Listening", "Considered speech"],
      difficulties: ["Visibility costs energy", "Slower to assert presence", "Read as distant when simply quiet"],
      interpersonal: "You prefer a few real conversations to many light ones.",
      emotional: "You process internally first and may share only the conclusion.",
      work: "You need protected solo time and low-noise environments.",
    },
  },
  Agreeableness: {
    high: {
      read: "Your default is cooperation, generosity and assuming good intent.",
      strengths: ["Trust-building", "Repairing conflict", "Genuine consideration"],
      difficulties: ["Difficulty with boundaries", "Suppressed disagreement", "Over-accommodating the demanding"],
      interpersonal: "You are easy to be close to and easy to take advantage of.",
      emotional: "Others' discomfort registers almost as your own.",
      work: "You strengthen teams but may under-advocate for yourself.",
    },
    moderate: {
      read: "You cooperate readily but hold your line when it matters.",
      strengths: ["Balanced candour", "Negotiation", "Warm without self-erasure"],
      difficulties: ["Occasional inconsistency about when to push"],
      interpersonal: "You can be kind and direct in the same conversation.",
      emotional: "You feel for others without dissolving into them.",
      work: "You collaborate well and can still say no.",
    },
    low: {
      read: "You lead with candour and are unbothered by friction.",
      strengths: ["Directness", "Independent standards", "Willing to say the unpopular thing"],
      difficulties: ["Bluntness read as hostility", "Underestimating relational maintenance", "Skepticism as a default"],
      interpersonal: "People know where they stand, though warmth may need translation.",
      emotional: "You are less porous to others' states, which protects and isolates.",
      work: "You are valuable where honest assessment matters more than comfort.",
    },
  },
  Neuroticism: {
    high: {
      read: "Your threat system is sensitive and set to notice what could go wrong.",
      strengths: ["Early risk detection", "Emotional depth", "Conscientious anticipation"],
      difficulties: ["Rumination", "Reactivity to ambiguity", "Physical stress load"],
      interpersonal: "You need explicit reassurance because ambiguity fills with worst cases.",
      emotional: "Feelings arrive strongly and take longer to settle.",
      work: "You perform best with clear expectations and predictable feedback.",
    },
    moderate: {
      read: "You feel stress normally and recover at an ordinary pace.",
      strengths: ["Realistic risk sense", "Emotional access without flooding"],
      difficulties: ["Bad weeks can still tip into rumination"],
      interpersonal: "You can name distress without it dominating.",
      emotional: "You feel it, then generally move through it.",
      work: "You cope with normal pressure well.",
    },
    low: {
      read: "You are unusually steady, slow to alarm and quick to settle.",
      strengths: ["Calm in crisis", "Low rumination", "Fast recovery"],
      difficulties: ["Missing early warning signs", "Underestimating others' distress", "Reading urgency as overreaction"],
      interpersonal: "You are stabilising, and you can seem unmoved when someone needs visible concern.",
      emotional: "Your baseline is even; intensity is rare and brief.",
      work: "You hold high-pressure roles without much cost.",
    },
  },
};

export function bigFiveEntry(trait: BigFiveTrait, score: number) {
  const b = band(score);
  return { band: b, ...BIG_FIVE_LIBRARY[trait][b] };
}
