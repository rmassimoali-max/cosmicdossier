export type AttachmentSlug = "secure" | "anxious" | "dismissive-avoidant" | "fearful-avoidant";

export type HealingInfo = {
  whereToStart: string;
  whatTheProcessInvolves: string;
  encouragement: string;
};

export type AttachmentStyleContent = {
  slug: AttachmentSlug;
  name: string;
  tagline: string;
  overview: string;
  howItShowsUp: { context: string; example: string }[];
  development: string;
  reflectionPrompts: string[];
  healing?: HealingInfo;
};

export const ATTACHMENT_STYLES: AttachmentStyleContent[] = [
  {
    slug: "secure",
    name: "Secure Attachment",
    tagline: "Closeness doesn't require abandoning independence, and distance doesn't feel like danger.",
    overview:
      "Securely attached people tend to trust that others will be responsive to their needs, and trust their own ability to handle it if that's occasionally not the case. Closeness and independence aren't in conflict — both are available at once.",
    howItShowsUp: [
      {
        context: "Romantic relationships",
        example:
          "Can bring up a real problem directly, stay in the conversation while it's uncomfortable, and still feel confident in the relationship the next day.",
      },
      {
        context: "Friendships",
        example:
          "Comfortable with a friend needing space without reading it as rejection, and comfortable asking for support without assuming it's a burden.",
      },
      {
        context: "Work",
        example:
          "Can receive critical feedback without it destabilizing their sense of competence, and can disagree with a manager without fearing the relationship is at risk.",
      },
      {
        context: "Family",
        example:
          "Able to set a boundary with a parent or sibling without extended guilt, while still remaining genuinely warm toward them.",
      },
    ],
    development:
      "Mary Ainsworth's Strange Situation studies in the 1970s found that infants who developed secure attachment generally had caregivers who were consistently responsive — not perfect, but reliably attuned enough that the child learned distress would be met rather than ignored or escalated. Longitudinal research since (including the Minnesota Longitudinal Study of Risk and Adaptation) has tracked secure attachment in infancy forward into more resilient, flexible relationship patterns in adulthood, though attachment style can and does shift across the lifespan based on later relationships.",
    reflectionPrompts: [
      "When a partner or close friend needs space, is your first instinct to assume something's wrong, or to give them room and trust it'll resolve itself?",
      "Can you recall the last time you brought up something that bothered you directly, rather than waiting for it to pass or bringing it up indirectly?",
      "Do you generally believe people close to you will be there if something actually goes wrong?",
    ],
  },
  {
    slug: "anxious",
    name: "Anxious Attachment",
    tagline: "Connection feels safest when it's constantly reconfirmed.",
    overview:
      "Anxious attachment (sometimes called anxious-preoccupied) is organized around a persistent uncertainty about whether closeness will hold — so reassurance gets sought frequently, and ambiguity (a slow reply, a shorter-than-usual conversation) tends to fill in with worst-case explanations before any facts arrive.",
    howItShowsUp: [
      {
        context: "Romantic relationships",
        example:
          "A partner takes longer than usual to text back, and within twenty minutes a full narrative about them losing interest has already formed — before there's any actual evidence either way.",
      },
      {
        context: "Friendships",
        example:
          "Notices immediately if a friend seems slightly less warm than usual, and replays the last conversation looking for what might have caused it.",
      },
      {
        context: "Work",
        example:
          "A manager's neutral tone in a one-on-one gets interpreted as dissatisfaction, prompting extra effort to 'fix' a problem that may not have existed.",
      },
      {
        context: "Family",
        example:
          "Feels responsible for managing a parent's mood, and experiences real anxiety when a family member seems upset, even about something unrelated.",
      },
    ],
    development:
      "Ainsworth's original research linked this pattern to inconsistent caregiving — a caregiver who was sometimes deeply attuned and sometimes unavailable, so the child learned that connection was real but not reliable, which kept the attachment system in a heightened, vigilant state. Hazan and Shaver's extension of attachment theory into adult romantic relationships in the late 1980s found this same vigilance reappearing in adult partnerships, often intensifying under stress or perceived threat to the relationship.",
    reflectionPrompts: [
      "Have you ever felt deeply hurt or betrayed by a partner but still dreaded the idea of the relationship ending more than the hurt itself?",
      "Do you find yourself checking for small signs something's wrong — tone, response time, a change in routine — more than the people around you seem to?",
      "After a disagreement, do you feel a strong pull to resolve it immediately, even if you're the one who needs more time to think?",
    ],
    healing: {
      whereToStart:
        "The first real shift is usually learning to sit with uncertainty for a few minutes before acting on it — noticing the urge to seek immediate reassurance (a text, a call, a question) and building a small amount of space between the feeling and the action.",
      whatTheProcessInvolves:
        "Healing work here generally involves building genuine self-soothing capacity so reassurance can be wanted without being urgently needed, learning to distinguish an actual relational problem from an anxious prediction, and — often the hardest part — tolerating a partner's normal, healthy independence without treating it as a threat.",
      encouragement:
        "This pattern responds well to real work, and it's genuinely one of the more common experiences in adult relationships — not a character flaw. A therapist trained in attachment-based approaches can help build this capacity directly, and there's also strong self-help literature specifically on anxious attachment if therapy isn't accessible right now. Either way, wanting connection this deeply is not the problem to fix — the goal is trusting it without needing constant proof.",
    },
  },
  {
    slug: "dismissive-avoidant",
    name: "Dismissive Avoidant Attachment",
    tagline: "Independence isn't a defense — it's the default setting.",
    overview:
      "Dismissive avoidant attachment is organized around minimizing the importance of closeness altogether — not out of active fear of people, but because self-sufficiency was learned early as the more reliable option. Distance doesn't register as loss the way it does for other styles; it often registers as relief.",
    howItShowsUp: [
      {
        context: "Romantic relationships",
        example:
          "A partner wants to talk through a hard feeling, and the instinct is to solve it quickly or change the subject rather than sit inside the emotional weight of it.",
      },
      {
        context: "Friendships",
        example:
          "Genuinely comfortable going long stretches without contact, and doesn't experience the distance as anything worth addressing.",
      },
      {
        context: "Work",
        example:
          "Prefers working independently even when collaboration would help, and can find close team dynamics draining rather than energizing.",
      },
      {
        context: "Family",
        example:
          "Keeps family relationships civil but at real emotional arm's length, often being the family member who's hardest to get a real read on.",
      },
    ],
    development:
      "This pattern is frequently linked to caregiving that was consistently distant, dismissive of emotional needs, or that discouraged displays of distress — the child adapts by deactivating the attachment system itself, since seeking closeness reliably didn't produce comfort. Research on adult romantic attachment (building on Hazan and Shaver, and later Bartholomew's four-category model that distinguished dismissive from fearful avoidance) found this deactivation strategy persisting into adult relationships as genuine comfort with distance rather than a performance of it.",
    reflectionPrompts: [
      "Are you able to end a relationship or close friendship and move on relatively quickly, as though it held less weight than the other person believed it did?",
      "When someone gets emotionally intense with you, is your instinct to create distance rather than lean in?",
      "Do you tend to describe your own difficult experiences (a breakup, a loss) in a notably matter-of-fact way, even when others expect more visible emotion?",
    ],
    healing: {
      whereToStart:
        "The starting point is usually noticing the specific moment closeness starts to feel like too much — and getting curious about that moment rather than automatically acting on the urge to withdraw.",
      whatTheProcessInvolves:
        "This work generally involves rebuilding a felt sense that needing others is safe, not just tolerable — practicing staying present during someone else's emotional moment instead of moving to fix or exit it, and learning to notice and name your own emotional needs before they've built up enough to leak out as irritation or distance.",
      encouragement:
        "Wanting real independence isn't the problem here — it's a genuine strength in the right amounts. The goal isn't becoming a different kind of person, it's making closeness an available option rather than an automatically avoided one. A therapist experienced with avoidant patterns can help this feel less like a threat and more like a skill you're building — and for many people, the discomfort of the process itself is a sign real movement is happening.",
    },
  },
  {
    slug: "fearful-avoidant",
    name: "Fearful-Avoidant Attachment",
    tagline: "Wanting closeness and fearing it, at exactly the same time.",
    overview:
      "Fearful-avoidant attachment (also called disorganized attachment) holds both the anxious style's fear of abandonment and the avoidant style's fear of engulfment at once — producing a genuine push-pull: reaching for closeness, then retreating from it, often right as things start going well.",
    howItShowsUp: [
      {
        context: "Romantic relationships",
        example:
          "Feels deeply betrayed and hurt by a partner's behavior, but the thought of actually being without them feels just as unbearable — so the relationship holds even through real hurt.",
      },
      {
        context: "Friendships",
        example:
          "Can be the friend who initiates deep, intense connection quickly, then pulls back sharply once the friendship starts to feel genuinely important.",
      },
      {
        context: "Work",
        example:
          "May seek approval and closeness with a mentor or manager, then become guarded or distant the moment that relationship starts to matter more.",
      },
      {
        context: "Family",
        example:
          "Relationships with family can swing between real closeness and real distance, sometimes within the same visit or conversation.",
      },
    ],
    development:
      "Mary Main and Judith Solomon identified this pattern in the mid-1980s, connecting it to caregiving that was itself frightening or frightened — a caregiver who was sometimes a source of comfort and sometimes a source of fear or unpredictability, leaving the child without a consistent strategy for approaching them. That contradiction (the person who could soothe distress was also sometimes the cause of it) is the core of why this style holds two opposing pulls simultaneously rather than settling into one clear strategy.",
    reflectionPrompts: [
      "Have you ever felt deeply betrayed by someone close to you, but hated the idea of being without them even more than the betrayal itself?",
      "Do you notice yourself pulling away right as a relationship starts to feel genuinely good or important, almost as a reflex?",
      "Does closeness sometimes feel like it's happening to you rather than something you're choosing — exciting and unsettling at the same time?",
    ],
    healing: {
      whereToStart:
        "Because this pattern involves two conflicting pulls at once, the starting point is usually just building the capacity to notice which one is active in a given moment — am I reaching out of fear of losing this, or pulling back out of fear of it going too well — without needing to resolve the contradiction immediately.",
      whatTheProcessInvolves:
        "This is often described as the most complex attachment pattern to work through, since it involves both the anxious and avoidant repair work at once: building tolerance for a partner's steady presence without either grasping at it or fleeing from it, processing the original experience of caregiving that was both a source of comfort and of fear, and slowly building one consistent internal strategy where there used to be two competing ones.",
      encouragement:
        "This pattern is genuinely workable, but it tends to benefit the most from professional support specifically because the push-pull can be hard to interrupt alone — a therapist trained in attachment or trauma-informed approaches can help make sense of the contradiction rather than just managing its symptoms. Real, lasting change here is well-documented in the research, and reaching out for that support is itself a meaningful act of the same courage this pattern asks of you every day.",
    },
  },
];

export function attachmentStyleBySlug(slug: string): AttachmentStyleContent | undefined {
  return ATTACHMENT_STYLES.find((s) => s.slug === slug);
}
