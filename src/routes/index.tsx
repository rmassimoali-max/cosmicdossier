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
          "One report that braids your natal chart, MBTI, Enneagram, attachment style and Big Five into a single cross-referenced personality dossier — plus synastry for two.",
      },
      { property: "og:title", content: "Cosmic Dossier — Your Full Personality Report" },
      {
        property: "og:description",
        content:
          "Natal chart, MBTI, Enneagram, attachment style and Big Five woven into one cross-referenced personality dossier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});
const PILLARS: { to: string; params?: { slug: string }; glyph: string; label: string; note: string }[] = [
  { to: "/systems/$slug", params: { slug: "astrology" }, glyph: "⭐", label: "Astrology", note: "Full natal chart, aspects, houses" },
  { to: "/systems/$slug", params: { slug: "mbti" }, glyph: "🧠", label: "MBTI", note: "Known type or 20-question estimate" },
  { to: "/systems/$slug", params: { slug: "enneagram" }, glyph: "🎭", label: "Enneagram", note: "Type, wing, instinct" },
  { to: "/attachment", glyph: "🔗", label: "Attachment", note: "Secure, anxious, avoidant, fearful-avoidant" },
  { to: "/systems/$slug", params: { slug: "big-five" }, glyph: "📊", label: "Big Five", note: "The most research-backed model here" },
  { to: "/systems/$slug", params: { slug: "synastry" }, glyph: "❤️", label: "Synastry", note: "Two charts, compared honestly" },
  { to: "/systems/$slug", params: { slug: "ai-analysis" }, glyph: "📈", label: "Synthesis", note: "One woven profile, not five silos" },
];
const DOSSIER_SECTIONS = [
  { label: "Core Pattern", note: "The through-line all five systems agree on" },
  { label: "Cognitive Style", note: "How you take in and decide on information" },
  { label: "Attachment Lens", note: "How closeness, distance and conflict feel to you" },
  { label: "Symbolic Layer", note: "Your natal chart read as metaphor, not fate" },
  { label: "Growth Edges", note: "Where your strengths turn into blind spots" },
  { label: "Relationship Dynamics", note: "How your pattern plays out with other people" },
];
const SAMPLE_EXCERPTS = [
  {
    quote:
      "You build accurate maps of situations before you enter them. The cost is that you can understand a relationship more clearly than you allow yourself to feel it.",
    source: "Sample dossier · Core Pattern",
  },
  {
    quote:
      "Your need for closeness and your need for control are the same need wearing two coats. Partners experience this as warmth that occasionally tightens.",
    source: "Sample dossier · Attachment Lens",
  },
  {
    quote:
      "You don't avoid conflict because you're easygoing. You avoid it because you've already run the argument in your head and decided it isn't worth the mess.",
    source: "Sample dossier · Growth Edges",
  },
];
const LEARN_CARDS = [
  {
    to: "/articles",
    kicker: "THE DOSSIER FILES",
    title: "Psychology, decoded.",
    note: "Attachment, relationships, personality — 19 case files exploring the hidden dynamics between people.",
  },
  {
    to: "/attachment",
    kicker: "ATTACHMENT THEORY",
    title: "Why closeness feels the way it does.",
    note: "How secure, anxious, dismissive avoidant and fearful-avoidant styles develop — and how to start healing.",
  },
  {
    to: "/personality-disorders",
    kicker: "UNDERSTANDING PD's",
    title: "The ten personality disorders, explained.",
    note: "A clear, destigmatizing guide by cluster — what they are, and common misconceptions about each.",
  },
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
                to={p.to}
                {...(p.params ? { params: p.params } : {})}
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
        <p className="animate-drift-in mt-10 max-w-md text-balance text-sm text-foreground/80">
          Built for people who've already taken the tests and still feel fragmented.
        </p>
        <p className="mt-2 max-w-md text-balance text-xs text-muted-foreground">
          One synthesized reading across astrology, MBTI, Enneagram, attachment, and Big Five — not
          five separate verdicts.
        </p>
      </section>

      <section className="relative mx-auto max-w-4xl px-6 pb-24">
        <p className="tracking-cosmic text-center text-xs text-primary/80">What you'll actually get</p>
        <h2 className="mt-3 text-center font-display text-3xl text-foreground/95 sm:text-4xl">
          One dossier, read as a whole
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-muted-foreground">
          Your report isn't a stack of test results. It's a single document where each system is
          cross-referenced against the others.
        </p>
        <ol className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DOSSIER_SECTIONS.map((s, i) => (
            <li key={s.label} className="panel flex flex-col gap-1.5 px-4 py-5">
              <span className="tracking-cosmic text-[0.6rem] text-primary/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-base text-foreground">{s.label}</span>
              <span className="text-[0.7rem] leading-snug text-muted-foreground">{s.note}</span>
            </li>
          ))}
        </ol>

        <div className="mt-16">
          <p className="tracking-cosmic text-center text-xs text-primary/80">
            Sample — from a fictional dossier
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {SAMPLE_EXCERPTS.map((e) => (
              <figure key={e.source} className="panel flex flex-col p-6">
                <blockquote className="text-sm leading-relaxed text-foreground/90">
                  “{e.quote}”
                </blockquote>
                <figcaption className="mt-4 text-[0.65rem] tracking-wide text-muted-foreground">
                  — {e.source}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-center text-[0.65rem] text-muted-foreground/70">
            Excerpts are illustrative examples, not your actual results.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/input"
            className="halo inline-flex items-center gap-3 rounded-full px-8 py-3.5 font-display text-lg text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
            style={{ background: "var(--gradient-gold)" }}
          >
            Start My Report
            <span aria-hidden>→</span>
          </Link>
        </div>
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
        <p className="tracking-cosmic text-center text-xs text-primary/80">Go deeper</p>
        <h2 className="mt-3 text-center font-display text-3xl text-foreground/95 sm:text-4xl">
          The Dossier Library
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {LEARN_CARDS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="panel group flex h-full flex-col p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="tracking-cosmic text-[0.65rem] text-primary/80">{c.kicker}</p>
              <h3 className="mt-3 font-display text-xl text-foreground transition-colors group-hover:text-gold">
                {c.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.note}</p>
              <span className="mt-4 inline-block text-xs text-primary">Explore →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
