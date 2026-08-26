import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { GoldLink, SectionTitle } from "@/components/cosmic/ui";
import { systemBySlug } from "@/lib/systems";

export const Route = createFileRoute("/systems/$slug")({
  loader: ({ params }) => {
    const system = systemBySlug(params.slug);
    if (!system) throw notFound();
    return system;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found — Cosmic Dossier" }] };
    }
    return {
      meta: [
        { title: `${loaderData.name} — Cosmic Dossier` },
        { name: "description", content: loaderData.whatItIs.slice(0, 155) },
        { property: "og:title", content: `${loaderData.name} — Cosmic Dossier` },
        { property: "og:description", content: loaderData.tagline },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SystemPage,
});

function SystemPage() {
  const system = Route.useLoaderData();

  return (
    <main className="relative min-h-screen">
      <StarField count={35} />
      <article className="relative mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          ← Cosmic Dossier
        </Link>

        <header className="mt-8">
          <p className="text-4xl">{system.glyph}</p>
          <SectionTitle>{system.name}</SectionTitle>
          <p className="mt-4 text-lg italic leading-relaxed text-foreground/75">{system.tagline}</p>
        </header>

        <div className="panel mt-8 p-6 sm:p-9">
          <h2 className="font-display text-xl text-gold">What it is</h2>
          <p className="mt-3 text-[0.98rem] leading-8 text-foreground/90">{system.whatItIs}</p>
        </div>

        <div className="panel mt-6 p-6 sm:p-8">
          <h2 className="font-display text-xl text-gold">A little history</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{system.history}</p>
        </div>

        <div className="panel mt-6 p-6 sm:p-8">
          <h2 className="font-display text-xl text-gold">How Cosmic Dossier uses it</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{system.howWeUseIt}</p>
        </div>

        <div className="panel mt-6 p-6 sm:p-8">
          <h2 className="font-display text-xl text-gold">Good to know</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{system.goodToKnow}</p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <GoldLink to="/input">Start My Report</GoldLink>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
            See all five systems →
          </Link>
        </div>
      </article>
    </main>
  );
}
