/** Shared SVG gradient defs for stroke/fill icons across the app */
export function GlobalGradientDefs() {
  return (
    <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden>
      <defs>
        <linearGradient
          id="cutflow-brand-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#fb0302" />
          <stop offset="50%" stopColor="#fd8b0c" />
          <stop offset="100%" stopColor="#fee51b" />
        </linearGradient>
      </defs>
    </svg>
  );
}
