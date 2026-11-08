import { createFileRoute, Link } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { GoldLink, SectionTitle } from "@/components/cosmic/ui";
import { TEST_CATEGORIES, testsInCategory } from "@/lib/tests";

export const Route = createFileRoute("/tests/")({
  head: () => ({
    meta: [
      { title: "The Test Library — Cosmic Dossier" },
      {
        name: "description",
        content:
          "Free, anonymous psychological assessments — Big Five, attachment style, Dark Triad, sensory sensitivity and more. Instant results, no account, scored privately in your browser.",
      },
      { property: "og:title", content: "The Test Library — Cosmic Dossier" },
      {
        property: "og:description",
        content:
          "Free, anonymous psychological assessments with instant, privately scored results — each one connecting back to your full Cosmic Dossier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestsHub,
});

function TestsHub() {
  return (
    <main className="relative min-h-screen">
      <StarField count={45} />
      <div className="relative mx-auto max-w-4xl px-5 py-16 sm:py-20">
        <SectionTitle kicker="THE TEST LIBRARY">Know the instrument.</SectionTitle>
        <p className="-mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Free, anonymous assessments grounded in published research. Everything is scored in your
          browser — nothing you answer is sent anywhere. Each result can feed directly into your
          full Cosmic Dossier, where it is cross-read against the other four systems.
        </p>

        {TEST_CATEGORIES.map((category) => {
          const tests = testsInCategory(category);
          if (tests.length === 0) return null;
          return (
            <section key={category} className="mt-12">
              <div className="flex items-center gap-3 text-xs text-primary/80">
                <span className="tracking-cosmic">{category.toUpperCase()}</span>
                <span className="h-px flex-1 bg-primary/20" />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {tests.map((test) => (
                  <Link
                    key={test.slug}
                    to="/tests/$slug"
                    params={{ slug: test.slug }}
                    search={{ r: undefined }}
                    className="panel flex flex-col p-6 transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <h3 className="font-display text-2xl text-gold">{test.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {test.tagline}
                    </p>
                    <p className="mt-4 text-[0.7rem] uppercase tracking-widest text-primary/70">
                      {test.items.length} items · {test.minutes}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <div className="panel mt-14 p-6 text-center sm:p-8">
          <p className="tracking-cosmic text-xs text-primary/80">THE DOSSIER CONNECTION</p>
          <h2 className="mt-2 font-display text-2xl text-gold">One test is a data point. Five are a portrait.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Each test here stands alone — but the Cosmic Dossier synthesis cross-reads your results
            against astrology, MBTI, Enneagram, attachment and the Big Five to find the pattern
            underneath them all.
          </p>
          <GoldLink to="/input" className="mt-5 inline-flex">
            Build My Dossier →
          </GoldLink>
        </div>
      </div>
    </main>
  );
}
