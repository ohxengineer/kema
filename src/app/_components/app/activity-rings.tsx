import { cn } from "@/app/_lib/utils";

/** Ring colours, by goal kind: warm for the body, cool for the mind. */
export const ringColors = { physical: "#f43f5e", mental: "#38bdf8" } as const;

export type Ring = { value: number; color: string };

/**
 * Concentric progress rings, outermost first, like the Fitness app's
 * activity rings: each a faint track with a round-capped arc over it.
 */
export function ActivityRings({
  rings,
  size,
  stroke,
  gap = 2,
  animate = false,
  className,
}: {
  rings: Ring[];
  /** Outer diameter, in px. */
  size: number;
  /** Ring thickness, in px. */
  stroke: number;
  /** Space between rings, in px. */
  gap?: number;
  /** Ease the arcs when values change (the big rings, not the week row). */
  animate?: boolean;
  className?: string;
}) {
  const c = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      className={cn("shrink-0 -rotate-90", className)}
    >
      {rings.map(({ value, color }, i) => {
        const r = c - stroke / 2 - i * (stroke + gap);
        const share = Math.min(Math.max(value, 0), 1);
        return (
          <g key={i} fill="none" stroke={color} strokeWidth={stroke}>
            <circle cx={c} cy={c} r={r} strokeOpacity={0.2} />
            {/* no arc at 0: a round cap alone would still draw a dot */}
            {share > 0 && (
              <circle
                cx={c}
                cy={c}
                r={r}
                pathLength={100}
                strokeDasharray={`${share * 100} 100`}
                strokeLinecap="round"
                className={cn(animate && "transition-[stroke-dasharray] duration-500 ease-out")}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
