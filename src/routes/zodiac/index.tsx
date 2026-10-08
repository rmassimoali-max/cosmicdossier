import { createFileRoute, Link } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { SectionTitle } from "@/components/cosmic/ui";
import { SIGN_GLYPH } from "@/lib/astro";
import { signsByElement, type ZodiacElement } from "@/lib/zodiac-signs";

const ELEMENTS: { el: ZodiacElement; blurb: string }[] = [
  { el: "Fire", blurb: "Momentum, faith and self-assertion." },
  { el: "Earth", blurb: "Practicality, patience and tangible results." },
  { el: "Air", blurb: "Language, perspective and conceptual distance." },
  { el: "Water", blurb: "Feeling, memory and instinctive attunement." },
];

export const Route = createFileRoute("/zodiac/")({
  head: () => ({
    meta: [
      { title: "The 12 Zodiac Signs | Cosmic Dossier" },
      {
        name: "description",
        content:
          "A grounded guide to all 12 zodiac Sun signs, grouped by element and modality — traits, strengths, challenges, relationships and work style.",
      },
      { property: "og:title", content: "The 12 Zodiac Signs | Cosmic Dossier" },
      {
        property: "og:description",
        content: "Explore every Sun sign, from Aries to Pisces, read as symbolic language for self-reflection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ZodiacLanding,
});

function ZodiacLanding() {
  return (
    <main className="relative min-h-screen">
      <StarField count={45} />
      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          ← Cosmic Dossier
        </Link>

        <div className="mt-10 max-w-3xl">
          <SectionTitle kicker="The Dossier Files">The 12 Zodiac Signs</SectionTitle>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Your Sun sign is the zodiac sign the Sun occupied on the day you were born. It's the
            placement most people know — but it's only one of many in a full natal chart. Your
            Moon, Rising and every other planet add just as much to the picture.
          </p>
        </div>

        <div className="panel mt-8 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-gold">Elements and modalities</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Each sign pairs one of four <span className="text-foreground">elements</span> — Fire,
            Earth, Air, Water — describing its basic temperament, with one of three{" "}
            <span className="text-foreground">modalities</span> describing how it handles change:
            Cardinal signs start things, Fixed signs sustain them, and Mutable signs adapt them.
          </p>
        </div>

        {ELEMENTS.map(({ el, blurb }) => (
          <section key={el} className="mt-12">
            <div className="flex items-center gap-3 text-xs text-primary/80">
              <span className="tracking-cosmic">{el.toUpperCase()}</span>
              <span className="h-px flex-1 bg-primary/20" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{blurb}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {signsByElement(el).map((s) => (
                <Link
                  key={s.slug}
                  to="/zodiac/$slug"
                  params={{ slug: s.slug }}
                  className="panel group p-6 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-3xl text-primary">{SIGN_GLYPH[s.name]}</p>
                  <h3 className="mt-2 font-display text-xl text-foreground transition-colors group-hover:text-gold">
                    {s.name}
                  </h3>
                  <p className="text-[0.7rem] text-muted-foreground">{s.dates}</p>
                  <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">
                    "{s.tagline}"
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="panel mt-12 p-6 text-center sm:p-8">
          <p className="font-display text-xl text-foreground">
            A Sun sign is one-twelfth of the story. Calculate your full natal chart.
          </p>
          <Link
            to="/input"
            className="mt-5 inline-flex rounded-full px-7 py-3 font-display text-base text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            Start My Report →
          </Link>
          <p className="mx-auto mt-5 max-w-xl text-xs text-muted-foreground">
            Astrology has no accepted scientific mechanism; we include it as symbolic language for
            self-reflection. Sign dates are approximate and shift slightly by year.
          </p>
        </div>
      </div>
    </main>
  );
}
