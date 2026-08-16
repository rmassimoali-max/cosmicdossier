import type { ReactNode } from "react";
import { StripeUnlockButton } from "@/components/cosmic/StripeCheckout";
/** Blurs gated content and floats an unlock card over it. */
export function LockedBlock({
  children,
  title = "Locked in the full dossier",
  note,
}: {
  children: ReactNode;
  title?: string;
  note?: string | undefined;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div aria-hidden className="pointer-events-none select-none blur-[7px] saturate-50 opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/55 p-6">
        <UnlockCard title={title} note={note} />
      </div>
    </div>
  );
}
export function UnlockCard({
  title = "You've seen the pattern. Now see the whole picture.",
  note,
}: {
  title?: string;
  note?: string | undefined;
}) {
  return (
    <div className="panel max-w-md p-6 text-center sm:p-8">
      <p className="tracking-cosmic text-[0.65rem] text-primary/80">Full dossier</p>
      <h3 className="mt-2 font-display text-2xl text-gold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {note ??
          "Your full dossier connects your personality traits, attachment style, typology and astrological profile into one personalized interpretation — not just a few extra paragraphs."}
      </p>
      <ul className="mx-auto mt-5 space-y-1.5 text-left text-xs text-muted-foreground">
        {[
          "Complete cross-system synthesis narrative",
          "All deep-dive sections (chart, typology, growth edges)",
          "Full natal chart: placements, houses, aspects",
          "Relationship synastry report",
          "Printable PDF dossier",
        ].map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-primary/80">✦</span>
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col items-center gap-2">
        <StripeUnlockButton />
        <p className="text-[0.65rem] text-muted-foreground">
          $4 one-time · no subscription · instant access
        </p>
      </div>
    </div>
  );
}
export function LockedInline({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="pointer-events-none select-none blur-[5px] opacity-60">
      {children}
    </span>
  );
}
