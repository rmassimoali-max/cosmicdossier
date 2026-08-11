// Attachment interpretation library.

export const ATTACHMENT_STYLES = [
  "Secure",
  "Anxious",
  "Avoidant",
  "Fearful-Avoidant",
] as const;
export type AttachmentStyle = (typeof ATTACHMENT_STYLES)[number];

export type AttachmentProfile = {
  style: AttachmentStyle;
  read: string;
  relationships: string;
  communication: string;
  conflict: string;
  intimacy: string;
  triggers: string[];
  strengths: string[];
  growth: string;
};

export const ATTACHMENT_LIBRARY: Record<AttachmentStyle, AttachmentProfile> = {
  Secure: {
    style: "Secure",
    read: "You can be close without losing yourself and separate without assuming loss.",
    relationships: "You tend to choose available people, state needs early, and treat repair as normal rather than catastrophic.",
    communication: "You can name a feeling and a request in the same sentence, which keeps most conflicts small.",
    conflict: "You stay in the room, tolerate discomfort, and return to the topic rather than punishing.",
    intimacy: "Closeness is pleasant rather than dangerous; you can receive as well as give.",
    triggers: ["Persistent stonewalling", "Chronic unpredictability", "Being asked to over-function for a partner"],
    strengths: ["Direct repair", "Emotional regulation", "Consistency"],
    growth: "Your main risk is over-tolerating instability in someone else because you can regulate through it.",
  },
  Anxious: {
    style: "Anxious",
    read: "Connection feels safe only when it is confirmed, so ambiguity fills quickly with worst cases.",
    relationships: "You attune closely to a partner's state, sometimes before your own, and can lose the thread of what you actually want.",
    communication: "Distress may arrive as protest — a complaint, a test, a raised stake — when the real message is 'come closer'.",
    conflict: "You escalate to get contact and find silence far more painful than argument.",
    intimacy: "You want closeness with little distance, and separateness can register as withdrawal.",
    triggers: ["Slow replies", "Tone changes", "Plans made without you", "Vague reassurance"],
    strengths: ["Emotional courage", "Attunement", "Willingness to repair"],
    growth: "The work is self-soothing before seeking, and asking directly instead of testing.",
  },
  Avoidant: {
    style: "Avoidant",
    read: "Self-sufficiency feels safer than dependence, so closeness gets managed at a workable distance.",
    relationships: "You give steadiness and practical reliability, and you resist being needed continuously.",
    communication: "You minimise emotional content and prefer to solve rather than discuss, which can read as dismissal.",
    conflict: "You deactivate: go quiet, get busy, or leave the room to lower the temperature.",
    intimacy: "You want connection with reliable exits, and you notice pressure long before you notice longing.",
    triggers: ["Emotional flooding", "Demands for immediate processing", "Loss of autonomy", "Being characterised as cold"],
    strengths: ["Composure", "Independence", "Low reactivity"],
    growth: "The work is staying present for twenty more minutes than is comfortable, and naming the need for space instead of taking it silently.",
  },
  "Fearful-Avoidant": {
    style: "Fearful-Avoidant",
    read: "You want closeness genuinely and expect it to cost you, so approach and retreat alternate.",
    relationships: "Intensity comes easily; steadiness is the harder skill, and the pull-away usually follows a moment of real intimacy.",
    communication: "You may over-disclose then regret it, or shut down mid-conversation without a clear reason you can give.",
    conflict: "You can flip between pursuing and disappearing inside one argument.",
    intimacy: "Vulnerability registers as both relief and threat, sometimes in the same hour.",
    triggers: ["Sudden closeness", "Ambiguous signals", "Feeling exposed after being open", "Perceived criticism"],
    strengths: ["Depth", "Honesty about ambivalence", "High capacity for insight"],
    growth: "The work is slowing the cycle down and naming the ambivalence out loud instead of acting it out.",
  },
};

// Accepts legacy labels stored in older sessions.
export function normalizeAttachment(v: string | undefined | null): AttachmentStyle | undefined {
  if (!v) return undefined;
  const s = v.toLowerCase();
  if (s.includes("fearful") || s.includes("disorganiz") || s.includes("disorganis")) return "Fearful-Avoidant";
  if (s.includes("avoid") || s.includes("dismiss")) return "Avoidant";
  if (s.includes("anx") || s.includes("preoccupied")) return "Anxious";
  if (s.includes("secure")) return "Secure";
  return undefined;
}
