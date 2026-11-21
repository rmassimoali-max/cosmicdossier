import type { PersonInput } from "./session";

export type UnlockOffer = {
  features: string[];
  additionalNote: string;
};

export function buildUnlockOffer(person: PersonInput, hasChart: boolean, hasPartner = false): UnlockOffer {
  const hasPersonality = Boolean(
    person.mbti ||
      person.enneagramType ||
      person.attachment ||
      person.bigFive ||
      person.hexaco ||
      typeof person.hsp === "number" ||
      Object.keys(person.assessmentResults ?? {}).length,
  );
  const features: string[] = [];
  if (hasChart) {
    features.push("Full natal chart: placements, houses, elements and aspects");
    features.push("Symbolic interpretations of your chart");
  }
  if (hasPersonality) {
    features.push("Detailed interpretations of your completed assessments");
    features.push("Personalized psychological themes supported by your results");
  }
  if (hasChart && hasPersonality) {
    features.push("Combined astrology and personality perspectives");
  }
  if (hasPartner) {
    features.push("Second-person dossier and available relationship insights");
  }
  features.push("Printable PDF dossier");

  return {
    features,
    additionalNote: hasPartner
      ? "Relationship insights depend on the information provided for both people. Missing assessments cannot be unlocked by payment."
      : hasPersonality
        ? "Cross-assessment conclusions require enough independent results. Payment does not replace missing assessments."
        : hasChart
          ? "This profile contains astrology only. Personality synthesis and relationship insights require additional information."
          : "Add birth details or complete assessments for a more personalized report. Payment does not generate missing results.",
  };
}
