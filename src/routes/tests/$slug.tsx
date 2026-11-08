import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StarField } from "@/components/cosmic/StarField";
import { Bar, CButton, SectionTitle } from "@/components/cosmic/ui";
import { ARCHETYPES } from "@/lib/archetypes";
import { articleBySlug } from "@/lib/articles";
import { setSession } from "@/lib/session";
import { TESTS, testBySlug } from "@/lib/tests";
import {
  bandFor,
  decodeAnswers,
  encodeAnswers,
  scoreDimensions,
  type TestDef,
} from "@/lib/tests/types";

export const Route = createFileRoute("/tests/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    r: typeof search["r"] === "string" ? search["r"] : undefined,
  }),
  loader: ({ params }) => {
    // Only the slug crosses the SSR boundary — the TestDef itself contains
    // functions, which cannot be serialized through a loader.
    if (!testBySlug(params.slug)) throw notFound();
    return { slug: params.slug };
  },
  head: ({ loaderData }) => {
    const test = loaderData ? testBySlug(loaderData.slug) : undefined;
    if (!test) {
      return { meta: [{ title: "Test not found — Cosmic Dossier" }] };
    }
    return {
      meta: [
        { title: `${test.name} Test — Cosmic Dossier` },
        { name: "description", content: test.tagline },
        { property: "og:title", content: `${test.name} Test — Cosmic Dossier` },
        { property: "og:description", content: test.whatItMeasures },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: TestPage,
});

type Phase = "intro" | "quiz" | "results";

function TestPage() {
  const test = Route.useLoaderData();
  const { r } = Route.useSearch();
  const navigate = useNavigate();

  const sharedAnswers = useMemo(
    () => (r ? decodeAnswers(test.items, r) : null),
    [test, r],
  );

  const [phase, setPhase] = useState<Phase>(sharedAnswers ? "results" : "intro");
  const [answers, setAnswers] = useState<Record<string, number>>(sharedAnswers ?? {});
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  const answered = test.items.filter((q) => answers[q.id] != null).length;
  const complete = answered === test.items.length;
  const scores = useMemo(
    () => (complete ? scoreDimensions(test.items, test.scale, answers) : null),
    [test, answers, complete],
  );

  const finish = () => {
    if (!complete) return;
    const encoded = encodeAnswers(test.items, answers);
    void navigate({
      to: "/tests/$slug",
      params: { slug: test.slug },
      search: { r: encoded },
      replace: true,
    });
    setPhase("results");
  };

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const addToDossier = () => {
    if (test.dossierPatch && scores) {
      const patch = test.dossierPatch(scores);
      setSession((s) => ({ ...s, p1: { ...s.p1, ...patch } }));
      setAdded(true);
    }
    void navigate({ to: "/input" });
  };

  return (
    <main className="relative min-h-screen">
      <StarField count={40} />
      <div className="relative mx-auto max-w-3xl px-5 py-16">
        <Link to="/tests" className="text-xs text-muted-foreground hover:text-primary">
          ← Test Library
        </Link>

        {phase === "intro" ? <Intro test={test} onStart={() => setPhase("quiz")} /> : null}

        {phase === "quiz" ? (
          <>
            <div className="mt-8">
              <SectionTitle kicker={`${test.items.length} items · ${test.minutes}`}>
                {test.name}
              </SectionTitle>
              <p className="-mt-2 mb-8 text-sm text-muted-foreground">
                Answer as you actually are, not as you would like to be.
              </p>
            </div>

            <div className="sticky top-0 z-10 -mx-5 mb-6 bg-background/80 px-5 py-3 backdrop-blur">
              <Bar
                label="Progress"
                value={answered}
                max={test.items.length}
                caption={`${answered}/${test.items.length}`}
              />
            </div>

            <div className="space-y-4">
              {test.items.map((q, i) => (
                <div key={q.id} className="panel p-6">
                  <p className="font-display text-xl text-foreground">
                    <span className="mr-2 font-mono text-xs text-primary/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {q.text}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {test.scale.labels.map((label, idx) => {
                      const value = test.scale.min + idx;
                      const active = answers[q.id] === value;
                      return (
                        <button
                          key={label}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: value }))}
                          className={`rounded-full border px-3.5 py-2 text-xs transition-colors ${
                            active
                              ? "border-primary/70 bg-primary/10 text-foreground"
                              : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <CButton disabled={!complete} onClick={finish}>
                See my results
              </CButton>
              {!complete ? (
                <span className="text-xs text-muted-foreground">
                  {test.items.length - answered} left
                </span>
              ) : null}
            </div>
          </>
        ) : null}

        {phase === "results" && scores ? (
          <Results
            test={test}
            scores={scores}
            copied={copied}
            added={added}
            onShare={() => void share()}
            onAdd={addToDossier}
            onRetake={() => {
              setAnswers({});
              setPhase("quiz");
              void navigate({
                to: "/tests/$slug",
                params: { slug: test.slug },
                search: { r: undefined },
                replace: true,
              });
            }}
          />
        ) : null}
      </div>
    </main>
  );
}

function Intro({ test, onStart }: { test: TestDef; onStart: () => void }) {
  return (
    <div className="mt-10">
      <SectionTitle kicker={test.category.toUpperCase()}>{test.name}</SectionTitle>
      <p className="text-lg italic leading-relaxed text-foreground/80">{test.tagline}</p>

      <div className="panel mt-8 space-y-6 p-6 sm:p-8">
        <div>
          <p className="tracking-cosmic text-[0.65rem] text-primary/80">WHAT IT MEASURES</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{test.whatItMeasures}</p>
        </div>
        <div>
          <p className="tracking-cosmic text-[0.65rem] text-primary/80">THE SCIENCE</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{test.background}</p>
          <p className="mt-3 text-xs italic leading-relaxed text-muted-foreground">
            {test.citation}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-muted-foreground">
          <span>
            <span className="text-primary/80">Length:</span> {test.items.length} items
          </span>
          <span>
            <span className="text-primary/80">Time:</span> {test.minutes}
          </span>
          <span>
            <span className="text-primary/80">Privacy:</span> scored in your browser, never sent
          </span>
        </div>
        {test.disclaimer ? (
          <p className="rounded-md border border-border bg-background/40 p-3 text-xs leading-relaxed text-muted-foreground">
            {test.disclaimer}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        <CButton onClick={onStart}>Begin the test</CButton>
      </div>
    </div>
  );
}

function Results({
  test,
  scores,
  copied,
  added,
  onShare,
  onAdd,
  onRetake,
}: {
  test: TestDef;
  scores: Record<string, number>;
  copied: boolean;
  added: boolean;
  onShare: () => void;
  onAdd: () => void;
  onRetake: () => void;
}) {
  const label = test.resultLabel?.(scores);
  const summary = test.resultSummary?.(scores);
  const note = test.archetypeNote(scores);
  const archetypes = note.slugs
    .map((slug) => ARCHETYPES.find((a) => a.slug === slug))
    .filter((a) => a != null);
  const article = articleBySlug(test.articleSlug);
  const related = TESTS.filter((t) => t.slug !== test.slug).slice(0, 3);

  return (
    <div className="mt-10 space-y-8">
      <div className="panel animate-drift-in p-6 text-center sm:p-10">
        <p className="tracking-cosmic text-[0.65rem] text-primary/80">YOUR RESULT</p>
        {label ? (
          <h2 className="mt-2 font-display text-4xl text-gold sm:text-5xl">{label}</h2>
        ) : null}
        {summary ? (
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-foreground/85">
            {summary}
          </p>
        ) : null}

        <div className="mx-auto mt-8 max-w-lg space-y-3 text-left">
          {test.dimensions.map((dim) => {
            const score = scores[dim.key] ?? 0;
            const band = bandFor(dim, score);
            return (
              <Bar
                key={dim.key}
                label={dim.label}
                value={score}
                max={100}
                caption={`${score}% · ${band.label}`}
                tone="primary"
              />
            );
          })}
        </div>
      </div>

      <div className="panel p-6 sm:p-8">
        <p className="tracking-cosmic text-[0.65rem] text-primary/80">READING THE RESULT</p>
        <div className="mt-4 space-y-6">
          {test.dimensions.map((dim) => {
            const score = scores[dim.key] ?? 0;
            const band = bandFor(dim, score);
            return (
              <div key={dim.key}>
                <h3 className="font-display text-xl text-foreground">
                  {dim.label} <span className="text-sm text-primary/80">— {band.label}</span>
                </h3>
                <p className="mt-1 text-xs italic text-muted-foreground">{dim.blurb}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{band.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel p-6 sm:p-8">
        <p className="tracking-cosmic text-[0.65rem] text-primary/80">THE DOSSIER CONNECTION</p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">{note.text}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {archetypes.map((a) => (
            <Link
              key={a.slug}
              to="/archetype/$slug"
              params={{ slug: a.slug }}
              className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-foreground hover:border-primary/70"
            >
              {a.name}
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <CButton onClick={onAdd}>Add this result to my Cosmic Dossier</CButton>
          {added ? <span className="text-xs text-muted-foreground">Saved to your dossier.</span> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CButton variant="outline" onClick={onShare}>
          {copied ? "Link copied" : "Share my result"}
        </CButton>
        <CButton variant="ghost" onClick={onRetake}>
          Take it again
        </CButton>
      </div>

      {article ? (
        <Link
          to="/articles/$slug"
          params={{ slug: article.slug }}
          className="panel block p-6 transition-transform duration-300 hover:-translate-y-0.5"
        >
          <p className="text-[0.65rem] uppercase tracking-widest text-primary/70">Go deeper</p>
          <h3 className="mt-2 font-display text-xl text-foreground">{article.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{article.excerpt}</p>
        </Link>
      ) : null}

      <section>
        <div className="flex items-center gap-3 text-xs text-primary/80">
          <span className="tracking-cosmic">RELATED TESTS</span>
          <span className="h-px flex-1 bg-primary/20" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {related.map((t) => (
            <Link
              key={t.slug}
              to="/tests/$slug"
              params={{ slug: t.slug }}
              className="panel p-5 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <h3 className="font-display text-lg text-foreground">{t.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.items.length} items · {t.minutes}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
