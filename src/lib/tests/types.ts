// Shared types for the Cosmic Dossier test library. Fully deterministic,
// client-side scoring — no accounts, no network, no AI.

import type { PersonInput } from "@/lib/session";

export type TestItem = {
  id: string;
  text: string;
  dimension: string;
  reverse?: boolean;
};

export type TestScale = {
  min: number;
  max: number;
  labels: string[];
};

export type Band = {
  // Inclusive 0–100 range for this interpretation band.
  min: number;
  max: number;
  label: string;
  text: string;
};

export type DimensionDef = {
  key: string;
  label: string;
  blurb: string;
  bands: Band[];
};

export type TestDef = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  whatItMeasures: string;
  background: string;
  citation: string;
  minutes: string;
  scale: TestScale;
  disclaimer?: string;
  items: TestItem[];
  dimensions: DimensionDef[];
  // Short primary label for the result hero (e.g. an attachment quadrant).
  resultLabel?: (scores: Record<string, number>) => string;
  resultSummary?: (scores: Record<string, number>) => string;
  // Connects the result back to the eight Cosmic Dossier archetypes.
  archetypeNote: (scores: Record<string, number>) => { slugs: string[]; text: string };
  articleSlug: string;
  // Optional patch applied when the user adds the result to their dossier.
  dossierPatch?: (scores: Record<string, number>) => Partial<PersonInput>;
};

// Average a dimension's items (reverse-scored where marked) and map to 0–100.
export function scoreDimensions(
  items: TestItem[],
  scale: TestScale,
  answers: Record<string, number>,
): Record<string, number> {
  const sums: Record<string, { total: number; n: number }> = {};
  for (const item of items) {
    const raw = answers[item.id];
    if (raw == null) continue;
    const v = item.reverse ? scale.max + scale.min - raw : raw;
    const acc = sums[item.dimension] ?? { total: 0, n: 0 };
    acc.total += v;
    acc.n += 1;
    sums[item.dimension] = acc;
  }
  const out: Record<string, number> = {};
  const span = scale.max - scale.min || 1;
  for (const [key, acc] of Object.entries(sums)) {
    out[key] = Math.round(((acc.total / acc.n - scale.min) / span) * 100);
  }
  return out;
}

export function bandFor(dim: DimensionDef, score: number): Band {
  return (
    dim.bands.find((b) => score >= b.min && score <= b.max) ??
    dim.bands[dim.bands.length - 1] ??
    { min: 0, max: 100, label: "", text: "" }
  );
}

// Compact, URL-safe encoding of answers for shareable result links.
// The "v1" prefix keeps the value non-numeric so URL search parsers never
// coerce it to a (precision-losing) number.
export function encodeAnswers(items: TestItem[], answers: Record<string, number>): string {
  return "v1" + items.map((q) => (answers[q.id] ?? 0).toString(36)).join("");
}

export function decodeAnswers(items: TestItem[], encoded: string): Record<string, number> | null {
  const digits = encoded.startsWith("v1") ? encoded.slice(2) : encoded;
  if (!digits || digits.length !== items.length) return null;
  const out: Record<string, number> = {};
  for (let i = 0; i < items.length; i++) {
    const v = parseInt(digits[i] ?? "", 36);
    if (!Number.isFinite(v) || v < 1) return null;
    out[items[i]?.id ?? ""] = v;
  }
  return out;
}
