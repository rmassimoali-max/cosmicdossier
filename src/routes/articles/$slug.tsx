// Copyright (c) Lovable. All rights reserved.
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { GoldLink, SectionTitle } from "@/components/cosmic/ui";
import { articleBySlug, articles } from "@/lib/articles";
import { STANDALONE_TEST_ARTICLES } from "@/lib/standaloneTestArticles";

const allArticles = [...articles, ...STANDALONE_TEST_ARTICLES];
const relatedSlugs: Record<string, string[]> = {
  "what-hexaco-adds-to-the-big-five": ["what-the-big-five-actually-measures", "understanding-the-dark-triad"],
  "the-five-love-languages": ["the-two-dimensions-of-attachment", "avoidance-vs-healthy-independence"],
  "emotional-intelligence-what-it-is-and-isnt": ["the-orchid-hypothesis-sensitivity-as-temperament", "what-the-big-five-actually-measures"],
  "what-resilience-really-means": ["the-two-dimensions-of-attachment", "the-orchid-hypothesis-sensitivity-as-temperament"],
};

export const Route = createFileRoute("/articles/$slug")({
  loader: ({ params }) => {
    const article = articleBySlug(params.slug) ?? STANDALONE_TEST_ARTICLES.find((item) => item.slug === params.slug);
    if (!article) throw notFound();
    return article;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Dossier File not found — Cosmic Dossier" }] };
    }
    return {
      meta: [
        { title: `${loaderData.title} | Cosmic Dossier` },
        { name: "description", content: loaderData.excerpt.slice(0, 155) },
        { property: "og:title", content: `${loaderData.title} | Cosmic Dossier` },
        { property: "og:description", content: loaderData.excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const article = Route.useLoaderData();
  const currentIndex = allArticles.findIndex((item) => item.slug === article.slug);
  const related = allArticles.filter((item) => item.slug !== article.slug).slice(0, 3);
  const contextualRelated = (relatedSlugs[article.slug] ?? [])
    .map((slug) => allArticles.find((item) => item.slug === slug))
    .filter((item) => item !== undefined);

  return (
    <main className="relative min-h-screen">
      <StarField count={35} />
      <article className="relative mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <Link to="/articles" className="text-xs text-muted-foreground hover:text-primary">
          ← All Dossier Files
        </Link>

        <header className="mt-10">
          <p className="tracking-cosmic text-xs text-primary/80">
            DOSSIER #{String(currentIndex + 1).padStart(2, "0")} · {article.category}
          </p>
          <SectionTitle>{article.title}</SectionTitle>
          <p className="mt-5 text-lg leading-relaxed text-foreground/75">{article.excerpt}</p>
          <p className="mt-4 text-xs text-muted-foreground">{article.readTime}</p>
        </header>

        <div className="panel mt-10 p-6 sm:p-9">
          <div className="space-y-6 text-[0.98rem] leading-8 text-foreground/90">
            {article.content.map((paragraph, index) => {
              if (paragraph.startsWith("Key distinguishing signs include:")) {
                const [intro, ...items] = paragraph.split("\n\n");
                return (
                  <div key={index} className="space-y-3">
                    <p>{intro}</p>
                    <ul className="space-y-2 pl-5 text-muted-foreground">
                      {items.flatMap((item) => item.split("\n")).filter(Boolean).map((item) => (
                        <li key={item} className="list-disc">{item.replace(/^- /, "")}</li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return <p key={index}>{paragraph}</p>;
            })}
          </div>
        </div>

        {contextualRelated.length > 0 ? (
          <section className="mt-8">
            <div className="flex items-center gap-3 text-xs text-primary/80">
              <span className="tracking-cosmic">RELATED FILES</span>
              <span className="h-px flex-1 bg-primary/20" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {contextualRelated.map((item) => (
                <Link
                  key={item.slug}
                  to="/articles/$slug"
                  params={{ slug: item.slug }}
                  className="panel block p-5 transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <p className="text-[0.65rem] uppercase tracking-widest text-primary/70">{item.category}</p>
                  <h2 className="mt-2 font-display text-lg text-foreground">{item.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="panel mt-8 p-6 sm:p-8">
          <p className="tracking-cosmic text-xs text-primary/80">THE DOSSIER CONNECTION</p>
          <h2 className="mt-2 font-display text-2xl text-gold">See the pattern in context.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Attachment is only one lens. Cosmic Dossier combines attachment style with personality
            systems and symbolic astrology to create a broader, personalized picture.
          </p>
          <GoldLink to="/input" className="mt-5 inline-flex">Build My Dossier →</GoldLink>
        </div>

        <section className="mt-12">
          <div className="flex items-center gap-3 text-xs text-primary/80">
            <span className="tracking-cosmic">MORE FILES</span>
            <span className="h-px flex-1 bg-primary/20" />
          </div>
          <div className="mt-5 grid gap-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                to="/articles/$slug"
                params={{ slug: item.slug }}
                className="panel p-5 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <p className="text-[0.65rem] uppercase tracking-widest text-primary/70">{item.category}</p>
                <h3 className="mt-2 font-display text-xl text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
