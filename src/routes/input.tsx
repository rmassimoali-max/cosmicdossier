import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StarField } from "@/components/cosmic/StarField";
import { CButton, Field, SectionTitle, SelectInput, TextInput } from "@/components/cosmic/ui";
import { ENNEAGRAM_NAMES, INSTINCTS, MBTI_TYPES } from "@/lib/assessments";
import {
  emptyPerson,
  setSession,
  useSession,
  type PersonInput,
} from "@/lib/session";

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
  const set = (patch: Partial<PersonInput>) => onChange({ ...person, ...patch });

  const assessments: { kind: string; label: string; done?: string | undefined }[] = [
    { kind: "mbti", label: "MBTI · 20 questions", done: person.mbti },
    {
      kind: "enneagram",
      label: "Enneagram · 18 questions",
      done: person.enneagramType
        ? `${person.enneagramType}${person.enneagramWing ? `w${person.enneagramWing}` : ""}`
        : undefined,
    },
    { kind: "attachment", label: "Attachment · 12 questions", done: person.attachment },
    {
      kind: "bigfive",
      label: "Big Five · 15 questions",
      done: person.bigFive ? "Scored" : undefined,
    },
  ];

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
          <TextInput type="date" value={person.dob} onChange={(e) => set({ dob: e.target.value })} />
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
              onChange={(e) => set({ enneagramType: e.target.value })}
            />
            <SelectInput
              options={Object.keys(ENNEAGRAM_NAMES).map((n) => ({ value: n, label: `w${n}` }))}
              placeholder="Wing"
              value={person.enneagramWing ?? ""}
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
            onChange={(e) => set({ attachment: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-7 border-t border-border pt-6">
        <p className="tracking-cosmic mb-3 text-[0.65rem] text-primary/80">
          Don't know? Take an assessment
        </p>
        <div className="flex flex-wrap gap-2">
          {assessments.map((a) => (
            <Link
              key={a.kind}
              to="/assessment/$kind"
              params={{ kind: a.kind }}
              search={{ person: index }}
              className="rounded-full border border-border bg-card/60 px-4 py-2 text-xs text-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              {a.label}
              {a.done ? <span className="ml-2 text-primary">✓ {a.done}</span> : null}
            </Link>
          ))}
        </div>
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
    if (!p.name.trim() || !p.dob || !p.birthPlace.trim()) {
      setError("Name, date of birth and birth place are required for Person 1.");
      return;
    }
    if (session.p2 && (!session.p2.dob || !session.p2.birthPlace.trim())) {
      setError("Person 2 needs a date of birth and birth place, or remove them.");
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
            onChange={(p1) => setSession((s) => ({ ...s, p1 }))}
          />
        </div>

        <div className="mt-14">
          <SectionTitle kicker="Optional · unlocks ❤️ synastry">Person 2</SectionTitle>
          {hasP2 && session.p2 ? (
            <>
              <PersonCard
                index={2}
                person={session.p2}
                onChange={(p2) => setSession((s) => ({ ...s, p2 }))}
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
            Chart is calculated from real ephemeris data, then read by AI.
          </span>
        </div>
      </div>
    </main>
  );
}
