type ArtProps = { theme: string; className?: string };

const THEMES: Record
  string,
  { bg: [string, string]; blobs: { cx: number; cy: number; r: number; color: string; opacity: number }[] }
> = {
  "fractured-red": {
    bg: ["#1a0505", "#2b0a0a"],
    blobs: [
      { cx: 30, cy: 40, r: 60, color: "#7a1414", opacity: 0.55 },
      { cx: 140, cy: 90, r: 40, color: "#c23b3b", opacity: 0.4 },
      { cx: 90, cy: 150, r: 70, color: "#4a0d0d", opacity: 0.6 },
      { cx: 170, cy: 30, r: 25, color: "#e85c5c", opacity: 0.3 },
    ],
  },
  "empty-blue": {
    bg: ["#050912", "#0a1220"],
    blobs: [
      { cx: 100, cy: 100, r: 90, color: "#13233d", opacity: 0.6 },
      { cx: 60, cy: 50, r: 30, color: "#2c4a72", opacity: 0.25 },
    ],
  },
  "swirl-violet": {
    bg: ["#120a1a", "#1e1030"],
    blobs: [
      { cx: 50, cy: 60, r: 50, color: "#5b2e8f", opacity: 0.5 },
      { cx: 150, cy: 50, r: 45, color: "#8c4fd1", opacity: 0.35 },
      { cx: 100, cy: 150, r: 60, color: "#3a1a5c", opacity: 0.5 },
      { cx: 40, cy: 160, r: 20, color: "#c084f5", opacity: 0.3 },
    ],
  },
  "jagged-orange": {
    bg: ["#1a0f02", "#2b1804"],
    blobs: [
      { cx: 40, cy: 30, r: 35, color: "#c9611a", opacity: 0.5 },
      { cx: 150, cy: 60, r: 55, color: "#8a3d0a", opacity: 0.55 },
      { cx: 100, cy: 160, r: 40, color: "#f0913f", opacity: 0.3 },
      { cx: 170, cy: 150, r: 25, color: "#5c2705", opacity: 0.6 },
    ],
  },
  "flux-crimson": {
    bg: ["#1a0510", "#2b0a1c"],
    blobs: [
      { cx: 60, cy: 40, r: 45, color: "#a11d52", opacity: 0.55 },
      { cx: 140, cy: 80, r: 60, color: "#5c0d2e", opacity: 0.5 },
      { cx: 90, cy: 150, r: 35, color: "#e0508a", opacity: 0.3 },
      { cx: 30, cy: 130, r: 25, color: "#780f3d", opacity: 0.45 },
    ],
  },
  "spotlight-gold": {
    bg: ["#1a1405", "#2b220a"],
    blobs: [
      { cx: 100, cy: 90, r: 80, color: "#c9a227", opacity: 0.5 },
      { cx: 100, cy: 90, r: 40, color: "#f5d97a", opacity: 0.4 },
      { cx: 40, cy: 40, r: 20, color: "#8a6d10", opacity: 0.4 },
    ],
  },
  "mirror-gold": {
    bg: ["#151005", "#241c08"],
    blobs: [
      { cx: 70, cy: 60, r: 55, color: "#d4af37", opacity: 0.45 },
      { cx: 140, cy: 130, r: 55, color: "#d4af37", opacity: 0.45 },
      { cx: 100, cy: 100, r: 15, color: "#fff2c2", opacity: 0.5 },
    ],
  },
  "recede-grey": {
    bg: ["#0d0d0f", "#181819"],
    blobs: [
      { cx: 60, cy: 100, r: 50, color: "#3a3a3d", opacity: 0.5 },
      { cx: 140, cy: 100, r: 30, color: "#5a5a5e", opacity: 0.3 },
    ],
  },
  "vine-teal": {
    bg: ["#04120f", "#081f1a"],
    blobs: [
      { cx: 50, cy: 50, r: 40, color: "#0f6b5c", opacity: 0.5 },
      { cx: 130, cy: 80, r: 55, color: "#158a76", opacity: 0.4 },
      { cx: 90, cy: 160, r: 35, color: "#0a4038", opacity: 0.55 },
      { cx: 160, cy: 160, r: 20, color: "#3fd6b8", opacity: 0.25 },
    ],
  },
  "grid-slate": {
    bg: ["#0c0f14", "#161b24"],
    blobs: [
      { cx: 100, cy: 100, r: 70, color: "#2e3a4d", opacity: 0.5 },
      { cx: 50, cy: 40, r: 20, color: "#4a5b73", opacity: 0.3 },
      { cx: 150, cy: 160, r: 20, color: "#4a5b73", opacity: 0.3 },
    ],
  },
  "mosaic-multi": {
    bg: ["#0f0a14", "#1c1220"],
    blobs: [
      { cx: 50, cy: 50, r: 35, color: "#a13d6b", opacity: 0.4 },
      { cx: 140, cy: 50, r: 35, color: "#3d78a1", opacity: 0.4 },
      { cx: 50, cy: 150, r: 35, color: "#3da157", opacity: 0.4 },
      { cx: 140, cy: 150, r: 35, color: "#a19d3d", opacity: 0.4 },
      { cx: 100, cy: 100, r: 25, color: "#e8d9c0", opacity: 0.3 },
    ],
  },
};

export function PDArt({ theme, className }: ArtProps) {
  const t = THEMES[theme] ?? THEMES["grid-slate"];
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Abstract art"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`grad-${theme}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={t.bg[0]} />
          <stop offset="100%" stopColor={t.bg[1]} />
        </linearGradient>
        <filter id={`blur-${theme}`}>
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <rect width="200" height="200" fill={`url(#grad-${theme})`} />
      <g filter={`url(#blur-${theme})`}>
        {t.blobs.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={b.color} opacity={b.opacity} />
        ))}
      </g>
    </svg>
  );
}
