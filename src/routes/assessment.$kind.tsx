import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StarField } from "@/components/cosmic/StarField";
import { Bar, CButton, SectionTitle } from "@/components/cosmic/ui";
import {
  ATTACHMENT_QUESTIONS,
  BIGFIVE_QUESTIONS,
  BIGFIVE_TRAITS,
  ENNEAGRAM_QUESTIONS,
  LIKERT,
  MBTI_QUESTIONS,
  scoreAttachment,
  scoreBigFive,
  scoreEnneagram,
  scoreMbti,
  type Estimate,
} from "@/lib/assessments";
import { setSession, type PersonInput } from "@/lib/session";

type Kind = "mbti" | "enneagram" | "attachment" | "bigfive";

const META: Record<Kind, { title: string; kicker: string; blurb: string }> = {
  mbti: {
    title: "MBTI Estimate",
    kicker: "20 forced choices · ~4 minutes",
    blurb: "Pick whichever is closer, even if neither is perfect.",
  },
  enneagram: {
    title: "Enneagram Estimate",
    kicker: "18 statements · ~3 minutes",
    blurb: "Rate how true each statement is of you at your most honest.",
  },
  attachment: {
    title: "Attachment Style",
    kicker: "12 statements · ~2 minutes",
    blurb: "Answer as you are in close relationships, not as you'd like to be.",
  },
  bigfive: {
    title: "Big Five",
    kicker: "15 statements · ~2 minutes",
    blurb: "The most research-backed of the five systems in your dossier.",
  },
};

export const Route = createFileRoute("/assessment/$kind")({
  validateSearch: (search: Record<string, unknown>) => ({
    person: Number(search['person']) === 2 ? (2 as const) : (1 as const),
  }),
  head: () => ({
    meta: [
      { title: "Assessment — Cosmic Dossier" },
      {
        name: "description",
        content:
          "Short, well-written assessments that estimate your MBTI, Enneagram, attachment style and Big Five profile.",
      },
      { property: "og:title", content: "Assessment — Cosmic Dossier" },
      {
        property: "og:description",
        content: "Estimate your MBTI, Enneagram, attachment style and Big Five in a few minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssessmentPage,
});

function AssessmentPage() {
  const { kind } = Route.useParams();
  const { person } = Route.useSearch();
  const navigate = useNavigate();
  const k = (["mbti", "enneagram", "attachment", "bigfive"].includes(kind) ? kind : "mbti") as Kind;
  const meta = META[k];

  const [choice, setChoice] = useState<Record<string, string>>({});
  const [scale, setScale] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    estimates: Estimate[];
    bigFive?: Record<string, number>;
    patch: Partial<PersonInput>;
  } | null>(null);

  const questions = useMemo(() => {
    if (k === "mbti") return MBTI_QUESTIONS.map((q) => q.id);
    if (k === "enneagram") return ENNEAGRAM_QUESTIONS.map((q) => q.id);
    if (k === "attachment") return ATTACHMENT_QUESTIONS.map((q) => q.id);
    return BIGFIVE_QUESTIONS.map((q) => q.id);
  }, [k]);

  const answered = questions.filter((id) => (k === "mbti" ? choice[id] : scale[id])).length;
  const complete = answered === questions.length;

  const finish = () => {
    if (k === "mbti") {
      const estimates = scoreMbti(choice);
      setResult({
        estimates,
        patch: { mbti: estimates[0]?.label, mbtiEstimates: estimates },
      });
    } else if (k === "enneagram") {
      const r = scoreEnneagram(scale);
      setResult({
        estimates: r.estimates,
        patch: {
          enneagramType: String(r.core),
          enneagramWing: String(r.wing),
          enneagramEstimates: r.estimates,
        },
      });
    } else if (k === "attachment") {
      const r = scoreAttachment(scale);
      setResult({
        estimates: r.estimates,
        patch: { attachment: r.primary, attachmentEstimates: r.estimates },
      });
    } else {
      const bigFive = scoreBigFive(scale);
      setResult({
        estimates: BIGFIVE_TRAITS.map((t) => ({ label: t, percent: bigFive[t] ?? 50 })).sort(
          (a, b) => b.percent - a.percent,
        ),
        bigFive,
        patch: { bigFive },
      });
    }
  };

  const save = () => {
    if (!result) return;
    setSession((s) =>
      person === 2
        ? { ...s, p2: s.p2 ? { ...s.p2, ...result.patch } : s.p2 }
        : { ...s, p1: { ...s.p1, ...result.patch } },
    );
    navigate({ to: "/input" });
  };

  return (
    <main className="relative min-h-screen">
      <StarField count={40} />
      <div className="relative mx-auto max-w-3xl px-5 py-16">
        <button
          onClick={() => navigate({ to: "/input" })}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          ← Back to details
        </button>

        <div className="mt-8">
          <SectionTitle kicker={`Person ${person} · ${meta.kicker}`}>{meta.title}</SectionTitle>
          <p className="-mt-2 mb-8 text-sm text-muted-foreground">{meta.blurb}</p>
        </div>

        {result ? (
          <div className="panel animate-drift-in p-8">
            <p className="tracking-cosmic text-[0.65rem] text-primary/80">Estimate</p>
            <h3 className="mt-2 text-4xl text-gold">{result.estimates[0]?.label}</h3>
            <div className="mt-7 space-y-3">
              {result.estimates.map((e, i) => (
                <Bar
                  key={e.label}
                  label={e.label}
                  value={e.percent}
                  max={100}
                  caption={`${e.percent}%`}
                  tone={i === 0 ? "primary" : "accent"}
                />
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              An estimate, not a verdict — your dossier treats it as a probability distribution.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <CButton onClick={save}>Save & continue</CButton>
              <CButton variant="outline" onClick={() => setResult(null)}>
                Revise answers
              </CButton>
            </div>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 -mx-5 mb-6 bg-background/80 px-5 py-3 backdrop-blur">
              <Bar
                label="Progress"
                value={answered}
                max={questions.length}
                caption={`${answered}/${questions.length}`}
              />
            </div>

            <div className="space-y-4">
              {k === "mbti"
                ? MBTI_QUESTIONS.map((q, i) => (
                    <div key={q.id} className="panel p-6">
                      <p className="font-display text-xl text-foreground">
                        <span className="mr-2 font-mono text-xs text-primary/70">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {q.prompt}
                      </p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {[q.a, q.b].map((opt) => {
                          const active = choice[q.id] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setChoice((c) => ({ ...c, [q.id]: opt.value }))}
                              className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                                active
                                  ? "border-primary/70 bg-primary/10 text-foreground"
                                  : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                              }`}
                            >
                              {opt.text}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                : (k === "enneagram"
                    ? ENNEAGRAM_QUESTIONS
                    : k === "attachment"
                      ? ATTACHMENT_QUESTIONS
                      : BIGFIVE_QUESTIONS
                  ).map((q, i) => (
                    <div key={q.id} className="panel p-6">
                      <p className="font-display text-xl text-foreground">
                        <span className="mr-2 font-mono text-xs text-primary/70">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {q.prompt}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {LIKERT.map((label, idx) => {
                          const value = idx + 1;
                          const active = scale[q.id] === value;
                          return (
                            <button
                              key={label}
                              onClick={() => setScale((s) => ({ ...s, [q.id]: value }))}
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
                See my estimate
              </CButton>
              {!complete ? (
                <span className="text-xs text-muted-foreground">
                  {questions.length - answered} left
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
