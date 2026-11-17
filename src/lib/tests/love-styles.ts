// Love Styles — five styles of giving and receiving affection
// (words, time, gifts, acts of service, touch), inspired by Gary Chapman.
import type { TestDef } from "./types";
import { AGREE_5, buildDims, multiDimHelpers, type DimSpec } from "./build";

const DIMS: DimSpec[] = [
  { key: "words", label: "Words of Affirmation", blurb: "Love lands when it is said out loud.", archetypes: ["the-empath", "the-harmonizer"],
    low: "Verbal reassurance is nice but not essential for you — you trust actions more than statements.", mid: "Kind words matter to you, especially at key moments, without being your main channel.", high: "Spoken appreciation is oxygen for you. Specific, sincere words tell you that you're seen — and criticism stings more than it might for others.",
    items: ["Hearing \"I'm proud of you\" means a lot to me.", "I remember compliments for a long time.", "-I don't need people to say how they feel about me.", "A thoughtful message can change my whole day."] },
  { key: "time", label: "Quality Time", blurb: "Love is undivided attention.", archetypes: ["the-observer", "the-harmonizer"],
    low: "You're comfortable with partners who show love while busy — presence doesn't need to be constant.", mid: "Shared time matters to you, though you don't measure love by hours together.", high: "Undistracted attention is how you feel loved. Phones on the table or half-listening register as distance.",
    items: ["I feel most loved when someone gives me their full attention.", "Distracted conversations make me feel unimportant.", "Shared experiences matter more to me than presents.", "-I'm fine if a partner is usually busy when we're together."] },
  { key: "gifts", label: "Receiving Gifts", blurb: "Love is a tangible token of thought.", archetypes: ["the-visionary", "the-empath"],
    low: "Objects carry little emotional weight for you; the gesture matters more than the thing.", mid: "You appreciate a well-chosen gift, especially one that proves someone was thinking of you.", high: "A thoughtful gift is proof of being held in mind. Forgotten occasions can feel like forgotten people.",
    items: ["A small, thoughtful gift makes me feel deeply cared for.", "I keep meaningful tokens people have given me.", "-Gifts don't really matter to me.", "Forgetting a special occasion would hurt me."] },
  { key: "service", label: "Acts of Service", blurb: "Love is help that lightens the load.", archetypes: ["the-warden", "the-strategist"],
    low: "You'd rather handle things yourself; help can even feel intrusive.", mid: "Practical help is welcome, especially when you're stretched thin.", high: "Love, for you, is a verb. When someone quietly takes something off your plate, you feel it more than any speech.",
    items: ["When someone helps me with a chore, I feel loved.", "Actions speak louder than words to me.", "-I'd rather do things myself than have someone help.", "Broken promises to help bother me a lot."] },
  { key: "touch", label: "Physical Touch", blurb: "Love is closeness you can feel.", archetypes: ["the-firestarter", "the-maverick"],
    low: "Physical affection is not your main channel; you may prefer more personal space.", mid: "Touch matters in close relationships, though it isn't how you primarily register love.", high: "Hugs, hand-holding and closeness are how you feel safe and connected. Physical distance quickly reads as emotional distance.",
    items: ["A hug can make me feel better instantly.", "I like to sit close to the people I love.", "-I prefer not to be touched much, even by partners.", "Holding hands makes me feel connected."] },
];

const { items, dimensions } = buildDims("ls", DIMS);

export const LOVE_STYLES_TEST: TestDef = {
  slug: "love-styles",
  name: "Love Styles",
  category: "Relationships & Attachment",
  tagline: "The languages you most want love spoken in.",
  metaDescription: "Discover which of five love styles — words, time, gifts, acts of service or touch — makes you feel most loved with this free, private quiz.",
  whatItMeasures: "This test ranks five ways of experiencing affection — words of affirmation, quality time, receiving gifts, acts of service and physical touch — so you can see which channels matter most to you.",
  background: "Gary Chapman's 1992 book The Five Love Languages proposed that people give and receive love in different primary ways. Research finds the categories useful as a conversation tool, though people usually value several and the evidence for 'matching' predicting satisfaction is mixed.",
  citation: "Chapman, G. (1992). The Five Love Languages. Northfield Publishing. See also Impett, Park & Muise (2024), Current Directions in Psychological Science.",
  minutes: "~3 minutes",
  scale: AGREE_5,
  disclaimer: "Love styles are a communication tool, not a scientific typology. Most people value all five to some degree.",
  items,
  dimensions,
  ...multiDimHelpers(DIMS, "love style"),
};
