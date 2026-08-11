// Enneagram interpretation library.

export type EnneaProfile = {
  type: number;
  name: string;
  coreMotivation: string;
  coreFear: string;
  coreDesire: string;
  strengths: string[];
  blindSpots: string[];
  stress: string;
  interpersonal: string;
  emotional: string;
};

const E = (
  type: number,
  name: string,
  coreMotivation: string,
  coreFear: string,
  coreDesire: string,
  strengths: string[],
  blindSpots: string[],
  stress: string,
  interpersonal: string,
  emotional: string,
): EnneaProfile => ({
  type,
  name,
  coreMotivation,
  coreFear,
  coreDesire,
  strengths,
  blindSpots,
  stress,
  interpersonal,
  emotional,
});

export const ENNEAGRAM_LIBRARY: Record<number, EnneaProfile> = Object.fromEntries(
  [
    E(
      1,
      "The Reformer",
      "To be right, principled and beyond reproach.",
      "Being corrupt, defective or fundamentally wrong.",
      "Integrity — a life that holds up to inspection.",
      ["High standards", "Self-discipline", "Reliability and fairness"],
      ["Chronic inner criticism", "Rigidity about method", "Resentment when others do not carry the standard"],
      "Under stress the inner critic externalises: you become exacting, irritable and unable to rest until it is right.",
      "You lead with correction, which lands as care to some and as judgement to others.",
      "Anger is your background emotion, usually held in as tension rather than expressed.",
    ),
    E(
      2,
      "The Helper",
      "To be indispensable to the people you love.",
      "Being unwanted or unloved for yourself alone.",
      "To be genuinely, freely loved.",
      ["Emotional attunement", "Practical generosity", "Loyalty"],
      ["Giving as a bid for security", "Difficulty naming your own needs", "Resentment when help is not returned"],
      "Stress produces over-giving followed by hurt withdrawal and pointed reminders of what you have done.",
      "You move toward people quickly and can lose the boundary between their needs and yours.",
      "Pride in being needed masks the fear of being unnecessary.",
    ),
    E(
      3,
      "The Achiever",
      "To be valuable through visible accomplishment.",
      "Being worthless without performance.",
      "To feel worth that does not depend on results.",
      ["Drive and efficiency", "Adaptive competence", "Ability to inspire momentum"],
      ["Identity fused with output", "Image management over honesty", "Feelings deferred indefinitely"],
      "Under stress you work harder, present better and disconnect further from what you actually feel.",
      "You calibrate presentation to context, which is effective and can leave people unsure who they met.",
      "Emotion is often postponed rather than felt, then arrives all at once.",
    ),
    E(
      4,
      "The Individualist",
      "To be authentic and significant rather than ordinary.",
      "Having no identity of personal significance.",
      "To be fully known as yourself.",
      ["Emotional honesty", "Aesthetic depth", "Capacity to stay with hard feeling"],
      ["Comparison and envy", "Amplifying longing over presence", "Dismissing the ordinary as inauthentic"],
      "Stress deepens the sense of being defective and different, and pulls you toward melancholy withdrawal.",
      "You want to be met at depth and can test whether people will stay.",
      "You inhabit feeling as identity, which brings both richness and stuckness.",
    ),
    E(
      5,
      "The Investigator",
      "To be competent and self-sufficient through understanding.",
      "Being overwhelmed, invaded or depleted by demand.",
      "Mastery and inviolable inner space.",
      ["Analytical depth", "Emotional non-reactivity", "Independence"],
      ["Hoarding energy and information", "Substituting knowing for doing", "Detaching when closeness demands presence"],
      "Under stress you retreat further, minimise needs and observe rather than participate.",
      "You give access sparingly; those who get it find you unusually loyal.",
      "Feeling is processed later, alone, in translated form.",
    ),
    E(
      6,
      "The Loyalist",
      "To be secure and prepared against what could go wrong.",
      "Being without support or guidance in danger.",
      "Solid ground and trustworthy alliance.",
      ["Foresight about risk", "Fierce loyalty", "Courage despite fear"],
      ["Doubting your own judgement", "Testing people's reliability", "Anxiety mistaken for information"],
      "Stress splits you between compliance and defiance, and you may pre-emptively expect betrayal.",
      "You commit hard once trust is earned, and you scan constantly for inconsistency.",
      "Anxiety is the working medium; certainty rarely feels available.",
    ),
    E(
      7,
      "The Enthusiast",
      "To stay free, stimulated and out of pain.",
      "Being trapped in deprivation or emotional pain.",
      "Satisfaction and genuine contentment.",
      ["Optimism", "Quick synthesis", "Ability to energise a room"],
      ["Escaping discomfort by reframing", "Overcommitment", "Difficulty finishing what became boring"],
      "Under stress you accelerate, add options and refuse to sit still long enough to feel it.",
      "You are exciting company and can vanish when the mood turns heavy.",
      "Pain gets converted to plan, joke or plan B before it lands.",
    ),
    E(
      8,
      "The Challenger",
      "To be strong, in control and unbetrayable.",
      "Being controlled, harmed or made vulnerable.",
      "To protect and never be at anyone's mercy.",
      ["Decisive protection of others", "Direct honesty", "High capacity under pressure"],
      ["Intensity read as aggression", "Vulnerability treated as danger", "Escalating rather than yielding"],
      "Stress increases confrontation and control; softness appears only in private.",
      "You are safe ground for people you claim and formidable to those you do not.",
      "Anger is immediate and clean; tenderness is guarded.",
    ),
    E(
      9,
      "The Peacemaker",
      "To keep inner and outer peace intact.",
      "Loss, fragmentation and conflict severing connection.",
      "Harmony without self-erasure.",
      ["Steady presence", "Genuine acceptance", "Mediating skill"],
      ["Merging with others' preferences", "Passive resistance instead of refusal", "Numbing out your own agenda"],
      "Under stress you go inert, distract yourself, and quietly stop showing up for what you actually want.",
      "You are easy to be with and hard to locate; anger arrives late and sideways.",
      "You dampen intensity in both directions, including your own desire.",
    ),
  ].map((p) => [p.type, p]),
);

export const WING_NOTE: Record<string, string> = {};

export function wingText(core: number, wing: number): string {
  const w = ENNEAGRAM_LIBRARY[wing];
  const c = ENNEAGRAM_LIBRARY[core];
  if (!w || !c) return "";
  return `Your ${core}w${wing} flavour means the ${c.name.replace("The ", "").toLowerCase()} engine runs with ${w.name.replace("The ", "").toLowerCase()} colouring: ${w.coreMotivation.toLowerCase().replace(/\.$/, "")} shows up as a secondary current inside your main motivation.`;
}
