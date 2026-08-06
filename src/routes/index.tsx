import { Link, createFileRoute } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cosmic Dossier — Your Full Personality Report" },
      {
        name: "description",
        content:
          "One report that braids your natal chart, MBTI, Enneagram, attachment style and Big Five into a single AI-written personality dossier — plus synastry for two.",
      },
      { property: "og:title", content: "Cosmic Dossier — Your Full Personality Report" },
      {
        property: "og:description",
        content:
          "Natal chart, MBTI, Enneagram, attachment style and Big Five woven into one AI personality dossier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const PILLARS = [
  { glyph: "⭐", label: "Astrology", note: "Full natal chart, aspects, houses" },
  { glyph: "🧠", label: "MBTI", note: "Known type or 20-question estimate" },
  { glyph: "🎭", label: "Enneagram", note: "Type, wing, instinct" },
  { glyph: "❤️", label: "Synastry", note: "Two charts, compared honestly" },
  { glyph: "📈", label: "AI Analysis", note: "One woven profile, not five silos" },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarField />

      <section className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="tracking-cosmic animate-drift-in text-xs text-primary/80">
          Est. under the fixed stars
        </p>

        <h1 className="animate-drift-in mt-6 text-6xl leading-[0.95] sm:text-8xl">
          <span className="text-gold">Cosmic</span>
          <br />
          <span className="text-foreground/95">Dossier</span>
        </h1>

        <p className="animate-drift-in mt-7 max-w-xl text-balance text-lg text-muted-foreground">
          A comprehensive personality report that combines your natal chart, MBTI, Enneagram,
          attachment style and Big Five — then reads them as one pattern instead of five separate
          verdicts.
        </p>

        <ul className="animate-drift-in mt-12 grid w-full grid-cols-1 gap-3 sm:grid-cols-5">
          {PILLARS.map((p) => (
            <li
              key={p.label}
              className="panel flex flex-col items-center gap-2 px-3 py-5 transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="text-2xl">{p.glyph}</span>
              <span className="font-display text-lg text-foreground">{p.label}</span>
              <span className="text-[0.7rem] leading-snug text-muted-foreground">{p.note}</span>
            </li>
          ))}
        </ul>

        <Link
          to="/input"
          className="halo animate-drift-in mt-14 inline-flex items-center gap-3 rounded-full px-9 py-4 font-display text-xl text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
          style={{ background: "var(--gradient-gold)" }}
        >
          Start My Report
          <span aria-hidden>→</span>
        </Link>

        <p className="mt-6 text-xs text-muted-foreground/80">
          Free · no account · astrology treated as symbolic language, not prophecy
        </p>
      </section>
    </main>
  );
}
