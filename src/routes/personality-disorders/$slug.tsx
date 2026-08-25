import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { GoldLink, SectionTitle } from "@/components/cosmic/ui";
import { PDArt } from "@/components/cosmic/PDArt";
import { CLUSTER_INFO, pdBySlug, PERSONALITY_DISORDERS } from "@/lib/personality-disorders";

export const Route = createFileRoute("/personality-disorders/$slug")({
  loader: ({ params }) => {
    const pd = pdBySlug(params.slug);
    if (!pd) throw notFound();
    return pd;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found — Cosmic Dossier" }] };
    }
    return {
      meta: [
        { title: `${loaderData.name} | Cosmic Dossier` },
        { name: "description", content: loaderData.overview.slice(0, 155) },
        { property: "og:title", content: `${loaderData.name} | Cosmic Dossier` },
        { property: "og:description", content: loaderData.tagline },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PDPage,
});

function PDPage() {
  const pd = Route.useLoaderData();
  const related = PERSONALITY_DISORDERS.filter(
    (item) => item.cluster === pd.cluster && item.slug !== pd.slug,
  ).slice(0, 3);

  return (
    <main className="relative min-h-screen">
      <StarField count={35} />
      <article className="relative mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <Link to="/personality-disorders" className="text-xs text-muted-foreground hover:text-primary">
          ← All personality disorders
        </Link>

        <PDArt theme={pd.artTheme} className="mt-8 h-48 w-full rounded-2xl sm:h-64" />

        <header className="mt-8">
          <p className="tracking-cosmic text-xs text-primary/80">
            {pd.cluster === "other" ? CLUSTER_INFO.other.label : CLUSTER_INFO[pd.cluster].label}
          </p>
          <SectionTitle>{pd.name}</SectionTitle>
          <p className="mt-4 text-lg italic leading-relaxed text-foreground/75">"{pd.tagline}"</p>
        </header>

        <div className="panel mt-8 p-6 sm:p-9">
          <h2 className="font-display text-xl text-gold">Overview</h2>
          <p className="mt-3 text-[0.98rem] leading-8 text-foreground/90">{pd.overview}</p>
        </div>

        <div className="panel mt-6 p-6 sm:p-8">
          <h2 className="font-display text-xl text-gold">Core features</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {pd.coreFeatures.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-primary/80">✦</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-4">
          <div className="panel p-6 sm:p-8">
            <h2 className="font-display text-xl text-gold">How it can develop</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {pd.howItCanDevelop}
            </p>
          </div>
          <div className="panel p-6 sm:p-8">
            <h2 className="font-display text-xl text-gold">A common misconception</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {pd.commonMisconception}
            </p>
          </div>
          <div className="panel p-6 sm:p-8">
            <h2 className="font-display text-xl text-gold">Growth orientation</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {pd.growthOrientation}
            </p>
          </div>
        </div>

        <div className="panel mt-8 p-6 sm:p-8">
          <p className="text-xs leading-relaxed text-muted-foreground">
            This page is educational and destigmatizing in intent, not a diagnostic tool.
            Personality disorders are diagnosed by qualified clinicians through structured
            clinical assessment — not self-identification against a list of traits. If anything
            here resonates strongly, a conversation with a mental health professional is the right
            next step.
          </p>
        </div>

        <div className="panel mt-8 p-6 sm:p-8">
          <p className="tracking-cosmic text-xs text-primary/80">THE DOSSIER CONNECTION</p>
          <h2 className="mt-2 font-display text-2xl text-gold">See healthy-range patterns in context.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Cosmic Dossier maps personality across MBTI, Enneagram, attachment style, Big Five and
            astrology — a different, non-clinical lens on the patterns that make you, you.
          </p>
          <GoldLink to="/input" className="mt-5 inline-flex">Build My Dossier →</GoldLink>
        </div>

        {related.length ? (
          <section className="mt-12">
            <div className="flex items-center gap-3 text-xs text-primary/80">
              <span className="tracking-cosmic">SAME CLUSTER</span>
              <span className="h-px flex-1 bg-primary/20" />
            </div>
            <div className="mt-5 grid gap-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to="/personality-disorders/$slug"
                  params={{ slug: item.slug }}
                  className="panel flex items-center gap-4 p-5 transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <PDArt theme={item.artTheme} className="h-12 w-12 shrink-0 rounded-lg" />
                  <div>
                    <h3 className="font-display text-lg text-foreground">{item.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{item.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
