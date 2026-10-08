/** Hand-drawn style divider: line · leaf · diamond · leaf · line */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 20" fill="none" className={className} aria-hidden>
      <path d="M2 10h66" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M132 10h66" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M74 10c6-6 12-6 18 0-6 6-12 6-18 0Z" stroke="currentColor" strokeWidth="0.8" />
      <path d="M126 10c-6-6-12-6-18 0 6 6 12 6 18 0Z" stroke="currentColor" strokeWidth="0.8" />
      <path d="M100 4l5 6-5 6-5-6 5-6Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
