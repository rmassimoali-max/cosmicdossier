import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { GoldLink, SectionTitle } from "@/components/cosmic/ui";
import { MBTI_LIBRARY, mbtiDimensionText } from "@/lib/interpret/mbti";

export const Route = createFileRoute("/mbti/$type")({
  loader: ({ params }) => {
    const profile = MBTI_LIBRARY[params.type.toUpperCase()];
    if (!profile) throw notFound();
    return profile;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Type not found | Cosmic Dossier" }] };
    }
    const title = `${loaderData.type} Personality Type: ${loaderData.nickname} | Cosmic Dossier`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.core.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.core },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: MbtiTypePage,
  notFoundComponent: () => (
    <main className="relative min-h-screen">
      <StarField count={30} />
      <div className="relative mx-auto max-w-2xl px-5 py-24 text-center">
        <SectionTitle>That type doesn't exist</SectionTitle>
        <p className="text-sm text-muted-foreground">
          There are 16 MBTI types — try the full list instead.
        </p>
        <div className="mt-8 flex justify-center">
          <GoldLink to="/mbti">See all 16 types</GoldLink>
        </div>
      </div>
    </main>
  ),
});

function MbtiTypePage() {
  const profile = Route.useLoaderData();
  const dimensions = mbtiDimensionText(profile.type);

  return (
    <main className="relative min-h-screen">
      <StarField count={40} />
      <article className="relative mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <Link to="/mbti" className="text-xs text-muted-foreground hover:text-primary">
          ← All 16 MBTI types
        </Link>

        <header className="mt-8">
          <SectionTitle kicker={`MBTI · ${profile.type}`}>{profile.nickname}</SectionTitle>
          <p className="-mt-2 text-lg italic leading-relaxed text-foreground/80">{profile.core}</p>
        </header>

        <div className="panel mt-8 p-6 sm:p-8">
          <h2 className="font-display text-xl text-gold">Cognitive dimensions</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {dimensions.map((line) => (
              <li key={line}>✦ {line}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="panel p-6">
            <h3 className="font-display text-xl text-gold">Strengths</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {profile.strengths.map((s) => (
                <li key={s}>✦ {s}</li>
              ))}
            </ul>
          </div>
          <div className="panel p-6">
            <h3 className="font-display text-xl text-gold">Blind spots</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {profile.blindSpots.map((s) => (
                <li key={s}>✦ {s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="panel p-6">
            <h3 className="font-display text-xl text-gold">Communication</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {profile.communication}
            </p>
          </div>
          <div className="panel p-6">
            <h3 className="font-display text-xl text-gold">Decision-making</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{profile.decisions}</p>
          </div>
          <div className="panel p-6">
            <h3 className="font-display text-xl text-gold">Under stress</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{profile.stress}</p>
          </div>
          <div className="panel p-6">
            <h3 className="font-display text-xl text-gold">In relationships</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {profile.relationships}
            </p>
          </div>
          <div className="panel p-6">
            <h3 className="font-display text-xl text-gold">At work</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{profile.work}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <GoldLink to="/input">Start My Report</GoldLink>
          <Link to="/mbti" className="text-xs text-muted-foreground hover:text-primary">
            See all 16 types →
          </Link>
        </div>
      </article>
    </main>
  );
}
