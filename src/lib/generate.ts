// Deterministic generation entry points (no AI, no API keys).
// Adapts the synthesis/synastry engines to the Dossier shape the UI + PDF consume.
import type { NatalChart } from "./astro";
import { buildProfile } from "./profile";
import { generateDossier as engineDossier } from "./synthesis";
import { generateSynastry as engineSynastry } from "./synastry";
import type { Report } from "./report";
import type { Dossier, PersonInput } from "./session";

function toDossier(r: Report): Dossier {
  return {
    headline: r.headline,
    synthesis: r.executiveSummary,
    dominantTraits: r.dominantTraits,
    sections: r.sections.map((s) => ({
      title: s.title,
      body: [s.body, ...(s.bullets ?? []).map((b) => `• ${b}`)].filter(Boolean).join("\n\n"),
    })),
  };
}

export function buildDossier(person: PersonInput, chart?: NatalChart | undefined): Dossier {
  return toDossier(engineDossier(buildProfile(person, chart)));
}

export function buildSynastry(
  p1: PersonInput,
  chart1: NatalChart | undefined,
  p2: PersonInput,
  chart2: NatalChart | undefined,
): Dossier {
  return toDossier(engineSynastry(buildProfile(p1, chart1), buildProfile(p2, chart2)));
}
