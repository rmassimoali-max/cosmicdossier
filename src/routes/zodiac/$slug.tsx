import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { GoldLink, SectionTitle } from "@/components/cosmic/ui";
import { SIGN_GLYPH } from "@/lib/astro";
import { signBySlug, signsByElement, signsByModality, type ZodiacSign } from "@/lib/zodiac-signs";

export const Route = createFileRoute("/zodiac/$slug")({
  loader: ({ params }) => {
    const sign = signBySlug(params.slug);
    if (!sign) throw notFound();
    return sign;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Sign not found — Cosmic Dossier" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} Sun Sign: Traits, Strengths & Relationships | Cosmic Dossier`;
    const desc = loaderData.overview.slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
    };
  },
  component: SignPage,
});

function SignLinks({ label, signs }: { label: string; signs: ZodiacSign[] }) {
  return (
    <div className="panel p-6">
      <h4 className="font-display text-xl text-gold">{label}</h4>
      <div className="mt-3 flex flex-wrap gap-2">
        {signs.map((s) => (
          <Link
            key={s.slug}
            to="/zodiac/$slug"
            params={{ slug: s.slug }}
            className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-foreground hover:text-gold"
          >
            {SIGN_GLYPH[s.name]} {s.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SignPage() {
  const sign = Route.useLoaderData();
  const sameEl = signsByElement(sign.element).filter((s) => s.slug !== sign.slug);
  const sameMod = signsByModality(sign.modality).filter((s) => s.slug !== sign.slug);

  return (
    <main className="relative min-h-screen">
      <StarField count={40} />
      <div className="relative mx-auto max-w-3xl px-5 py-16">
        <Link to="/zodiac" className="text-xs text-muted-foreground hover:text-primary">
          ← All 12 signs
        </Link>

        <div className="mt-8">
          <p className="text-5xl text-primary">{SIGN_GLYPH[sign.name]}</p>
          <SectionTitle kicker={`${sign.element} · ${sign.modality} · Ruled by ${sign.ruler}`}>
            {sign.name}
          </SectionTitle>
          <p className="-mt-2 text-xs text-muted-foreground">
            {sign.dates} (approximate — exact dates vary by year)
          </p>
          <p className="mt-4 text-lg italic text-foreground/80">"{sign.tagline}"</p>
        </div>

        <div className="panel mt-8 p-6 sm:p-8">
          <h4 className="font-display text-xl text-gold">Overview</h4>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-foreground/90">{sign.overview}</p>
          <h4 className="mt-6 font-display text-xl text-gold">Core traits</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {sign.coreTraits.map((t) => (
              <span key={t} className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-foreground">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="panel p-6">
            <h4 className="font-display text-xl text-gold">Strengths</h4>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {sign.strengths.map((s) => <li key={s}>✦ {s}</li>)}
            </ul>
          </div>
          <div className="panel p-6">
            <h4 className="font-display text-xl text-gold">Challenges</h4>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {sign.challenges.map((s) => <li key={s}>✦ {s}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="panel p-6">
            <h4 className="font-display text-xl text-gold">In relationships</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sign.inRelationships}</p>
          </div>
          <div className="panel p-6">
            <h4 className="font-display text-xl text-gold">At work</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sign.atWork}</p>
          </div>
          <SignLinks label={`Signs that share ${sign.element}`} signs={sameEl} />
          <SignLinks label={`Signs that share ${sign.modality} modality`} signs={sameMod} />
          <div className="panel p-6">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Astrology is a symbolic language with no accepted scientific mechanism. A Sun sign
              alone is a partial picture — your Moon, Rising and other placements matter just as much.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <GoldLink to="/input">Calculate your full natal chart</GoldLink>
        </div>
      </div>
    </main>
  );
}
