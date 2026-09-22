import { createFileRoute, Link } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { SectionTitle } from "@/components/cosmic/ui";
import { MBTI_LIBRARY } from "@/lib/interpret/mbti";

const GROUPS: { label: string; blurb: string; types: string[] }[] = [
  {
    label: "Analysts (NT)",
    blurb: "Intuition paired with thinking — systems, strategy and first principles.",
    types: ["INTJ", "INTP", "ENTJ", "ENTP"],
  },
  {
    label: "Diplomats (NF)",
    blurb: "Intuition paired with feeling — meaning, values and human potential.",
    types: ["INFJ", "INFP", "ENFJ", "ENFP"],
  },
  {
    label: "Sentinels (SJ)",
    blurb: "Sensing paired with judging — continuity, reliability and duty.",
    types: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  },
  {
    label: "Explorers (SP)",
    blurb: "Sensing paired with perceiving — immediacy, craft and live problems.",
    types: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
];

export const Route = createFileRoute("/mbti/")({
  head: () => ({
    meta: [
      { title: "The 16 MBTI Personality Types | Cosmic Dossier" },
      {
        name: "description",
        content:
          "A guide to all 16 MBTI personality types and the four dichotomies behind them — strengths, blind spots, stress responses, relationships and work style for each type.",
      },
      { property: "og:title", content: "The 16 MBTI Personality Types | Cosmic Dossier" },
      {
        property: "og:description",
        content:
          "Explore all 16 Myers-Briggs types, grouped by temperament, with the same per-type reads used in your Cosmic Dossier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MbtiLanding,
});

function MbtiLanding() {
  return (
    <main className="relative min-h-screen">
      <StarField count={45} />
      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          ← Cosmic Dossier
        </Link>

        <div className="mt-10 max-w-3xl">
          <SectionTitle kicker="The Dossier Files">The 16 MBTI Types</SectionTitle>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            The Myers-Briggs Type Indicator sorts cognitive preference into 16 types. It describes
            how you prefer to take in information and reach conclusions — not how capable you are,
            and not something fixed for life.
          </p>
        </div>

        <div className="panel mt-8 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-gold">The four dichotomies</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="text-foreground">I / E</span> — where attention naturally goes:
              inward and processed before speaking, or outward and partly thought out loud.
            </li>
            <li>
              <span className="text-foreground">S / N</span> — what you trust: concrete detail and
              direct observation, or pattern, inference and possibility.
            </li>
            <li>
              <span className="text-foreground">T / F</span> — how you weigh a decision: coherence
              and consequence first, or impact on people and values first.
            </li>
            <li>
              <span className="text-foreground">J / P</span> — how you hold structure: decisions
              closed and settled, or options open and emergent.
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            MBTI is a useful shared vocabulary rather than a validated clinical instrument. In your
            dossier it's read alongside the more empirically grounded Big Five, never in place of it.
          </p>
        </div>

        {GROUPS.map((group) => (
          <section key={group.label} className="mt-12">
            <div className="flex items-center gap-3 text-xs text-primary/80">
              <span className="tracking-cosmic">{group.label.toUpperCase()}</span>
              <span className="h-px flex-1 bg-primary/20" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{group.blurb}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {group.types.map((code) => {
                const profile = MBTI_LIBRARY[code];
                if (!profile) return null;
                return (
                  <Link
                    key={code}
                    to="/mbti/$type"
                    params={{ type: code.toLowerCase() }}
                    className="panel group p-6 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <p className="tracking-cosmic text-[0.65rem] text-primary/80">{profile.type}</p>
                    <h3 className="mt-1 font-display text-xl text-foreground transition-colors group-hover:text-gold">
                      {profile.nickname}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {profile.core}
                    </p>
                    <span className="mt-4 inline-block text-xs text-primary">Read more →</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <div className="panel mt-12 p-6 text-center sm:p-8">
          <p className="font-display text-xl text-foreground">Not sure which type is yours?</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Cosmic Dossier includes a short MBTI estimate as part of your full personality dossier —
            read alongside Enneagram, attachment style, Big Five and your natal chart.
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
