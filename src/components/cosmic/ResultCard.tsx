import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CButton } from "@/components/cosmic/ui";
import type { Dossier } from "@/lib/session";

function firstSentence(text: string, max = 140) {
  const match = text.match(/^.*?[.!?](\s|$)/);
  const sentence = match ? match[0].trim() : text.slice(0, max);
  return sentence.length > max ? `${sentence.slice(0, max)}…` : sentence;
}

export function ResultCard({ dossier }: { dossier: Dossier }) {
  const [shared, setShared] = useState<"idle" | "shared" | "copied" | "unsupported">("idle");
  const traits = dossier.dominantTraits.slice(0, 5);
  const tagline = firstSentence(dossier.synthesis);

  const handleShare = async () => {
    const shareData = {
      title: "Cosmic Dossier",
      text: `My Cosmic Dossier archetype: ${dossier.headline}. ${tagline}`,
      url: "https://cosmicdossier.com",
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShared("shared");
      } catch {
        // user canceled the share sheet, do nothing
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setShared("copied");
    } else {
      setShared("unsupported");
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="panel aspect-square flex flex-col justify-between border-primary/40 p-6 text-center sm:p-8">
        <p className="tracking-cosmic text-[0.65rem] text-primary/80">COSMIC DOSSIER</p>
        <div>
          <p className="tracking-cosmic text-[0.6rem] text-muted-foreground">YOUR ARCHETYPE</p>
          <h3 className="mt-2 font-display text-3xl leading-tight text-gold">{dossier.headline}</h3>
          <p className="mt-4 text-sm italic leading-relaxed text-foreground/80">“{tagline}”</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {traits.map((t) => (
            <span
              key={t}
              className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="text-[0.65rem] text-muted-foreground">cosmicdossier.com</p>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-3">
          <CButton onClick={() => void handleShare()}>Share My Result</CButton>
          <Link
            to="/input"
            className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground hover:border-primary/40"
          >
            Take It Again
          </Link>
        </div>
        {shared === "shared" ? <p className="text-xs text-muted-foreground">Shared!</p> : null}
        {shared === "copied" ? (
          <p className="text-xs text-muted-foreground">Link copied — paste it anywhere.</p>
        ) : null}
        {shared === "unsupported" ? (
          <p className="text-xs text-muted-foreground">Screenshot this card to share it.</p>
        ) : null}
      </div>
    </div>
  );
}
