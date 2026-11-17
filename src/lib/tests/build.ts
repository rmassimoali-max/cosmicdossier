// Small factory for multi-dimension Likert tests that share one band structure.
import type { DimensionDef, TestDef, TestItem } from "./types";

export const AGREE_5 = { min: 1, max: 5, labels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] };

export type DimSpec = {
  key: string;
  label: string;
  blurb: string;
  low: string;
  mid: string;
  high: string;
  archetypes: string[];
  // Items: prefix "-" marks a reverse-scored statement.
  items: string[];
};

export function buildDims(prefix: string, dims: DimSpec[]): { items: TestItem[]; dimensions: DimensionDef[] } {
  const items: TestItem[] = [];
  let n = 1;
  for (const d of dims) {
    for (const raw of d.items) {
      const reverse = raw.startsWith("-");
      items.push({ id: `${prefix}${n++}`, text: reverse ? raw.slice(1) : raw, dimension: d.key, ...(reverse ? { reverse: true } : {}) });
    }
  }
  // Interleave so consecutive items come from different dimensions.
  const byDim = dims.map((d) => items.filter((i) => i.dimension === d.key));
  const mixed: TestItem[] = [];
  for (let r = 0; r < Math.max(...byDim.map((b) => b.length)); r++) for (const b of byDim) if (b[r]) mixed.push(b[r]!);
  return {
    items: mixed,
    dimensions: dims.map((d) => ({
      key: d.key,
      label: d.label,
      blurb: d.blurb,
      bands: [
        { min: 0, max: 35, label: "Lower", text: d.low },
        { min: 36, max: 65, label: "Moderate", text: d.mid },
        { min: 66, max: 100, label: "Higher", text: d.high },
      ],
    })),
  };
}

export function topDim(dims: DimSpec[], scores: Record<string, number>): DimSpec {
  return [...dims].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0))[0]!;
}

export function multiDimHelpers(dims: DimSpec[], noun: string): Pick<TestDef, "resultLabel" | "resultSummary" | "archetypeNote"> {
  return {
    resultLabel: (s) => topDim(dims, s).label,
    resultSummary: (s) => {
      const t = topDim(dims, s);
      return `Your strongest ${noun} is ${t.label} (${s[t.key] ?? 0}/100). ${t.blurb}`;
    },
    archetypeNote: (s) => {
      const t = topDim(dims, s);
      return { slugs: t.archetypes, text: `A leading ${t.label} score often resonates with ${t.archetypes.map((a) => a.replace("the-", "The ").replace(/\b\w/g, (c) => c.toUpperCase()).replace("The The", "The")).join(" or ")} — explore whether that archetype describes how this shows up in you.` };
    },
  };
}

export function singleBand(score: number, labels: [string, string, string]): string {
  return score >= 66 ? labels[2] : score >= 36 ? labels[1] : labels[0];
}
