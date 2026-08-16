import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { LockedBlock, UnlockCard } from "@/components/cosmic/Paywall";
import { StarField } from "@/components/cosmic/StarField";
import { Bar, CButton, GoldLink, SectionTitle } from "@/components/cosmic/ui";
import { PLANET_GLYPH, SIGN_GLYPH, type NatalChart } from "@/lib/astro";
import { computeNatalChart } from "@/lib/astro.functions";
import { buildDossier, buildSynastry } from "@/lib/generate";
import { downloadDossierPdf } from "@/lib/pdf";
import { useUnlocked } from "@/lib/unlock";
import {
  ageFrom,
  getSession,
  setSession,
  useSession,
  type Dossier,
  type PersonInput,
} from "@/lib/session";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Your Cosmic Dossier" },
      {
        name: "description",
        content:
          "Your full personality dossier: natal chart, MBTI, Enneagram, attachment style and Big Five read as a single pattern, with optional synastry.",
      },
      { property: "og:title", content: "Your Cosmic Dossier" },
      {
        property: "og:description",
        content: "A full personality dossier woven from astrology, MBTI, Enneagram and psychology.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

const STEPS = [
  "Calculating natal chart",
  "Mapping houses and aspects",
  "Weaving typology with the chart",
  "Comparing the two charts",
  "Binding the dossier",
];

function ChartPanel({
  chart,
  name,
  locked = false,
}: {
  chart: NatalChart;
  name: string;
  locked?: boolean;
}) {
  const elementMax = Math.max(...Object.values(chart.elements), 1);
  const modalMax = Math.max(...Object.values(chart.modalities), 1);
  const domMax = Math.max(...chart.dominantPlanets.map((d) => d.score), 1);

  return (
    <div className="panel p-6 sm:p-8">
      <p className="tracking-cosmic text-[0.65rem] text-primary/80">Natal chart · {name}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(["sun", "moon", "rising"] as const).map((k) => (
          <div key={k} className="rounded-xl border border-border bg-background/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {k === "rising" ? "Rising" : k}
            </p>
            <p className="mt-1 font-display text-2xl text-gold">
              {SIGN_GLYPH[chart[k]] ?? ""} {chart[k]}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-7 text-xs text-muted-foreground">
        {chart.place.label} · {chart.local} · Placidus houses
      </p>

      {locked ? (
        <div className="mt-6">
          <UnlockCard
            title="Full chart is locked"
            note="Your Sun, Moon and Rising are free. Unlock to see every placement, house, element balance and aspect."
          />
        </div>
      ) : null}

      <div className={locked ? "hidden" : "mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2"}>
        {chart.placements.map((p) => (
          <div
            key={p.label}
            className="flex items-baseline justify-between border-b border-border/50 py-1.5 text-sm"
          >
            <span className="text-muted-foreground">
              <span className="mr-2 text-primary/80">{PLANET_GLYPH[p.label] ?? "•"}</span>
              {p.label}
            </span>
            <span className="text-right text-foreground/90">
              {p.sign} {p.degree}
              {p.house ? <span className="ml-1 text-muted-foreground">H{p.house}</span> : null}
              {p.retrograde ? <span className="ml-1 text-accent">℞</span> : null}
            </span>
          </div>
        ))}
      </div>

      <div className={locked ? "hidden" : "mt-8 grid gap-8 sm:grid-cols-2"}>
        <div>
          <p className="mb-3 font-display text-xl">Element balance</p>
          <div className="space-y-2">
            <Bar label="Fire" value={chart.elements.Fire} max={elementMax} tone="fire" />
            <Bar label="Earth" value={chart.elements.Earth} max={elementMax} tone="earth" />
            <Bar label="Air" value={chart.elements.Air} max={elementMax} tone="air" />
            <Bar label="Water" value={chart.elements.Water} max={elementMax} tone="water" />
          </div>
          <p className="mb-3 mt-6 font-display text-xl">Modalities</p>
          <div className="space-y-2">
            {Object.entries(chart.modalities).map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={modalMax} tone="accent" />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 font-display text-xl">Dominant planets</p>
          <div className="space-y-2">
            {chart.dominantPlanets.map((d) => (
              <Bar key={d.label} label={d.label} value={d.score} max={domMax} />
            ))}
          </div>
          <p className="mb-2 mt-6 font-display text-xl">Chart shape</p>
          <p className="text-sm text-muted-foreground">{chart.chartShape}</p>
          <p className="mb-2 mt-6 font-display text-xl">Tightest aspects</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {chart.aspects
              .filter((a) => a.level === "major")
              .sort((a, b) => a.orb - b.orb)
              .slice(0, 8)
              .map((a, i) => (
                <li key={i}>
                  {a.a} <span className="text-primary/80">{a.type}</span> {a.b} · orb{" "}
                  {a.orb.toFixed(1)}°
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function IdentityStrip({ person, chart }: { person: PersonInput; chart?: NatalChart | undefined }) {
  const age = ageFrom(person.dob);
  const items: [string, string][] = [
    ["Age", age !== null ? String(age) : "—"],
    ["Sun", chart?.sun ?? "—"],
    ["Moon", chart?.moon ?? "—"],
    ["Rising", chart?.rising ?? "—"],
    ["MBTI", person.mbti || "—"],
    [
      "Enneagram",
      person.enneagramType
        ? `${person.enneagramType}${person.enneagramWing ? `w${person.enneagramWing}` : ""}`
        : "—",
    ],
    ["Attachment", person.attachment || "—"],
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-border bg-card/50 px-3 py-2.5">
          <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">{k}</p>
          <p className="mt-0.5 truncate font-display text-lg text-foreground">{v}</p>
        </div>
      ))}
    </div>
  );
}

function DossierView({
  dossier,
  person,
  locked = false,
}: {
  dossier: Dossier;
  person?: PersonInput;
  locked?: boolean;
}) {
  const preview = dossier.synthesis.slice(0, 420);
  return (
    <div className="mt-8 space-y-6">
      <div className="panel p-6 sm:p-8">
        <p className="tracking-cosmic text-[0.65rem] text-primary/80">Synthesis</p>
        <h3 className="mt-2 text-3xl text-gold">{dossier.headline}</h3>
        <p className="mt-5 whitespace-pre-line text-[0.95rem] leading-relaxed text-foreground/90">
          {locked ? `${preview}…` : dossier.synthesis}
        </p>
        {dossier.dominantTraits.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {dossier.dominantTraits.map((t) => (
              <span
                key={t}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {person?.bigFive ? (
          <div className="mt-8 space-y-2">
            <p className="mb-3 font-display text-xl">Big Five</p>
            {Object.entries(person.bigFive).map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={100} caption={`${v}%`} tone="accent" />
            ))}
          </div>
        ) : null}
      </div>

      {locked ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {dossier.sections.map((s) => (
              <article key={s.title} className="panel p-6">
                <h4 className="font-display text-2xl text-foreground">🔒 {s.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.body.slice(0, 110)}…
                </p>
              </article>
            ))}
          </div>
          <UnlockCard
            title="You've only seen the surface"
            note="Your full dossier connects these patterns into one personalized interpretation — the complete synthesis, every deep-dive section, and your full natal chart."
          />
        </div>
      ) : (
      
        <div className="grid gap-4 sm:grid-cols-2">
          {dossier.sections.map((s) => (
            <article key={s.title} className="panel p-6">
              <h4 className="font-display text-2xl text-foreground">{s.title}</h4>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportPage() {
  const session = useSession();
  const unlocked = useUnlocked();
  const locked = !unlocked;
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"p1" | "p2" | "synastry">("p1");
  const started = useRef(false);

  const run = useCallback(async () => {
    const s = getSession();
    setStatus("running");
    setError(null);
    try {
      setStep(0);
      const chart1 =
        s.p1.dob && s.p1.birthPlace
          ? await computeNatalChart({
              data: { date: s.p1.dob, time: s.p1.birthTime, place: s.p1.birthPlace },
            })
          : undefined;
      setStep(1);
      const chart2 =
        s.p2?.dob && s.p2.birthPlace
          ? await computeNatalChart({
              data: { date: s.p2.dob, time: s.p2.birthTime, place: s.p2.birthPlace },
            })
          : undefined;
      setSession((prev) => ({ ...prev, charts: { p1: chart1, p2: chart2 } }));

      setStep(2);
      const d1 = buildDossier(s.p1, chart1);
      const d2 = s.p2 ? buildDossier(s.p2, chart2) : undefined;

      let syn: Dossier | undefined;
      if (s.p2) {
        setStep(3);
        syn = buildSynastry(s.p1, chart1, s.p2, chart2);
      }
      setStep(4);
      setSession((prev) => ({ ...prev, dossier: { p1: d1, p2: d2, synastry: syn } }));
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong generating your dossier.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const s = getSession();
    if (s.dossier?.p1) {
      setStatus("done");
      return;
    }
    void run();
  }, [run]);

  const chart1 = session.charts?.p1;
  const chart2 = session.charts?.p2;
  const d1 = session.dossier?.p1;
  const d2 = session.dossier?.p2;
  const syn = session.dossier?.synastry;
  const hasP2 = Boolean(session.p2);

  return (
    <main className="relative min-h-screen">
      <StarField count={60} />
      <div className="relative mx-auto max-w-5xl px-5 py-16">
        <Link to="/input" className="text-xs text-muted-foreground hover:text-primary">
          ← Edit details
        </Link>

        <div className="mt-8">
          <SectionTitle kicker="Cosmic Dossier">
            {session.p1.name || "Your dossier"}
          </SectionTitle>
          <IdentityStrip person={session.p1} chart={chart1} />
        </div>

        {status === "running" ? (
          <div className="panel mt-10 p-10 text-center">
            <p className="animate-twinkle font-display text-3xl text-gold">
              {STEPS[step] ?? "Working"}…
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Real ephemeris math, then the cross-sectional synthesis engine reads every system
              against the others. No AI, no API keys, nothing leaves your browser.
            </p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="panel mt-10 p-8">
            <p className="font-display text-2xl text-destructive">Couldn't finish the dossier</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CButton onClick={() => void run()}>Try again</CButton>
              <GoldLink to="/input" className="bg-none">
                Edit details
              </GoldLink>
            </div>
          </div>
        ) : null}

        {status === "done" && d1 ? (
          <>
            <div className="mt-10 flex flex-wrap gap-2">
              {(
                [
                  ["p1", session.p1.name || "Person 1"],
                  ...(hasP2
                    ? ([
                        ["p2", session.p2?.name || "Person 2"],
                        ["synastry", "❤️ Synastry"],
                      ] as const)
                    : []),
                ] as [typeof tab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded-full border px-4 py-2 text-xs transition-colors ${
                    tab === key
                      ? "border-primary/70 bg-primary/10 text-foreground"
                      : "border-border bg-card/50 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "p1" ? (
              <div className="animate-drift-in mt-6 space-y-6">
                {chart1 ? (
                  <ChartPanel chart={chart1} name={session.p1.name || "Person 1"} locked={locked} />
                ) : (
                  <div className="panel p-6 text-sm text-muted-foreground">
                    No natal chart — birth date, time and city were left blank. The psychological
                    sections below are complete; add birth details any time to unlock the astrology
                    layer.
                  </div>
                )}
                <DossierView dossier={d1} person={session.p1} locked={locked} />
              </div>
            ) : null}

            {tab === "p2" && session.p2 ? (
              <div className="animate-drift-in mt-6 space-y-6">
                {chart2 ? (
                  <ChartPanel chart={chart2} name={session.p2.name || "Person 2"} locked={locked} />
                ) : null}
                {d2 ? <DossierView dossier={d2} person={session.p2} locked={locked} /> : null}
              </div>
            ) : null}

            {tab === "synastry" ? (
              syn ? (
                <div className="animate-drift-in mt-6">
                  {locked ? (
                    <LockedBlock title="Synastry is part of the full dossier">
                      <DossierView dossier={syn} />
                    </LockedBlock>
                  ) : (
                    <DossierView dossier={syn} />
                  )}
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">
                  Add a second person's birth details to unlock synastry.
                </p>
              )
            ) : null}

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <CButton
                disabled={locked}
                title={locked ? "Unlock the full dossier to export a PDF" : undefined}
                onClick={() =>
                  void downloadDossierPdf({
                    person: session.p1,
                    chart: chart1,
                    dossier: d1,
                    synastry: syn,
                    partner: session.p2,
                  })
                }
              >
                Download PDF
              </CButton>
              <CButton variant="outline" onClick={() => void run()}>
                Regenerate
              </CButton>
              {locked ? (
                <span className="text-xs text-muted-foreground">
                  PDF export unlocks with the full dossier.
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">
                Astrology here is symbolic language; the psychology sections are self-report
                estimates.
              </span>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
