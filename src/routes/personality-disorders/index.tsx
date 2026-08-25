import { createFileRoute, Link } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { SectionTitle } from "@/components/cosmic/ui";
import { PDArt } from "@/components/cosmic/PDArt";
import { CLUSTER_INFO, PERSONALITY_DISORDERS, type PDCluster } from "@/lib/personality-disorders";

export const Route = createFileRoute("/personality-disorders/")({
  head: () => ({
    meta: [
      { title: "Understanding Personality Disorders | Cosmic Dossier" },
      {
        name: "description",
        content:
          "A clear, destigmatizing guide to the ten personality disorders, what factors into their development, and how each cluster differs.",
      },
      { property: "og:title", content: "Understanding Personality Disorders | Cosmic Dossier" },
      {
        property: "og:description",
        content: "The ten personality disorders explained by cluster, plus PD-Trait Specified.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PDLanding,
});

const CLUSTERS: PDCluster[] = ["A", "B", "C"];

function PDLanding() {
  return (
    <main className="relative min-h-screen">
      <StarField count={45} />
      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          ← Cosmic Dossier
        </Link>

        <div className="mt-10 max-w-3xl">
          <SectionTitle kicker="The Dossier Files">Understanding Personality Disorders</SectionTitle>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A personality disorder is a pervasive, long-term pattern of thinking, feeling and
            relating that differs markedly from cultural expectations, is inflexible across
            situations, and causes real distress or impairment. These aren't personality quirks —
            they're patterns significant enough to reshape a person's relationships, work and
            self-concept.
          </p>
        </div>

        <div className="panel mt-8 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-gold">What factors into developing one</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            No personality disorder has a single cause. The clinical consensus points to a
            biopsychosocial interaction: an inherited temperament (sensitivity to threat, reward,
            or novelty) meeting an environment during childhood and adolescence — inconsistent
            caregiving, chronic invalidation, trauma, or the opposite extreme of over-control —
            that shapes which coping strategies become durable, generalized patterns rather than
            situational responses. The same temperament in a different environment often produces
            a very different outcome, which is part of why these patterns aren't a matter of
            choice or character.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            This page is educational, not a diagnostic tool. Personality disorders are diagnosed
            by qualified clinicians through structured assessment, not self-identification against
            a list of traits. If anything here resonates strongly, a conversation with a mental
            health professional is the right next step.
          </p>
        </div>

        {CLUSTERS.map((cluster) => (
          <section key={cluster} className="mt-12">
            <div className="flex items-center gap-3 text-xs text-primary/80">
              <span className="tracking-cosmic">{CLUSTER_INFO[cluster].label}</span>
              <span className="h-px flex-1 bg-primary/20" />
            </div>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {CLUSTER_INFO[cluster].description}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {PERSONALITY_DISORDERS.filter((pd) => pd.cluster === cluster).map((pd) => (
                <Link
                  key={pd.slug}
                  to="/personality-disorders/$slug"
                  params={{ slug: pd.slug }}
                  className="panel group flex items-center gap-4 p-4 transition-transform duration-300 hover:-translate-y-1"
                >
                  <PDArt theme={pd.artTheme} className="h-16 w-16 shrink-0 rounded-lg" />
                  <div>
                    <h3 className="font-display text-lg text-foreground transition-colors group-hover:text-gold">
                      {pd.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{pd.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-12">
          <div className="flex items-center gap-3 text-xs text-primary/80">
            <span className="tracking-cosmic">{CLUSTER_INFO.other.label}</span>
            <span className="h-px flex-1 bg-primary/20" />
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {CLUSTER_INFO.other.description}
          </p>
          <div className="mt-5">
            {PERSONALITY_DISORDERS.filter((pd) => pd.cluster === "other").map((pd) => (
              <Link
                key={pd.slug}
                to="/personality-disorders/$slug"
                params={{ slug: pd.slug }}
                className="panel group flex items-center gap-4 p-4 transition-transform duration-300 hover:-translate-y-1 sm:max-w-md"
              >
                <PDArt theme={pd.artTheme} className="h-16 w-16 shrink-0 rounded-lg" />
                <div>
                  <h3 className="font-display text-lg text-foreground transition-colors group-hover:text-gold">
                    {pd.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{pd.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="panel mt-12 p-6 text-center sm:p-8">
          <p className="font-display text-xl text-foreground">Curious how your own patterns show up?</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Cosmic Dossier isn't a clinical tool, but it does map healthy-range personality across
            MBTI, Enneagram, attachment style, Big Five and astrology in one dossier.
          </p>
          <Link
            to="/input"
            className="mt-5 inline-flex rounded-full px-7 py-3 font-display text-base text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            Start My Report →
          </Link>
        </div>
      </div>
    </main>
  );
}
