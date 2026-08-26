export type System = {
  slug: string;
  glyph: string;
  name: string;
  tagline: string;
  whatItIs: string;
  history: string;
  howWeUseIt: string;
  goodToKnow: string;
};

export const SYSTEMS: System[] = [
  {
    slug: "astrology",
    glyph: "⭐",
    name: "Astrology",
    tagline: "The sky at the moment you were born, read as symbolic language.",
    whatItIs:
      "Astrology maps the positions of the sun, moon and planets against the zodiac and the houses at the exact moment and place of your birth, producing a natal chart unique to you.",
    history:
      "Astrology's roots go back over 4,000 years to Babylonian sky-watchers, who first correlated celestial movement with earthly events. It was refined by Hellenistic astrologers in Alexandria, absorbed into medieval Islamic and European scholarship alongside early astronomy, and survives today as a symbolic, interpretive tradition rather than a scientific one.",
    howWeUseIt:
      "We calculate your Sun, Moon, Rising, every planetary placement, house and aspect using real ephemeris math computed in your browser — nothing is pulled from a generic lookup table. Cosmic Dossier treats astrology as a symbolic layer read alongside your psychological profile, not as a scientific predictor.",
    goodToKnow:
      "Astrology has no accepted scientific mechanism and isn't predictive in a testable sense. We include it because symbolic language can be a genuinely useful way to reflect on yourself — not because we're claiming it determines your personality.",
  },
  {
    slug: "mbti",
    glyph: "🧠",
    name: "MBTI",
    tagline: "Sixteen types built from four dichotomies of cognitive preference.",
    whatItIs:
      "The Myers-Briggs Type Indicator sorts personality into 16 types across four axes: Introversion/Extraversion, Sensing/Intuition, Thinking/Feeling, and Judging/Perceiving.",
    history:
      "Developed by Katharine Cook Briggs and her daughter Isabel Briggs Myers starting in the 1940s, MBTI was built on Carl Jung's theory of psychological types and adapted into a practical questionnaire meant to help people understand their own decision-making and communication styles.",
    howWeUseIt:
      "If you already know your type, you can enter it directly. If not, a short 20-question estimate gives you a probability distribution across likely types rather than a single forced answer — your dossier treats it as an estimate, not a verdict.",
    goodToKnow:
      "MBTI has real critics in academic psychology — test-retest reliability is inconsistent, and it isn't part of mainstream personality science the way the Big Five is. We include it because it's genuinely useful as a communication vocabulary, alongside the more research-backed Big Five.",
  },
  {
    slug: "enneagram",
    glyph: "🎭",
    name: "Enneagram",
    tagline: "Nine core motivations, not nine personality types.",
    whatItIs:
      "The Enneagram describes nine interconnected personality types, each organized around a core fear and core desire rather than surface behavior. A 'wing' (an adjacent type) and an instinctual variant add further nuance.",
    history:
      "Its symbol has roots in older geometric and mystical traditions, but the modern psychological Enneagram was developed in the mid-20th century by Oscar Ichazo and later expanded by Claudio Naranjo, who integrated it with clinical observation.",
    howWeUseIt:
      "If you know your type, wing and instinct, enter them directly. Otherwise, an 18-statement assessment estimates your core type based on how you actually respond, not how you'd like to see yourself.",
    goodToKnow:
      "The Enneagram is an interpretive framework for motivation, not a clinical or empirically validated model — we treat it the way we treat astrology: a genuinely useful symbolic lens, read alongside the more research-backed systems rather than in place of them.",
  },
  {
    slug: "synastry",
    glyph: "❤️",
    name: "Synastry",
    tagline: "Two charts and two profiles, compared honestly.",
    whatItIs:
      "Synastry is the practice of comparing two natal charts to explore the dynamics between two people. Cosmic Dossier extends the idea beyond astrology alone, comparing MBTI, Enneagram, attachment style and Big Five between two people as well.",
    history:
      "Astrological synastry dates back to Hellenistic astrology, where comparing two charts was used to advise on marriages and alliances. Comparing psychological personality types between partners is a much more modern addition.",
    howWeUseIt:
      "Add a second person's details on the input page to unlock a synastry report comparing emotional compatibility, communication, conflict style and attachment dynamics across every system in your dossier, not just the astrological chart.",
    goodToKnow:
      "No compatibility system, astrological or psychological, can reliably predict relationship success. Synastry here is meant to surface real patterns worth talking through with a partner, not a score to accept or reject a relationship over.",
  },
  {
    slug: "ai-analysis",
    glyph: "📈",
    name: "Cross-System Synthesis",
    tagline: "One woven read across all your systems, not five separate verdicts.",
    whatItIs:
      "Most personality reports hand you separate write-ups for each system, with no real connection between them. Cosmic Dossier's synthesis engine looks for genuine agreement, contradiction, amplification and tension across all your systems at once.",
    history:
      "This isn't a traditional framework with centuries of history behind it — it's Cosmic Dossier's own rules engine, purpose-built to cross-reference established systems (MBTI, Enneagram, Big Five, attachment theory and symbolic astrology) against each other rather than presenting them in isolation.",
    howWeUseIt:
      "This is a deterministic rules engine, not a live AI model — every combination (like introversion paired with low measured Extraversion, or anxious attachment paired with high Neuroticism) is a specifically authored rule. Results are consistent and computed entirely without an external API.",
    goodToKnow:
      "Because it's rule-based rather than generative, the same inputs always produce the same output — nothing here is invented on the fly. It's best understood as expert-system logic applied to real, established personality frameworks.",
  },
];

export function systemBySlug(slug: string): System | undefined {
  return SYSTEMS.find((s) => s.slug === slug);
}
