import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { GoldLink, SectionTitle } from "@/components/cosmic/ui";
import { attachmentStyleBySlug, ATTACHMENT_STYLES } from "@/lib/attachment-styles";

export const Route = createFileRoute("/attachment/$slug")({
  loader: ({ params }) => {
    const style = attachmentStyleBySlug(params.slug);
    if (!style) throw notFound();
    return style;
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
  component: AttachmentStylePage,
});

function AttachmentStylePage() {
  const style = Route.useLoaderData();
  const others = ATTACHMENT_STYLES.filter((s) => s.slug !== style.slug);

  return (
    <main className="relative min-h-screen">
      <StarField count={35} />
      <article className="relative mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <Link to="/attachment" className="text-xs text-muted-foreground hover:text-primary">
          ← All attachment styles
        </Link>

        <header className="mt-8">
          <SectionTitle>{style.name}</SectionTitle>
          <p className="mt-4 text-lg italic leading-relaxed text-foreground/75">{style.tagline}</p>
        </header>

        <div className="panel mt-8 p-6 sm:p-9">
          <h2 className="font-display text-xl text-gold">Overview</h2>
          <p className="mt-3 text-[0.98rem] leading-8 text-foreground/90">{style.overview}</p>
        </div>

        <div className="panel mt-6 p-6 sm:p-8">
          <h2 className="font-display text-xl text-gold">How it shows up</h2>
          <div className="mt-4 space-y-4">
            {style.howItShowsUp.map((item) => (
              <div key={item.context}>
                <p className="text-xs uppercase tracking-widest text-primary/70">{item.context}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.example}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel mt-6 p-6 sm:p-8">
          <h2 className="font-display text-xl text-gold">How it's theorized to develop</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{style.development}</p>
        </div>

        <div className="panel mt-6 p-6 sm:p-8">
          <h2 className="font-display text-xl text-gold">Does this sound familiar?</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            These aren't a diagnostic checklist — just questions people with this pattern often
            recognize themselves in.
          </p>
          <ul className="mt-4 space-y-3">
            {style.reflectionPrompts.map((q) => (
              <li key={q} className="border-l-2 border-primary/40 pl-4 text-sm italic text-foreground/85">
                {q}
              </li>
            ))}
          </ul>
        </div>

        {style.healing ? (
          <div className="panel mt-6 p-6 sm:p-8">
            <h2 className="font-display text-xl text-gold">Beginning to heal this pattern</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70">Where to start</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {style.healing.whereToStart}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-primary/70">
                  What the process usually involves
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {style.healing.whatTheProcessInvolves}
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-foreground/85">
              {style.healing.encouragement}
            </p>
          </div>
        ) : null}

        <div className="panel mt-8 p-6 sm:p-8">
          <p className="text-xs leading-relaxed text-muted-foreground">
            This page is educational, not a diagnosis. Attachment style is best understood by a
            qualified therapist, who can consider your specific history and relationships — not
            determined by a self-assessment alone.
          </p>
        </div>

        <div className="panel mt-8 p-6 sm:p-8">
          <p className="tracking-cosmic text-xs text-primary/80">THE DOSSIER CONNECTION</p>
          <h2 className="mt-2 font-display text-2xl text-gold">See your own pattern.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Cosmic Dossier includes a short attachment assessment as part of your full personality
            dossier, read alongside your MBTI, Enneagram, Big Five and astrology.
          </p>
          <GoldLink to="/input" className="mt-5 inline-flex">Build My Dossier →</GoldLink>
        </div>

        <section className="mt-12">
          <div className="flex items-center gap-3 text-xs text-primary/80">
            <span className="tracking-cosmic">THE OTHER STYLES</span>
            <span className="h-px flex-1 bg-primary/20" />
          </div>
          <div className="mt-5 grid gap-3">
            {others.map((item) => (
              <Link
                key={item.slug}
                to="/attachment/$slug"
                params={{ slug: item.slug }}
                className="panel p-5 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <h3 className="font-display text-lg text-foreground">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
