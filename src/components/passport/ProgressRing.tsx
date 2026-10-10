const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  visited: number;
  total: number;
}

export function ProgressRing({ visited, total }: ProgressRingProps) {
  const ratio = total > 0 ? visited / total : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className="relative size-28 shrink-0">
      <svg
        role="img"
        aria-label={`${visited} of ${total} post offices stamped`}
        viewBox="0 0 112 112"
        fill="none"
        className="size-full"
      >
        <circle cx="56" cy="56" r={RADIUS} stroke="#f1e6d0" strokeWidth="12" />
        <circle
          cx="56"
          cy="56"
          r={RADIUS}
          stroke="#17794b"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
          transform="rotate(-90 56 56)"
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center whitespace-nowrap font-display text-2xl font-bold leading-none">
        {percent}%
      </div>
    </div>
  );
}
