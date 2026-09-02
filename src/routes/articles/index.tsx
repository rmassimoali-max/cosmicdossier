import { Link, createFileRoute } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { SectionTitle } from "@/components/cosmic/ui";
import { articles } from "@/lib/articles";
export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "Dossier Files — Psychology & Relationships | Cosmic Dossier" },
      {
        name: "description",
        content:
          "Psychology and relationship insights covering attachment, intimacy, emotional patterns, and the hidden dynamics between people.",
      },
      { property: "og:title", content: "Dossier Files — Cosmic Dossier" },
      {
        property: "og:description",
        content: "Explore psychology, attachment, relationships, and the patterns hiding underneath human behavior.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ArticlesIndex,
});
function ArticlesIndex() {
  return (
    <main className="relative min-h-screen">
      <StarField count={45} />
      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          ← Cosmic Dossier
        </Link>
        <div className="mt-10 max-w-3xl">
          <SectionTitle kicker="The Dossier Files">Psychology, decoded.</SectionTitle>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            The patterns beneath attraction, attachment, intimacy, distance, and the strange ways
            humans try to feel safe with one another.
          </p>
        </div>
        <div className="mt-12 flex items-center gap-3 text-xs text-primary/80">
          <span className="tracking-cosmic">CASE FILES</span>
          <span className="h-px flex-1 bg-primary/20" />
          <span>{articles.length} files</span>
        </div>
        <section className="mt-5 grid gap-4 md:grid-cols-2">
          {articles.map((article, index) => (
            <Link
              key={article.slug}
              to="/articles/$slug"
              params={{ slug: article.slug }}
              className="panel group block p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between gap-4 text-[0.68rem] uppercase tracking-widest text-primary/70">
                <span>Dossier #{String(index + 1).padStart(2, "0")}</span>
                <span>{article.readTime}</span>
              </div>
              <h2 className="mt-4 font-display text-2xl leading-tight text-foreground transition-colors group-hover:text-gold">
                {article.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
              <span className="mt-5 inline-block text-xs text-primary">Open case file →</span>
            </Link>
          ))}
        </section>
        <div className="panel mt-10 p-6 text-center sm:p-8">
          <p className="font-display text-xl text-foreground">Curious how these patterns show up in you?</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Build a personalized Cosmic Dossier across attachment, personality, astrology, and more.
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
