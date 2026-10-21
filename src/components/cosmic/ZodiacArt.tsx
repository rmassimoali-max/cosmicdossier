import { useId } from "react";
import { SIGN_GLYPH } from "@/lib/astro";
import { signBySlug, type ZodiacElement } from "@/lib/zodiac-signs";

/** Element palettes for decorative art only (dark base, two glow tones, star tone). */
const PALETTE: Record<ZodiacElement, { base: string; glowA: string; glowB: string; star: string; line: string }> = {
  Fire: { base: "#140806", glowA: "#d97a1f", glowB: "#8a1c14", star: "#ffd9a0", line: "#f0a35a" },
  Earth: { base: "#0b0f08", glowA: "#5d7a3a", glowB: "#7a5230", star: "#e6dcb8", line: "#a7b47a" },
  Air: { base: "#0a0c14", glowA: "#a9bcd8", glowB: "#8a74c4", star: "#eef2ff", line: "#c4cff0" },
  Water: { base: "#03090f", glowA: "#14707a", glowB: "#1a2a66", star: "#cdeff2", line: "#6cc3cc" },
};

type Motif = { stars: [number, number, number][]; lines: [number, number][] };

/** Hand-authored, stylized star motifs in a 100x100 space (not astronomical charts). */
const MOTIFS: Record<string, Motif> = {
  aries: { stars: [[12, 40, 1.6], [30, 30, 2.2], [48, 28, 1.4], [64, 36, 2.6], [76, 52, 1.5], [70, 70, 1.2], [56, 60, 1.3]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6]] },
  taurus: { stars: [[10, 20, 1.4], [30, 38, 1.6], [46, 50, 2.8], [58, 44, 1.5], [52, 62, 1.6], [70, 28, 1.8], [80, 76, 1.4], [38, 70, 1.2]], lines: [[0, 1], [1, 2], [2, 3], [3, 5], [2, 4], [4, 6], [4, 7]] },
  gemini: { stars: [[24, 14, 2.4], [40, 16, 2.2], [24, 40, 1.4], [42, 42, 1.5], [22, 66, 1.3], [46, 68, 1.6], [16, 86, 1.2], [56, 88, 1.3]], lines: [[0, 2], [2, 4], [4, 6], [1, 3], [3, 5], [5, 7], [2, 3]] },
  cancer: { stars: [[50, 48, 1.4], [34, 22, 1.8], [62, 30, 1.3], [28, 76, 1.6], [70, 72, 2.0], [82, 86, 1.2]], lines: [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5]] },
  leo: { stars: [[22, 70, 2.6], [38, 60, 1.5], [46, 40, 1.8], [58, 26, 1.4], [72, 30, 1.6], [76, 46, 1.3], [66, 62, 1.7], [86, 76, 1.9]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 2], [1, 6], [6, 7]] },
  virgo: { stars: [[14, 24, 1.4], [28, 34, 1.6], [42, 30, 1.3], [50, 46, 1.8], [36, 58, 1.4], [62, 62, 2.6], [78, 54, 1.3], [74, 82, 1.5], [52, 84, 1.2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [5, 7], [5, 8]] },
  libra: { stars: [[50, 20, 2.0], [28, 40, 2.2], [72, 40, 2.0], [22, 66, 1.4], [78, 70, 1.4], [50, 54, 1.2]], lines: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [1, 5], [5, 2]] },
  scorpio: { stars: [[80, 16, 1.4], [74, 26, 1.6], [64, 34, 2.8], [54, 46, 1.5], [46, 60, 1.4], [38, 74, 1.5], [24, 80, 1.3], [16, 70, 1.6], [20, 58, 1.2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]] },
  sagittarius: { stars: [[20, 78, 1.4], [40, 64, 1.6], [52, 52, 2.0], [66, 40, 1.4], [82, 22, 2.2], [70, 64, 1.5], [44, 38, 1.3], [58, 76, 1.2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [2, 6], [5, 7], [1, 7]] },
  capricorn: { stars: [[16, 30, 1.8], [34, 42, 1.4], [52, 70, 2.0], [70, 62, 1.4], [86, 36, 2.2], [62, 40, 1.3], [40, 28, 1.2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]] },
  aquarius: { stars: [[12, 30, 1.4], [28, 22, 1.8], [42, 34, 1.3], [56, 24, 2.2], [66, 44, 1.4], [52, 60, 1.6], [70, 72, 1.3], [86, 64, 1.5], [38, 80, 1.2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [5, 8]] },
  pisces: { stars: [[14, 20, 1.6], [24, 32, 1.4], [34, 50, 1.3], [48, 72, 2.4], [64, 64, 1.3], [76, 56, 1.4], [86, 64, 1.6], [80, 76, 1.3], [16, 12, 1.2]], lines: [[8, 0], [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 5]] },
};

/** Static decorative backdrop unique to each sign. Use `variant="thumb"` for cards. */
export function ZodiacArt({ slug, variant = "page", className = "" }: { slug: string; variant?: "page" | "thumb"; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const sign = signBySlug(slug);
  const motif = MOTIFS[slug];
  if (!sign || !motif) return null;
  const p = PALETTE[sign.element];
  const thumb = variant === "thumb";
  // Page: motif sits upper-right; thumb: fills the card.
  const m = thumb ? { x: 50, y: 4, s: 0.5 } : { x: 26, y: 8, s: 0.5 };
  const glyphPos = thumb ? { x: 78, y: 92 } : { x: 64, y: 82 };

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 -z-0 overflow-hidden ${className}`}>
      <svg className={thumb ? "h-full w-full" : "h-[100svh] min-h-[560px] w-full"} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`a${uid}`} cx="78%" cy="22%" r="55%">
            <stop offset="0%" stopColor={p.glowA} stopOpacity={thumb ? 0.35 : 0.28} />
            <stop offset="100%" stopColor={p.glowA} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`b${uid}`} cx="15%" cy="85%" r="60%">
            <stop offset="0%" stopColor={p.glowB} stopOpacity={thumb ? 0.35 : 0.3} />
            <stop offset="100%" stopColor={p.glowB} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`s${uid}`}>
            <stop offset="0%" stopColor={p.star} stopOpacity="0.9" />
            <stop offset="100%" stopColor={p.star} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={p.base} opacity={thumb ? 0.55 : 0.7} />
        <rect width="100" height="100" fill={`url(#a${uid})`} />
        <rect width="100" height="100" fill={`url(#b${uid})`} />
        <text
          x={glyphPos.x}
          y={glyphPos.y}
          textAnchor="middle"
          fontSize={thumb ? 46 : 60}
          fill={p.star}
          opacity={0.06}
          fontFamily="serif"
        >
          {SIGN_GLYPH[sign.name]}
        </text>
        <g transform={`translate(${m.x} ${m.y}) scale(${m.s})`} opacity={thumb ? 0.75 : 0.55}>
          {motif.lines.map(([a, b], i) => {
            const sa = motif.stars[a];
            const sb = motif.stars[b];
            if (!sa || !sb) return null;
            return (
            <line
              key={i}
              x1={sa[0]}
              y1={sa[1]}
              x2={sb[0]}
              y2={sb[1]}
              stroke={p.line}
              strokeWidth={0.35}
              strokeOpacity={0.6}
            />
            );
          })}
          {motif.stars.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r * 2.4} fill={`url(#s${uid})`} opacity={0.5} />
              <circle cx={x} cy={y} r={r * 0.55} fill={p.star} />
            </g>
          ))}
        </g>
      </svg>
      {!thumb && <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/35 to-background/80" />}
    </div>
  );
}
