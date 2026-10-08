/**
 * A few petals drifting down the page. Pure CSS — no JavaScript cost.
 * Positions are fixed (not random) so server and browser render identically.
 * Hidden automatically for anyone with "reduce motion" turned on.
 */
const PETALS = [
  { left: "6%", delay: "0s", duration: "24s", size: 12, hue: "var(--color-blush-200)" },
  { left: "22%", delay: "-9s", duration: "28s", size: 9, hue: "var(--color-gold-200)" },
  { left: "41%", delay: "-4s", duration: "21s", size: 11, hue: "var(--color-blush-300)" },
  { left: "63%", delay: "-14s", duration: "26s", size: 8, hue: "var(--color-champagne-200)" },
  { left: "79%", delay: "-2s", duration: "23s", size: 13, hue: "var(--color-blush-200)" },
  { left: "92%", delay: "-18s", duration: "30s", size: 9, hue: "var(--color-gold-200)" },
];

export function Petals() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal absolute -top-6 block animate-petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 1.3,
            animationDelay: p.delay,
            animationDuration: p.duration,
            background: p.hue,
            borderRadius: "80% 0 80% 0",
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}
