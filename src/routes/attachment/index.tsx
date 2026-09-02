import { createFileRoute, Link } from "@tanstack/react-router";
import { StarField } from "@/components/cosmic/StarField";
import { SectionTitle } from "@/components/cosmic/ui";
import { ATTACHMENT_STYLES } from "@/lib/attachment-styles";

export const Route = createFileRoute("/attachment/")({
  head: () => ({
    meta: [
      { title: "Attachment Theory — Cosmic Dossier" },
      {
        name: "description",
        content:
          "A deep, evidence-informed guide to attachment theory — how secure, anxious, dismissive avoidant and fearful-avoidant styles develop and show up in relationships.",
      },
      { property: "og:title", content: "Attachment Theory — Cosmic Dossier" },
      {
        property: "og:description",
        content: "How each attachment style develops and shows up in real relationships, with a path toward healing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttachmentLanding,
});

function AttachmentLanding() {
  return (
    <main className="relative min-h-screen">
      <StarField count={45} />
      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-20">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
          ← Cosmic Dossier
        </Link>

        <div className="mt-10 max-w-3xl">
          <SectionTitle kicker="The Dossier Files">Attachment Theory</SectionTitle>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Attachment theory describes the patterns we develop, starting in early childhood, for
            seeking closeness and handling its absence — patterns that carry forward, often
            unconsciously, into adult friendships, family relationships, work dynamics and romantic
            partnerships.
          </p>
        </div>

        <div className="panel mt-8 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-gold">Where the theory comes from</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            British psychiatrist John Bowlby first proposed attachment theory in the 1950s,
            arguing that infants have an evolved need for proximity to a caregiver, not just for
            food and safety. Developmental psychologist Mary Ainsworth tested this directly in the
            1970s with the "Strange Situation" — observing how infants responded to a caregiver
            leaving and returning — and from those responses identified the original secure,
            anxious and avoidant categories. Mary Main and Judith Solomon later identified a
            fourth pattern, fearful-avoidant (or disorganized) attachment, in the mid-1980s. In
            1987, Cindy Hazan and Phillip Shaver extended the framework from infant-caregiver bonds
            into adult romantic relationships, and it's been a major thread in relationship
            research ever since.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            This section is educational, not a diagnostic tool. Attachment style exists on a
            spectrum, can differ somewhat across relationships, and can shift over time — especially
            through a securely attached relationship or through therapy. If any of this resonates
            strongly, a conversation with a therapist is a genuinely good next step, not just a
            fallback option.
          </p>
        </div>

        <section className="mt-12">
          <div className="flex items-center gap-3 text-xs text-primary/80">
            <span className="tracking-cosmic">THE FOUR STYLES</span>
            <span className="h-px flex-1 bg-primary/20" />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {ATTACHMENT_STYLES.map((style) => (
              <Link
                key={style.slug}
                to="/attachment/$slug"
                params={{ slug: style.slug }}
                className="panel group p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <h3 className="font-display text-xl text-foreground transition-colors group-hover:text-gold">
                  {style.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{style.tagline}</p>
                <span className="mt-4 inline-block text-xs text-primary">Read more →</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="panel mt-12 p-6 text-center sm:p-8">
          <p className="font-display text-xl text-foreground">Not sure which one describes you?</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Cosmic Dossier includes a short attachment assessment as part of your full personality
            dossier.
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
