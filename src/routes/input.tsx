import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StarField } from "@/components/cosmic/StarField";
import { CButton, Field, SectionTitle, SelectInput, TextInput } from "@/components/cosmic/ui";
import { ENNEAGRAM_NAMES, INSTINCTS, MBTI_TYPES } from "@/lib/assessments";
import { isValidEnneagramWing, validEnneagramWings } from "@/lib/enneagram-wing";
import { emptyPerson, setSession, useSession, type PersonInput } from "@/lib/session";
import { getAssessmentEntries, getAssessmentCategories } from "@/lib/assessment-discovery";

export const Route = createFileRoute("/input")({
  head: () => ({
    meta: [
      { title: "Your Details — Cosmic Dossier" },
      {
        name: "description",
        content:
          "Enter birth data, known MBTI and Enneagram — or take the short assessments — to generate your Cosmic Dossier.",
      },
      { property: "og:title", content: "Your Details — Cosmic Dossier" },
      {
        property: "og:description",
        content: "Birth data, typology and optional assessments for your personality dossier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InputPage,
});

const GENDERS = ["Woman", "Man", "Non-binary", "Prefer not to say"].map((v) => ({
  value: v,
  label: v,
}));
const STATUSES = ["Single", "Dating", "Partnered", "Married", "It's complicated"].map((v) => ({
  value: v,
  label: v,
}));

function PersonCard({
  index,
  person,
  onChange,
}: {
  index: 1 | 2;
  person: PersonInput;
  onChange: (p: PersonInput) => void;
}) {
  const [showAdditional, setShowAdditional] = useState(false);
  const set = (patch: Partial<PersonInput>) => onChange({ ...person, ...patch });

  const assessments = getAssessmentEntries(person);
  const core = assessments.filter((assessment) => assessment.legacy);
  const additional = assessments.filter((assessment) => !assessment.legacy);
  const categories = getAssessmentCategories(additional);

  return (
    <div className="panel p-6 sm:p-8">
      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="font-display text-lg text-gold">
          <span className="text-primary">*</span> Only needed for the natal chart
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Date, time and city of birth are used purely as math inputs: the date fixes the planets'
          positions, the exact time fixes your rising sign and house cusps, and the city gives the
          latitude, longitude and time zone. Everything is calculated on your device — nothing is
          stored on a server.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Prefer not to share it? Leave all three blank. You'll still get the full MBTI, Big Five,
          Enneagram and attachment dossier — just without the astrology layer.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <TextInput
            value={person.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Full name"
          />
        </Field>
        <Field label="Date of birth *" hint="Sets every planetary position in the chart.">
          <TextInput
            type="date"
            value={person.dob}
            onChange={(e) => set({ dob: e.target.value })}
          />
        </Field>
        <Field
          label="Birth time *"
          hint="Sets rising sign and houses. Unknown time means both are approximate."
        >
          <TextInput
            type="time"
            value={person.birthTime}
            onChange={(e) => set({ birthTime: e.target.value })}
          />
        </Field>
        <Field label="City and state *" hint="Used for latitude, longitude and time zone.">
          <TextInput
            value={person.birthPlace}
            onChange={(e) => set({ birthPlace: e.target.value })}
            placeholder="Austin, Texas"
          />
        </Field>
        <Field label="Gender (optional)">
          <SelectInput
            options={GENDERS}
            value={person.gender ?? ""}
            onChange={(e) => set({ gender: e.target.value })}
          />
        </Field>
        <Field label="Relationship status (optional)">
          <SelectInput
            options={STATUSES}
            value={person.relationshipStatus ?? ""}
            onChange={(e) => set({ relationshipStatus: e.target.value })}
          />
        </Field>
        <Field label="Known MBTI?">
          <SelectInput
            options={MBTI_TYPES.map((t) => ({ value: t, label: t }))}
            placeholder="I don't know"
            value={person.mbti ?? ""}
            onChange={(e) => set({ mbti: e.target.value, mbtiEstimates: undefined })}
          />
        </Field>
        <Field label="Known Enneagram?">
          <div className="grid grid-cols-3 gap-2">
            <SelectInput
              options={Object.entries(ENNEAGRAM_NAMES).map(([n, name]) => ({
                value: n,
                label: `${n} · ${name}`,
              }))}
              placeholder="Type"
              value={person.enneagramType ?? ""}
              onChange={(e) =>
                set({
                  enneagramType: e.target.value,
                  enneagramWing: isValidEnneagramWing(e.target.value, person.enneagramWing)
                    ? person.enneagramWing
                    : undefined,
                  enneagramEstimates: undefined,
                })
              }
            />
            <SelectInput
              options={validEnneagramWings(person.enneagramType).map((n) => ({
                value: n,
                label: `w${n}`,
              }))}
              placeholder="Wing"
              value={
                isValidEnneagramWing(person.enneagramType, person.enneagramWing)
                  ? person.enneagramWing
                  : ""
              }
              onChange={(e) => set({ enneagramWing: e.target.value })}
            />
            <SelectInput
              options={INSTINCTS.map((i) => ({ value: i, label: i }))}
              placeholder="Instinct"
              value={person.enneagramInstinct ?? ""}
              onChange={(e) => set({ enneagramInstinct: e.target.value })}
            />
          </div>
        </Field>
        <Field label="Attachment style (optional)">
          <SelectInput
            options={["Secure", "Anxious", "Dismissive Avoidant", "Fearful Avoidant"].map((v) => ({
              value: v,
              label: v,
            }))}
            value={person.attachment ?? ""}
            onChange={(e) => set({ attachment: e.target.value, attachmentEstimates: undefined })}
          />
        </Field>
      </div>

      <div className="mt-7 border-t border-border pt-6">
        <p className="tracking-cosmic mb-3 text-[0.65rem] text-primary/80">Core assessments</p>
        <div className="flex flex-wrap gap-2">
          {core.map((assessment) => (
            <Link
              key={assessment.slug}
              to="/assessment/$kind"
              params={{ kind: assessment.slug }}
              search={{ person: index }}
              className="rounded-full border border-border bg-card/60 px-4 py-2 text-xs text-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              {assessment.label}
              <span
                className={
                  assessment.completed ? "ml-2 text-primary" : "ml-2 text-muted-foreground"
                }
              >
                {assessment.completed
                  ? `✓ Completed${assessment.detail ? ` · ${assessment.detail}` : ""}`
                  : "· Not yet taken"}
              </span>
            </Link>
          ))}
        </div>

        {additional.length > 0 ? (
          <div className="mt-5">
            <button
              type="button"
              aria-expanded={showAdditional}
              onClick={() => setShowAdditional((value) => !value)}
              className="text-xs text-primary transition-colors hover:text-gold"
            >
              {showAdditional
                ? "Hide additional assessments"
                : `View all assessments · ${additional.length}`}
            </button>

            {showAdditional ? (
              <div className="mt-4 space-y-4">
                {categories.map((group) => (
                  <div key={group.category}>
                    <p className="mb-2 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                      {group.category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.entries.map((assessment) => (
                        <Link
                          key={assessment.slug}
                          to="/tests/$slug"
                          params={{ slug: assessment.slug }}
                          search={{ r: undefined, person: index }}
                          className="rounded-full border border-border bg-card/60 px-4 py-2 text-xs text-foreground transition-colors hover:border-primary/60 hover:text-primary"
                        >
                          {assessment.label}
                          <span
                            className={
                              assessment.completed
                                ? "ml-2 text-primary"
                                : "ml-2 text-muted-foreground"
                            }
                          >
                            {assessment.completed
                              ? `✓ Completed${
                                  assessment.detail
                                    ? ` · ${assessment.detail}`
                                    : " · Review / retake"
                                }`
                              : "· Not yet taken"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InputPage() {
  const session = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasP2 = Boolean(session.p2);

  const submit = () => {
    const p = session.p1;
    if (!p.name.trim()) {
      setError("A name is required for Person 1.");
      return;
    }
    const partial = (x: { dob: string; birthPlace: string }) =>
      Boolean(x.dob) !== Boolean(x.birthPlace.trim());
    if (partial(p) || (session.p2 && partial(session.p2))) {
      setError(
        "For a natal chart we need both date of birth and city/state. Fill in both, or leave both blank to skip the astrology section.",
      );
      return;
    }
    setError(null);
    setSession({ charts: undefined, dossier: undefined });
    navigate({ to: "/report" });
  };

  return (
    <main className="relative min-h-screen">
      <StarField count={50} />
      <div className="relative mx-auto max-w-4xl px-5 py-16">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          ← Cosmic Dossier
        </Link>

        <div className="mt-8 animate-drift-in">
          <SectionTitle kicker="Step one">Person 1</SectionTitle>
          <PersonCard
            index={1}
            person={session.p1}
            onChange={(p1) => setSession((s) => ({ ...s, p1, dossier: undefined }))}
          />
        </div>

        <div className="mt-14">
          <SectionTitle kicker="Optional · unlocks ❤️ synastry">Person 2</SectionTitle>
          {hasP2 && session.p2 ? (
            <>
              <PersonCard
                index={2}
                person={session.p2}
                onChange={(p2) => setSession((s) => ({ ...s, p2, dossier: undefined }))}
              />
              <CButton
                variant="ghost"
                className="mt-3 text-xs"
                onClick={() => setSession((s) => ({ ...s, p2: null }))}
              >
                Remove Person 2
              </CButton>
            </>
          ) : (
            <button
              onClick={() => setSession((s) => ({ ...s, p2: emptyPerson() }))}
              className="panel w-full px-6 py-10 text-center font-display text-xl text-muted-foreground transition-colors hover:text-primary"
            >
              + Add a second person to unlock the synastry report
            </button>
          )}
        </div>

        {error ? <p className="mt-8 text-sm text-destructive">{error}</p> : null}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <CButton onClick={submit}>Generate Report</CButton>
          <span className="text-xs text-muted-foreground">
            Chart is calculated from real ephemeris data, then read by the synthesis engine — no AI,
            no API keys.
          </span>
        </div>
      </div>
    </main>
  );
}
