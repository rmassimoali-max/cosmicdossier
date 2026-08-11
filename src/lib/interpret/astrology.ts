// Astrology interpretation library. Composable planet x sign x house x aspect text.
// Framed explicitly as a symbolic, self-reflective language — not measurement.

export const PLANET_THEME: Record<string, { domain: string; verb: string }> = {
  Sun: { domain: "your core identity and what you are here to develop", verb: "expresses itself" },
  Moon: { domain: "your emotional needs and how you self-soothe", verb: "settles" },
  Rising: { domain: "how you meet the world before it knows you", verb: "presents" },
  Ascendant: { domain: "how you meet the world before it knows you", verb: "presents" },
  Midheaven: { domain: "your public direction and vocation", verb: "points" },
  Mercury: { domain: "how you think, read and speak", verb: "operates" },
  Venus: { domain: "what you value and how you love", verb: "attaches" },
  Mars: { domain: "how you assert, desire and fight", verb: "acts" },
  Jupiter: { domain: "where you expand and what you trust", verb: "grows" },
  Saturn: { domain: "where you meet limit and build durability", verb: "hardens" },
  Uranus: { domain: "where you break pattern", verb: "disrupts" },
  Neptune: { domain: "where boundaries dissolve — imagination and illusion alike", verb: "diffuses" },
  Pluto: { domain: "where you confront power and are remade", verb: "transforms" },
  "North Node": { domain: "the direction of growth that feels unfamiliar", verb: "pulls" },
  "South Node": { domain: "the comfortable competence you over-rely on", verb: "rests" },
};

export const SIGN_STYLE: Record<string, { adj: string; mode: string; shadow: string }> = {
  Aries: { adj: "direct and initiating", mode: "moves first and asks later", shadow: "impatience with anything slow" },
  Taurus: { adj: "steady and sensory", mode: "builds slowly and holds ground", shadow: "resistance to necessary change" },
  Gemini: { adj: "quick and plural", mode: "gathers, connects and talks it through", shadow: "scatter and surface-skimming" },
  Cancer: { adj: "protective and tidal", mode: "works through feeling and memory", shadow: "retreat into the shell when hurt" },
  Leo: { adj: "warm and expressive", mode: "wants to be seen doing it wholeheartedly", shadow: "needing recognition to feel real" },
  Virgo: { adj: "precise and improving", mode: "refines the detail until it functions", shadow: "criticism aimed inward first" },
  Libra: { adj: "relational and balancing", mode: "weighs the other side before acting", shadow: "indecision and over-accommodation" },
  Scorpio: { adj: "intense and penetrating", mode: "goes all the way in or not at all", shadow: "control disguised as depth" },
  Sagittarius: { adj: "expansive and searching", mode: "needs horizon, meaning and room", shadow: "restlessness dressed as principle" },
  Capricorn: { adj: "disciplined and structural", mode: "commits long and pays the cost", shadow: "self-worth tied to output" },
  Aquarius: { adj: "detached and inventive", mode: "steps outside the system to see it", shadow: "distance where warmth was needed" },
  Pisces: { adj: "permeable and imaginative", mode: "absorbs atmosphere and dissolves edges", shadow: "escape when reality gets sharp" },
};

export const HOUSE_THEME: Record<number, string> = {
  1: "self-presentation and beginnings",
  2: "resources, worth and what you hold onto",
  3: "immediate environment, language and siblings",
  4: "home, origin and private ground",
  5: "play, creativity, romance and self-expression",
  6: "work, routine, health and service",
  7: "partnership and the mirror of the other",
  8: "intimacy, power, loss and what is shared",
  9: "meaning, distance and belief",
  10: "vocation, reputation and public direction",
  11: "community, alliance and future orientation",
  12: "the unconscious, retreat and what operates unseen",
};

export const ASPECT_MEANING: Record<string, string> = {
  conjunction: "fuse — they operate as one impulse and are hard to tell apart",
  opposition: "pull against each other and require conscious negotiation",
  trine: "cooperate so easily the talent can go unnoticed",
  square: "grind against each other and generate the friction that builds capability",
  sextile: "assist each other when you deliberately use them together",
  quincunx: "sit awkwardly together and need translation",
  semisquare: "produce low-level irritation that accumulates",
  sesquiquadrate: "create intermittent strain under pressure",
  semisextile: "brush against each other subtly",
  quintile: "combine into a specific creative knack",
};

export function placementText(label: string, sign: string, house: number | null, retro: boolean) {
  const p = PLANET_THEME[label];
  const s = SIGN_STYLE[sign];
  if (!p || !s) return "";
  const parts = [
    `${label} in ${sign}: ${p.domain} ${p.verb} in a ${s.adj} register — it ${s.mode}.`,
  ];
  if (house) parts.push(`Placed in the ${ordinal(house)} house, that energy concentrates around ${HOUSE_THEME[house]}.`);
  if (retro) parts.push(`Retrograde here suggests the theme turns inward before it turns outward, and often gets learned by revisiting.`);
  parts.push(`The shadow to watch is ${s.shadow}.`);
  return parts.join(" ");
}

export function aspectText(a: string, b: string, type: string) {
  const meaning = ASPECT_MEANING[type] ?? "interact";
  return `${a} ${type} ${b}: ${lower(PLANET_THEME[a]?.domain ?? a)} and ${lower(PLANET_THEME[b]?.domain ?? b)} ${meaning}.`;
}

export function elementText(elements: Record<string, number>) {
  const ranked = Object.entries(elements).sort((x, y) => y[1] - x[1]);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  if (!top || !bottom) return "";
  const READ: Record<string, string> = {
    Fire: "momentum, faith and self-assertion",
    Earth: "practicality, patience and tangible results",
    Air: "language, perspective and conceptual distance",
    Water: "feeling, memory and instinctive attunement",
  };
  return `Your chart weights ${top[0]} most heavily, so ${READ[top[0]]} come naturally; ${bottom[0]} is thinnest, so ${READ[bottom[0]]} is the register you have to build deliberately rather than inherit.`;
}

export function modalityText(m: Record<string, number>) {
  const ranked = Object.entries(m).sort((x, y) => y[1] - x[1]);
  const top = ranked[0]?.[0] ?? "Cardinal";
  const READ: Record<string, string> = {
    Cardinal: "you start things — initiation is easier than maintenance",
    Fixed: "you sustain things — holding is easier than changing course",
    Mutable: "you adapt — adjusting is easier than committing to one form",
  };
  return `Modality balance leans ${top}: ${READ[top]}.`;
}

const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 10 > 3 || (n >= 11 && n <= 13) ? 0 : n % 10]}`;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export const ASTROLOGY_DISCLAIMER =
  "Astrology is included here as an interpretive, symbolic language for self-reflection — a set of images to think with, not a measurement of personality. The psychological sections are self-report estimates, not clinical instruments.";
