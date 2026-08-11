// Report data model shared by the synthesis engine, the UI and the PDF exporter.

export type ReportSection = {
  group: string;
  title: string;
  body: string;
  bullets?: string[];
  premium?: boolean;
};

export type Report = {
  headline: string;
  executiveSummary: string;
  dominantTraits: string[];
  sections: ReportSection[];
  generatedAt: string;
  engine: "deterministic";
};

export const GROUPS = {
  lenses: "Your Five Lenses",
  cross: "The Cross-Section",
  inner: "Inner World",
  rel: "Relationships",
  strengths: "Strengths & Blind Spots",
  career: "Career & Growth",
  final: "Final Dossier",
} as const;

export function sectionsIn(report: Report, group: string) {
  return report.sections.filter((s) => s.group === group);
}
