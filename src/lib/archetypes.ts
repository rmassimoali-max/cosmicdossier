export type Archetype = {
  slug: string;
  name: string;
  symbol: string;
  tagline: string;
  description: string;
  coreTraits: string[];
  strengths: string[];
  blindSpots: string[];
  relationshipTendencies: string;
  communicationTendencies: string;
  growthThemes: string;
  flavor: { mbti: string; enneagram: string; element: string };
  merchId: string;
};

export const ARCHETYPES: Archetype[] = [
  {
    slug: "the-architect",
    name: "The Architect",
    symbol: "🏛️",
    tagline: "I build the structure before I trust the feeling.",
    description:
      "You default to systems. Given a problem, your instinct is to model it before you act on it — and you're usually right more often than the people who skipped that step. The cost is that you can build an extremely accurate map of a situation without ever entering it.",
    coreTraits: ["Systemic thinker", "Private", "Exacting", "Independent", "Slow to trust"],
    strengths: ["Sees structure others miss", "Rarely fooled by surface-level noise", "Reliable under pressure"],
    blindSpots: ["Can over-analyze instead of act", "Slow to let people in", "Mistakes preparation for progress"],
    relationshipTendencies:
      "You need real independence inside a relationship, not just permission for it. Closeness earns trust incrementally, through demonstrated competence and consistency, rather than through declared intention.",
    communicationTendencies:
      "Precise, low on small talk. You'd rather say one accurate sentence than five approximate ones.",
    growthThemes:
      "Practicing action before certainty arrives — treating a plan as a draft, not a prerequisite.",
    flavor: { mbti: "NT", enneagram: "Type 5", element: "Air / Earth" },
    merchId: "arch-01",
  },
  {
    slug: "the-empath",
    name: "The Empath",
    symbol: "🌊",
    tagline: "I notice what a room is feeling before it says so.",
    description:
      "You read emotional undercurrents fast and carry them longer than the people who produced them. This makes you unusually good in a crisis and unusually tired afterward — the sensitivity that makes you valuable to others rarely gets budgeted for your own recovery.",
    coreTraits: ["Attuned", "Absorbing", "Warm", "Conflict-averse", "Self-sacrificing"],
    strengths: ["Genuine emotional intelligence", "Makes people feel truly seen", "Strong intuition about others"],
    blindSpots: ["Over-adapts to keep peace", "Own needs filed last", "Struggles to name resentment before it's built up"],
    relationshipTendencies:
      "You give generously and expect closeness to be mutual by default — the gap between the two is where most of your relational pain lives.",
    communicationTendencies:
      "Gentle, indirect when stakes are high. You'll often signal a boundary long before you state it outright.",
    growthThemes: "Practicing the small 'no' early, before resentment forces the large one.",
    flavor: { mbti: "NF", enneagram: "Type 2 / 4", element: "Water" },
    merchId: "arch-02",
  },
  {
    slug: "the-catalyst",
    name: "The Catalyst",
    symbol: "🔥",
    tagline: "Momentum is how I outrun the hard feeling.",
    description:
      "New ideas, new rooms, new momentum — you're energized by what's next in a way that can look like scattered enthusiasm from the outside but functions, internally, as fuel. The risk is that stillness is where your unresolved stuff actually lives, and you're very good at not stopping.",
    coreTraits: ["Idea-driven", "Restless", "Optimistic", "Persuasive", "Avoids stillness"],
    strengths: ["Generates real momentum in stalled situations", "Makes people want to try things", "Recovers from setbacks fast"],
    blindSpots: ["Avoids depth by staying busy", "Starts more than finishes", "Uses activity to outrun discomfort"],
    relationshipTendencies:
      "You bring energy and possibility into a relationship easily; staying present through a hard, boring stretch is the harder skill.",
    communicationTendencies: "Fast, associative, enthusiastic — sometimes three topics ahead of the room.",
    growthThemes: "Sitting in an uncomfortable feeling without immediately reaching for the next thing.",
    flavor: { mbti: "NF / NP", enneagram: "Type 7", element: "Fire" },
    merchId: "arch-03",
  },
  {
    slug: "the-guardian",
    name: "The Guardian",
    symbol: "🛡️",
    tagline: "I'd rather be steady than impressive.",
    description:
      "You're the person people quietly rely on — not because you announced it, but because you consistently show up. Security matters more to you than novelty, and you'll do the unglamorous, necessary work that keeps things from falling apart.",
    coreTraits: ["Loyal", "Security-seeking", "Dutiful", "Vigilant", "Undersells own needs"],
    strengths: ["Deeply dependable", "Anticipates problems early", "Holds commitments others drop"],
    blindSpots: ["Checks for inconsistency, then feels guilty for checking", "Struggles to ask for support directly", "Can mistake worry for diligence"],
    relationshipTendencies:
      "You want predictability stated out loud — not more affection, but more legible affection: plans, timing, follow-through.",
    communicationTendencies: "Careful, considered, sometimes withholding the real concern until directly asked.",
    growthThemes: "Naming a worry the moment it appears, instead of managing it alone first.",
    flavor: { mbti: "SJ", enneagram: "Type 6", element: "Earth" },
    merchId: "arch-04",
  },
  {
    slug: "the-maverick",
    name: "The Maverick",
    symbol: "⚡",
    tagline: "I trust my own read over the room's consensus.",
    description:
      "You don't default to agreement, and you're comfortable being the person who says the uncomfortable true thing. That directness is a genuine asset in situations that need it — and a liability in the ones that just needed you to listen a little longer first.",
    coreTraits: ["Assertive", "Independent", "Direct", "Protective", "Guarded"],
    strengths: ["Says what others won't", "Hard to manipulate", "Decisive under pressure"],
    blindSpots: ["Reads vulnerability as risk", "Can escalate before de-escalating", "Underestimates the cost of bluntness"],
    relationshipTendencies:
      "Outwardly formidable, inwardly more ambivalent about closeness than you let on. Trust is earned through demonstrated reliability, not sentiment.",
    communicationTendencies: "Blunt, efficient, low patience for hedging or repetition.",
    growthThemes: "Letting a moment of real vulnerability stand without immediately reasserting control.",
    flavor: { mbti: "NT / NP", enneagram: "Type 8", element: "Fire / Air" },
    merchId: "arch-05",
  },
  {
    slug: "the-observer",
    name: "The Observer",
    symbol: "🔭",
    tagline: "I notice more than I reveal.",
    description:
      "You process privately and share selectively — by the time you say something out loud, you've usually already turned it over from several angles. People underestimate how much you're tracking, largely because you rarely announce it.",
    coreTraits: ["Perceptive", "Private", "Self-contained", "Analytical", "Slow to open up"],
    strengths: ["Sees patterns before others do", "Rarely reactive", "Trusted with sensitive information"],
    blindSpots: ["Can build a full model of a situation without ever entering it", "Withholds reactions people need to hear", "Mistakes observing for participating"],
    relationshipTendencies:
      "You let people in gradually, on your own schedule, and can be genuinely hard to read even when you're fully invested.",
    communicationTendencies: "Economical. What you do say tends to be exact, which makes it land harder.",
    growthThemes: "Voicing a reaction in the moment it happens, before it's been fully processed.",
    flavor: { mbti: "NT", enneagram: "Type 5", element: "Air" },
    merchId: "arch-06",
  },
  {
    slug: "the-harmonizer",
    name: "The Harmonizer",
    symbol: "🕊️",
    tagline: "I'll go along with a lot — until I won't.",
    description:
      "You're easy to be around because you genuinely don't need to win most arguments. The exception is the line you didn't know was there until someone crossed it — and by then you've usually already checked out rather than said so.",
    coreTraits: ["Easygoing", "Accommodating", "Steady", "Conflict-avoidant", "Quietly stubborn"],
    strengths: ["Diffuses tension naturally", "Genuinely low-drama", "Sees multiple sides of a disagreement"],
    blindSpots: ["Agrees in the moment, withdraws effort later", "Merges with others' priorities over their own", "Disagreement often goes unspoken, not unfelt"],
    relationshipTendencies:
      "You go along with things easily and then quietly leave the room emotionally rather than raise the actual objection.",
    communicationTendencies: "Agreeable on the surface; the real position takes longer, more direct prompting to surface.",
    growthThemes: "Stating the objection out loud in the moment it's felt, not after it's calcified.",
    flavor: { mbti: "SP", enneagram: "Type 9", element: "Water / Earth" },
    merchId: "arch-07",
  },
  {
    slug: "the-visionary",
    name: "The Visionary",
    symbol: "🧭",
    tagline: "I can already see where this goes.",
    description:
      "You think in outcomes and drive toward them, often before others have finished framing the problem. That forward orientation is genuinely rare — the risk is treating the destination as the only part that matters, and the people or process along the way as secondary.",
    coreTraits: ["Big-picture", "Driven", "Confident", "Outcome-focused", "Impatient with process"],
    strengths: ["Sets direction others can follow", "Comfortable making the call", "Recovers fast from failed attempts"],
    blindSpots: ["Substitutes a better result for a harder conversation", "Impatient with people who move slower", "Self-image tracks recent output more than it should"],
    relationshipTendencies:
      "You show love through momentum and provision more naturally than through slowing down — presence can read, to a partner, as a thing you schedule rather than default to.",
    communicationTendencies: "Confident, forward-looking, sometimes several steps ahead of where the conversation actually is.",
    growthThemes: "Staying in a slow, unresolved moment instead of moving straight to the next action.",
    flavor: { mbti: "NT", enneagram: "Type 3 / 8", element: "Fire" },
    merchId: "arch-08",
  },
];

export function archetypeBySlug(slug: string): Archetype | undefined {
  return ARCHETYPES.find((a) => a.slug === slug);
}
