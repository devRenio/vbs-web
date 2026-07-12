/**
 * Minimal inline SVG icons (stroke-based, inherit currentColor).
 * Kept in one place so sizing/stroke stays consistent across the app.
 */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

/** @param {{ className?: string, spinning?: boolean }} props */
export function RefreshIcon({ className = "h-5 w-5", spinning = false }) {
  return (
    <svg
      {...base}
      className={`${className} ${spinning ? "animate-spin" : ""}`}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

/** @param {{ className?: string }} props */
export function ChevronLeftIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

/** @param {{ className?: string }} props */
export function ChevronRightIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/** @param {{ className?: string }} props */
export function CheckIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** @param {{ className?: string }} props */
export function UserIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
