// Static, deterministic Sun sign content for the /zodiac pages.
// Voice and shadow themes align with SIGN_STYLE in src/lib/interpret/astrology.ts.

export type ZodiacElement = "Fire" | "Earth" | "Air" | "Water";
export type ZodiacModality = "Cardinal" | "Fixed" | "Mutable";

export type ZodiacSign = {
  slug: string;
  name: string;
  element: ZodiacElement;
  modality: ZodiacModality;
  ruler: string;
  dates: string;
  tagline: string;
  overview: string;
  coreTraits: string[];
  strengths: string[];
  challenges: string[];
  inRelationships: string;
  atWork: string;
};

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    slug: "aries",
    name: "Aries",
    element: "Fire",
    modality: "Cardinal",
    ruler: "Mars",
    dates: "Mar 21 – Apr 19",
    tagline: "I'd rather start badly than wait to start perfectly.",
    overview:
      "Aries is traditionally associated with the first spark — the impulse to move before the plan is finished. Symbolically it is the sign of initiation, where action comes first and reflection catches up later. The energy is direct, often refreshingly so, and tends to burn hot and fast rather than long and slow.",
    coreTraits: ["First to move", "Blunt by default", "Competitive with itself", "Quick to anger, quick to forget", "Energized by obstacles"],
    strengths: ["Breaks inertia when everyone else is hesitating", "Says the uncomfortable thing plainly", "Recovers fast from setbacks", "Willing to take the first risk"],
    challenges: ["Momentum can outrun the details", "Directness lands as aggression on bad days", "Interest drops once the challenge is solved", "Waiting feels like losing"],
    inRelationships:
      "Aries tends to pursue openly and dislikes games it didn't start. Conflict is usually loud and brief; grudges are rare. The work is learning that a partner's slower pace isn't a lack of interest.",
    atWork:
      "Symbolically suited to launches, crises and anything that needs someone to go first. Maintenance work and long approval chains tend to drain it. Best paired with people who enjoy finishing what it opens.",
  },
  {
    slug: "taurus",
    name: "Taurus",
    element: "Earth",
    modality: "Fixed",
    ruler: "Venus",
    dates: "Apr 20 – May 20",
    tagline: "If it's worth having, it's worth building slowly.",
    overview:
      "Taurus is traditionally linked with the body, the senses and things that last. Symbolically it holds ground: once a direction is chosen, it accumulates rather than pivots. The temperament values comfort, quality and proof over promises.",
    coreTraits: ["Patient accumulation", "Strong sensory taste", "Calm under pressure", "Hard to rush", "Loyal to what's proven"],
    strengths: ["Follows through long after enthusiasm fades", "Steadies anxious rooms", "Good instinct for real value", "Builds resources quietly"],
    challenges: ["Holding ground can become refusing to move", "Change gets resisted even when overdue", "Comfort can shrink the world", "Stubbornness is mistaken for principle"],
    inRelationships:
      "Taurus tends to show love through reliability, physical presence and small, repeated care. It commits slowly and leaves slowly. Partners may need to name changes early, since it rarely volunteers to renegotiate.",
    atWork:
      "Traditionally associated with craft, finance, and anything where patience compounds. It prefers clear expectations and visible results. Constant reorganizations wear on it more than hard work does.",
  },
  {
    slug: "gemini",
    name: "Gemini",
    element: "Air",
    modality: "Mutable",
    ruler: "Mercury",
    dates: "May 21 – Jun 20",
    tagline: "I think out loud, and I think in tabs.",
    overview:
      "Gemini is symbolically the sign of the messenger — gathering, linking and passing things on. It is traditionally associated with curiosity that runs sideways rather than deep at first. The mind is fast, plural, and happiest with two conversations going at once.",
    coreTraits: ["Restless curiosity", "Verbal agility", "Holds contradictions easily", "Reads the room fast", "Bored by repetition"],
    strengths: ["Connects ideas across unrelated fields", "Explains complex things simply", "Adapts tone to any audience", "Learns new systems quickly"],
    challenges: ["Breadth can come at the cost of depth", "Attention scatters across too many threads", "Talking a feeling through can replace feeling it", "Commitments loosen when novelty fades"],
    inRelationships:
      "Gemini tends to bond through conversation; a partner who stops being interesting to talk to is the real risk. It needs variety and mental play. Emotional consistency is the register it often has to practice.",
    atWork:
      "Symbolically suited to writing, teaching, sales, media and any role that rewards synthesis. Narrow, repetitive work tends to drain it fast. It does best with a few anchors and permission to roam.",
  },
  {
    slug: "cancer",
    name: "Cancer",
    element: "Water",
    modality: "Cardinal",
    ruler: "the Moon",
    dates: "Jun 21 – Jul 22",
    tagline: "I remember how everything felt, not just what happened.",
    overview:
      "Cancer is traditionally associated with home, memory and protection. Symbolically it initiates through feeling — it starts by making a place safe enough to grow in. The emotional tide is real and cyclical, and moods tend to carry information rather than noise.",
    coreTraits: ["Protective instinct", "Long emotional memory", "Reads unspoken needs", "Tidal moods", "Builds belonging"],
    strengths: ["Makes people feel genuinely looked after", "Notices distress before it's voiced", "Fierce in defense of its people", "Keeps continuity across years"],
    challenges: ["Protection can tip into control", "Hurt leads to withdrawal rather than conversation", "Old wounds stay vivid", "Caretaking can crowd out its own needs"],
    inRelationships:
      "Cancer tends to love by nourishing and remembering details. Trust is earned slowly, and an indirect approach to conflict can leave partners guessing. Saying the need out loud is usually the growth edge.",
    atWork:
      "Symbolically suited to care, hospitality, teaching and building team culture. It works best where loyalty is returned. Cold, purely transactional environments tend to wear it down.",
  },
  {
    slug: "leo",
    name: "Leo",
    element: "Fire",
    modality: "Fixed",
    ruler: "the Sun",
    dates: "Jul 23 – Aug 22",
    tagline: "If I'm going to do it, I'm going to do it where people can see.",
    overview:
      "Leo is traditionally associated with the heart, creative expression and generosity. Symbolically it is fire held steady — warmth that wants an audience and stays lit. Its pride is often less vanity than a need for the effort to be witnessed.",
    coreTraits: ["Wholehearted expression", "Generous with attention", "Dignity-conscious", "Steady warmth", "Natural sense of occasion"],
    strengths: ["Makes others feel celebrated", "Commits fully to creative work", "Lifts the energy of a group", "Loyal and openly protective"],
    challenges: ["Recognition can become a requirement", "Wounded pride is slow to heal", "Hard to admit uncertainty publicly", "Can take center stage without noticing"],
    inRelationships:
      "Leo tends to love lavishly and expects to be adored back, visibly. Being overlooked hurts more than open criticism. It does best with partners who give praise freely and mean it.",
    atWork:
      "Symbolically suited to leadership, performance and creative direction. It thrives on ownership and credit. Invisible support roles with no acknowledgement tend to dim it.",
  },
  {
    slug: "virgo",
    name: "Virgo",
    element: "Earth",
    modality: "Mutable",
    ruler: "Mercury",
    dates: "Aug 23 – Sep 22",
    tagline: "I can see exactly how this could work better.",
    overview:
      "Virgo is traditionally associated with skill, analysis and useful service. Symbolically it refines — taking something rough and adjusting it until it functions. The attention to detail is a form of care, even when it reads as critique.",
    coreTraits: ["Eye for the flaw", "Practical helpfulness", "Methodical", "Quietly anxious", "Modest about its skill"],
    strengths: ["Catches errors no one else sees", "Turns chaos into working systems", "Reliable under detail-heavy pressure", "Helps without needing credit"],
    challenges: ["Standards turn into self-criticism first", "Analysis can delay action", "Help can sound like correction", "Rest feels unearned"],
    inRelationships:
      "Virgo tends to show love through practical acts — fixing, remembering, improving. It can struggle to receive care without trying to repay it. Learning that being imperfect together is fine is the quiet work.",
    atWork:
      "Symbolically suited to editing, health, operations, research and quality control. It does well with clear standards and autonomy over method. Sloppy processes it isn't allowed to fix frustrate it.",
  },
  {
    slug: "libra",
    name: "Libra",
    element: "Air",
    modality: "Cardinal",
    ruler: "Venus",
    dates: "Sep 23 – Oct 22",
    tagline: "I need to hear the other side before I believe my own.",
    overview:
      "Libra is traditionally associated with balance, fairness and partnership. Symbolically it initiates through relationship — it starts things by bringing people together. Aesthetic sense and social intelligence are strong; decisiveness is often earned rather than given.",
    coreTraits: ["Weighs both sides", "Socially graceful", "Strong sense of fairness", "Aesthetic eye", "Conflict-averse on the surface"],
    strengths: ["Mediates between opposing people", "Makes spaces and ideas more beautiful", "Sees a situation from multiple angles", "Diplomatic under tension"],
    challenges: ["Seeing every side delays choosing one", "Keeps the peace at its own expense", "Harmony can paper over real problems", "Self-definition leans on others' reactions"],
    inRelationships:
      "Libra tends to thrive in partnership and invests heavily in making it pleasant. It may avoid necessary friction. The growth edge is stating a preference before checking what the other person wants.",
    atWork:
      "Symbolically suited to law, design, diplomacy, HR and client work. It shines where judgment and tact are both required. Highly combative cultures drain it quickly.",
  },
  {
    slug: "scorpio",
    name: "Scorpio",
    element: "Water",
    modality: "Fixed",
    ruler: "Mars (traditional) / Pluto (modern)",
    dates: "Oct 23 – Nov 21",
    tagline: "I don't do surface. Either we go in, or we don't go.",
    overview:
      "Scorpio is traditionally associated with depth, intensity and transformation. Symbolically it is water held still — feeling that concentrates rather than flows. It notices what's hidden and tends to trust what has survived pressure.",
    coreTraits: ["All-or-nothing focus", "Perceptive about motive", "Private by default", "Emotionally intense", "Resilient through crisis"],
    strengths: ["Stays steady when things get dark", "Sees through pretense", "Commits completely", "Capable of real reinvention"],
    challenges: ["Depth can become control", "Trust takes a long time to rebuild", "Secrecy reads as distance", "Intensity can overwhelm lighter people"],
    inRelationships:
      "Scorpio tends to want total honesty and total loyalty, and offers the same. Betrayal is hard to forgive. Letting a partner see vulnerability without testing them first is often the work.",
    atWork:
      "Symbolically suited to research, psychology, investigation, crisis work and finance. It excels where others flinch. Shallow office politics bore it; real power dynamics fascinate it.",
  },
  {
    slug: "sagittarius",
    name: "Sagittarius",
    element: "Fire",
    modality: "Mutable",
    ruler: "Jupiter",
    dates: "Nov 22 – Dec 21",
    tagline: "Tell me why it matters, then give me room to find out.",
    overview:
      "Sagittarius is traditionally associated with travel, philosophy and the search for meaning. Symbolically it is fire that roams — enthusiasm aimed at the horizon. Honesty runs high, sometimes ahead of tact.",
    coreTraits: ["Big-picture thinking", "Restless optimism", "Candid to a fault", "Needs freedom", "Hungry for meaning"],
    strengths: ["Inspires people toward bigger goals", "Bounces back with humor", "Makes complex ideas feel exciting", "Brave about new territory"],
    challenges: ["Restlessness can pass as principle", "Promises outrun follow-through", "Bluntness bruises without noticing", "Hard to stay through the boring middle"],
    inRelationships:
      "Sagittarius tends to want a partner who is also a fellow traveler — intellectually or literally. Feeling fenced in is the fastest way to lose it. Staying present when things get ordinary is the growth edge.",
    atWork:
      "Symbolically suited to teaching, publishing, travel, strategy and entrepreneurship. It needs a mission and some autonomy. Micromanagement extinguishes it.",
  },
  {
    slug: "capricorn",
    name: "Capricorn",
    element: "Earth",
    modality: "Cardinal",
    ruler: "Saturn",
    dates: "Dec 22 – Jan 19",
    tagline: "I'll get there. It just won't be by accident.",
    overview:
      "Capricorn is traditionally associated with structure, ambition and time. Symbolically it initiates by committing — choosing a long climb and planning for it. It often matures early and loosens up later, rather than the reverse.",
    coreTraits: ["Long-range planning", "Dry humor", "Self-disciplined", "Respects competence", "Reserved emotionally"],
    strengths: ["Builds things that last", "Takes responsibility without being asked", "Calm and strategic under pressure", "Earns trust through results"],
    challenges: ["Self-worth can get tied to output", "Rest feels like falling behind", "Feelings get filed for later", "Can seem colder than it is"],
    inRelationships:
      "Capricorn tends to show love through provision, consistency and showing up. It may be slow to express tenderness out loud. Partners who value reliability over grand gestures tend to see its full warmth.",
    atWork:
      "Symbolically suited to management, engineering, law, finance and any long-horizon project. It respects hierarchy that's earned. Chaotic, unaccountable workplaces frustrate it deeply.",
  },
  {
    slug: "aquarius",
    name: "Aquarius",
    element: "Air",
    modality: "Fixed",
    ruler: "Saturn (traditional) / Uranus (modern)",
    dates: "Jan 20 – Feb 18",
    tagline: "I care about people. I'm just not always comfortable with persons.",
    overview:
      "Aquarius is traditionally associated with community, innovation and principled independence. Symbolically it steps outside the system to see how it works — and holds that view firmly. It tends to be warm toward humanity in general and more guarded one-on-one.",
    coreTraits: ["Independent thinker", "Principled", "Future-oriented", "Friendly but detached", "Unbothered by convention"],
    strengths: ["Sees systemic problems others accept", "Treats people as equals", "Comfortable being the odd one out", "Generates original solutions"],
    challenges: ["Detachment shows up where warmth was needed", "Fixed opinions can masquerade as open-mindedness", "Ideas can matter more than feelings", "Resists intimacy that feels confining"],
    inRelationships:
      "Aquarius tends to want a friend first and partner second, with plenty of space for both. It dislikes possessiveness. Letting someone close enough to see its emotional side is the stretch.",
    atWork:
      "Symbolically suited to technology, science, activism and nonprofit work. It does best where originality is rewarded. Rigid tradition for its own sake tends to provoke quiet rebellion.",
  },
  {
    slug: "pisces",
    name: "Pisces",
    element: "Water",
    modality: "Mutable",
    ruler: "Jupiter (traditional) / Neptune (modern)",
    dates: "Feb 19 – Mar 20",
    tagline: "I feel the room before I've even walked in.",
    overview:
      "Pisces is traditionally associated with imagination, compassion and dissolving boundaries. Symbolically it is water that takes the shape of its container — absorbing atmosphere and other people's moods. The inner world is vivid and often more real than the schedule.",
    coreTraits: ["Highly empathic", "Imaginative", "Porous boundaries", "Gentle", "Drawn to the spiritual or artistic"],
    strengths: ["Understands people without explanation", "Creative in unusual directions", "Forgives readily", "Comfortable with ambiguity"],
    challenges: ["Absorbs others' moods as its own", "Escapes when reality gets sharp", "Boundaries blur into self-sacrifice", "Practical details slip"],
    inRelationships:
      "Pisces tends to love devotedly and romantically, sometimes idealizing the partner. It can lose itself in the other person. Keeping a separate self inside the relationship is the core work.",
    atWork:
      "Symbolically suited to the arts, healing, music, counseling and spiritual work. It needs meaning and a gentle environment. Harsh deadlines without purpose tend to send it elsewhere mentally.",
  },
];

export function signBySlug(slug: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((s) => s.slug === slug.toLowerCase());
}

export function signsByElement(element: ZodiacElement): ZodiacSign[] {
  return ZODIAC_SIGNS.filter((s) => s.element === element);
}

export function signsByModality(modality: ZodiacModality): ZodiacSign[] {
  return ZODIAC_SIGNS.filter((s) => s.modality === modality);
}
