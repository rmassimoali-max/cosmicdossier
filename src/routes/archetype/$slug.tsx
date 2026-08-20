import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { GoldLink, SectionTitle } from "@/components/cosmic/ui";
import { archetypeBySlug } from "@/lib/archetypes";

export const Route = createFileRoute("/archetype/$slug")({
  loader: ({ params }) => {
    const archetype = archetypeBySlug(params.slug);
    if (!archetype) throw notFound();
    return archetype;
  },
    head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Archetype not found — Cosmic Dossier" }] };
    }
    return {
      meta: [
        { title: `${loaderData.name} — Cosmic Dossier Archetype` },
        { name: "description", content: loaderData.description.slice(0, 155) },
        { property: "og:title", content: `${loaderData.name} — Cosmic Dossier` },
        { property: "og:description", content: loaderData.tagline },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ArchetypePage,
});

function ArchetypePage() {
  const archetype = Route.useLoaderData();

  return (
    <main className="relative min-h-screen">
      <StarField count={40} />
      <div className="relative mx-auto max-w-3xl px-5 py-16">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          ← Cosmic Dossier
        </Link>

        <div className="mt-8">
          <SectionTitle kicker="Archetype">
            {archetype.symbol} {archetype.name}
          </SectionTitle>
          <p className="-mt-2 text-lg italic text-foreground/80">"{archetype.tagline}"</p>
        </div>

        <div className="panel mt-8 p-6 sm:p-8">
          <p className="text-[0.95rem] leading-relaxed text-foreground/90">{archetype.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {archetype.coreTraits.map((t) => (
              <span
                key={t}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="panel p-6">
            <h4 className="font-display text-xl text-gold">Strengths</h4>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {archetype.strengths.map((s) => (
                <li key={s}>✦ {s}</li>
              ))}
            </ul>
          </div>
          <div className="panel p-6">
            <h4 className="font-display text-xl text-gold">Blind spots</h4>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {archetype.blindSpots.map((s) => (
                <li key={s}>✦ {s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="panel p-6">
            <h4 className="font-display text-xl text-gold">In relationships</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {archetype.relationshipTendencies}
            </p>
          </div>
          <div className="panel p-6">
            <h4 className="font-display text-xl text-gold">Communication</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {archetype.communicationTendencies}
            </p>
          </div>
          <div className="panel p-6">
            <h4 className="font-display text-xl text-gold">Growth edge</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{archetype.growthThemes}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <GoldLink to="/input">Take the free assessment</GoldLink>
          <span className="text-xs text-muted-foreground">
            Your actual dossier is a personalized read across five systems — this page is one
            recognizable pattern among many.
          </span>
        </div>
      </div>
    </main>
  );
}
