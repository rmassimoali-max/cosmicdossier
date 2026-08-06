import { useMemo } from "react";

/** Decorative twinkling star layer. Purely presentational. */
export function StarField({ count = 90 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const r = seed / 233280;
        const r2 = ((i * 4241 + 7919) % 10007) / 10007;
        return {
          top: `${(r * 100).toFixed(2)}%`,
          left: `${(r2 * 100).toFixed(2)}%`,
          size: r2 > 0.9 ? 2.5 : 1.5,
          delay: `${(r * 4).toFixed(2)}s`,
        };
      }),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="animate-twinkle absolute rounded-full bg-foreground"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
