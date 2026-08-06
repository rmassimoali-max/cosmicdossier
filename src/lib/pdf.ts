import type { Dossier, PersonInput } from "./session";
import { ageFrom } from "./session";
import type { NatalChart } from "./astro";

type Block = { heading?: string; text?: string; gap?: number };

export async function downloadDossierPdf(args: {
  person: PersonInput;
  chart?: NatalChart | undefined;
  dossier?: Dossier | undefined;
  synastry?: Dossier | undefined;
  partner?: PersonInput | null | undefined;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const width = pageW - margin * 2;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (text: string, size: number, style: "normal" | "bold" | "italic", gap = 10) => {
    doc.setFont("times", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width) as string[];
    for (const line of lines) {
      ensure(size * 1.35);
      doc.text(line, margin, y);
      y += size * 1.35;
    }
    y += gap;
  };

  const rule = () => {
    ensure(18);
    doc.setDrawColor(150, 130, 90);
    doc.line(margin, y, pageW - margin, y);
    y += 18;
  };

  const p = args.person;
  const age = ageFrom(p.dob);

  write("COSMIC DOSSIER", 26, "bold", 6);
  write(p.name || "Anonymous", 18, "italic", 4);
  if (args.dossier?.headline) write(args.dossier.headline, 13, "italic", 8);
  rule();

  const facts: Block[] = [
    { heading: "Born", text: `${p.dob} ${p.birthTime || "(time unknown)"} — ${p.birthPlace}` },
    { heading: "Age", text: age !== null ? String(age) : "—" },
    args.chart
      ? {
          heading: "Sun / Moon / Rising",
          text: `${args.chart.sun} · ${args.chart.moon} · ${args.chart.rising}`,
        }
      : {},
    { heading: "MBTI", text: p.mbti || "—" },
    {
      heading: "Enneagram",
      text: p.enneagramType
        ? `${p.enneagramType}${p.enneagramWing ? `w${p.enneagramWing}` : ""}${
            p.enneagramInstinct ? ` · ${p.enneagramInstinct}` : ""
          }`
        : "—",
    },
    { heading: "Attachment style", text: p.attachment || "—" },
    {
      heading: "Big Five",
      text: p.bigFive
        ? Object.entries(p.bigFive)
            .map(([k, v]) => `${k} ${v}`)
            .join(" · ")
        : "—",
    },
  ];
  for (const f of facts) {
    if (!f.heading) continue;
    write(`${f.heading}: ${f.text}`, 11, "normal", 2);
  }

  if (args.chart) {
    y += 8;
    write("Placements", 15, "bold", 4);
    write(
      args.chart.placements
        .map(
          (pl) =>
            `${pl.label} in ${pl.sign} ${pl.degree}${pl.house ? ` (H${pl.house})` : ""}${
              pl.retrograde ? " ℞" : ""
            }`,
        )
        .join("  ·  "),
      10,
      "normal",
      6,
    );
    write(
      `Elements — ${Object.entries(args.chart.elements)
        .map(([k, v]) => `${k} ${v}`)
        .join(", ")}   |   Modalities — ${Object.entries(args.chart.modalities)
        .map(([k, v]) => `${k} ${v}`)
        .join(", ")}`,
      10,
      "normal",
      4,
    );
    write(`Chart shape — ${args.chart.chartShape}`, 10, "normal", 8);
  }

  if (args.dossier) {
    rule();
    write("Synthesis", 16, "bold", 6);
    write(args.dossier.synthesis, 11, "normal", 10);
    if (args.dossier.dominantTraits.length) {
      write("Dominant traits: " + args.dossier.dominantTraits.join(" · "), 11, "italic", 10);
    }
    for (const s of args.dossier.sections) {
      write(s.title, 14, "bold", 4);
      write(s.body, 11, "normal", 10);
    }
  }

  if (args.synastry) {
    doc.addPage();
    y = margin;
    write("SYNASTRY", 24, "bold", 6);
    write(
      `${p.name || "Person 1"} & ${args.partner?.name || "Person 2"} — ${args.synastry.headline}`,
      13,
      "italic",
      8,
    );
    rule();
    write(args.synastry.synthesis, 11, "normal", 10);
    for (const s of args.synastry.sections) {
      write(s.title, 14, "bold", 4);
      write(s.body, 11, "normal", 10);
    }
  }

  doc.save(`cosmic-dossier-${(p.name || "report").toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
