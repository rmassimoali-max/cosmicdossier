import { Link, createFileRoute } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { ARCHETYPES } from "@/lib/archetypes";

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
  { slug: "astrology", glyph: "⭐", label: "Astrology", note: "Full natal chart, aspects, houses" },
  { slug: "mbti", glyph: "🧠", label: "MBTI", note: "Known type or 20-question estimate" },
  { slug: "enneagram", glyph: "🎭", label: "Enneagram", note: "Type, wing, instinct" },
  { slug: "synastry", glyph: "❤️", label: "Synastry", note: "Two charts, compared honestly" },
    { slug: "ai-analysis", glyph: "📈", label: "Synthesis", note: "One woven profile, not five silos" },
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
            <li key={p.label}>
              <Link
                to="/systems/$slug"
                params={{ slug: p.slug }}
                className="panel flex h-full flex-col items-center gap-2 px-3 py-5 transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="text-2xl">{p.glyph}</span>
                <span className="font-display text-lg text-foreground">{p.label}</span>
                <span className="text-[0.7rem] leading-snug text-muted-foreground">{p.note}</span>
              </Link>
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

      <section className="relative mx-auto max-w-5xl px-6 pb-24">
        <p className="tracking-cosmic text-center text-xs text-primary/80">Which one are you?</p>
        <h2 className="mt-3 text-center font-display text-3xl text-foreground/95 sm:text-4xl">
          Eight recognizable patterns
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted-foreground">
          Your actual dossier is personalized to you — but most people land close to one of these.
        </p>
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ARCHETYPES.map((a) => (
            <li key={a.slug}>
              <Link
                to="/archetype/$slug"
                params={{ slug: a.slug }}
                className="panel flex h-full flex-col items-center gap-2 px-3 py-6 text-center transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="text-2xl">{a.symbol}</span>
                <span className="font-display text-base text-foreground">{a.name}</span>
                <span className="text-[0.7rem] leading-snug text-muted-foreground">
                  {a.tagline}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative mx-auto max-w-5xl px-6 pb-24">
        <div className="panel mx-auto max-w-3xl p-7 text-center sm:p-9">
          <p className="tracking-cosmic text-xs text-primary/80">THE DOSSIER FILES</p>
          <h2 className="mt-3 font-display text-3xl text-foreground/95 sm:text-4xl">
            Psychology, decoded.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Explore attachment, relationships, personality, and the hidden patterns behind human
            behavior in our growing collection of psychology case files.
          </p>
          <Link
            to="/articles"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 font-display text-base text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            Explore the Files →
          </Link>
        </div>
      </section>
    </main>
  );
}
