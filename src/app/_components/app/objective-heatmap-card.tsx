import Link from "next/link";
import { BarbellIcon, BrainIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";

import { ActivityRings, ringColors } from "@/app/_components/app/activity-rings";
import { sampleDoneOn, type Goal, type Objective } from "@/app/_lib/app-sample";
import type { Locale } from "@/app/_lib/i18n";
import { cn } from "@/app/_lib/utils";

export type HeatmapLabels = {
  checkIn: string;
  /** The default period's name, e.g. "Últimos 30 días" */
  last30: string;
  /** The footer button to the objective's details */
  detail: string;
  /** e.g. "{month}: un punto por día" */
  monthHistory: string;
};

/**
 * An objective as a habit card, like a habit tracker's: tinted in its ring's
 * colour: its icon and title with the share of days with progress, the last 30
 * days or a chosen month as a calendar (a ring per day with its number,
 * filled by the share of key results done), and a footer pill with today's count, or a
 * link to check in on Today.
 */
export function ObjectiveHeatmapCard({
  objective,
  keyResults,
  href,
  month,
  lang,
  onDetail,
  labels,
}: {
  objective: Objective;
  keyResults: Goal[];
  /** A month of this year (0–11) to show day by day; the last 30 days if not set. */
  month?: number | null;
  lang: Locale;
  /** Opens the objective's details. */
  onDetail: () => void;
  /** Where to check in: the Today screen. */
  href: string;
  labels: HeatmapLabels;
}) {
  const color = ringColors[objective.kind];
  const Icon = objective.kind === "physical" ? BarbellIcon : BrainIcon;

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const mondayOf = (date: Date) => {
    const d = new Date(date);
    d.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return d;
  };

  // today from the key results' own state (as on the Today screen); past
  // days from the sample history
  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const share = (date: Date) => {
    const done = isToday(date)
      ? keyResults.filter((kr) => kr.doneToday).length
      : sampleDoneOn(keyResults, date).size;
    return keyResults.length ? done / keyResults.length : 0;
  };
  // the period: the chosen month, or the last 30 days up to today
  const isMonth = month !== null && month !== undefined;
  const first = isMonth
    ? new Date(today.getFullYear(), month, 1, 12)
    : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29, 12);
  const last = isMonth ? new Date(today.getFullYear(), month + 1, 0, 12) : today;

  // the days to draw, from the Monday before the period so each row is a
  // week; blank ("outside") before its first and after its last day, null
  // for days still ahead
  type Cell = number | null | "outside";
  const start = mondayOf(first);
  const weeks = Math.floor(Math.round((last.getTime() - start.getTime()) / 864e5) / 7) + 1;
  const days: Cell[] = Array.from({ length: weeks * 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (date < first || date > last) return "outside";
    return date > today ? null : share(date);
  });
  // weekday initials, Monday first (2026-01-05 is a Monday)
  const weekday = new Intl.DateTimeFormat(lang, { weekday: "narrow" });
  const weekdays = Array.from({ length: 7 }, (_, i) => weekday.format(new Date(2026, 0, 5 + i)));
  // the share of the period's days with any progress (days ahead don't count)
  const past = days.filter((d): d is number => typeof d === "number");
  const percent = past.length
    ? Math.round((past.filter((d) => d > 0).length / past.length) * 100)
    : 0;
  const periodName = isMonth
    ? new Intl.DateTimeFormat(lang, { month: "long" }).format(first)
    : labels.last30;
  const doneToday = Math.round(share(today) * keyResults.length);

  return (
    <li
      className="flex flex-col gap-3 rounded-2xl border p-3"
      style={{ backgroundColor: `${color}1a`, borderColor: `${color}33` }}
    >
      <div className="flex items-start gap-3">
        <h3 className="flex min-w-0 flex-1 items-start gap-2 leading-snug font-semibold">
          <Icon weight="fill" className="mt-0.5 size-5 shrink-0" style={{ color }} aria-hidden />
          <span className="line-clamp-2">{objective.title}</span>
        </h3>
        <p
          className="shrink-0 font-condensed text-3xl leading-none font-bold tabular-nums"
          style={{ color }}
        >
          {percent}%
        </p>
      </div>

      {/* the period as a full calendar: weekday letters, then a ring per day
          with its number inside, Monday first, filled by how much got done */}
      <div
        role="img"
        aria-label={labels.monthHistory.replace("{month}", periodName)}
        className="mt-auto grid grid-cols-7 gap-1.5"
      >
        {weekdays.map((d, i) => (
          <span
            key={`wd-${i}`}
            className="text-center font-condensed text-xs font-semibold text-neutral-500 uppercase"
          >
            {d}
          </span>
        ))}
        {days.map((value, i) => {
          if (value === "outside") return <span key={i} />;
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          return (
            <span key={i} className="relative flex items-center justify-center">
              {/* a ring per day, like the Today screen's: filled by the share done */}
              <ActivityRings
                rings={[{ value: value ?? 0, color }]}
                size={40}
                stroke={6}
                className={cn("h-auto w-full max-w-10", value === null && "opacity-40")}
              />
              <span
                className={cn(
                  "absolute font-condensed text-[11px] font-semibold tabular-nums",
                  isToday(date)
                    ? "text-white"
                    : value === null
                      ? "text-neutral-600"
                      : "text-neutral-300",
                )}
              >
                {date.getDate()}
              </span>
            </span>
          );
        })}
      </div>

      {/* footer: the details once something is done today, else a way to check in */}
      {doneToday > 0 ? (
        // something done today: a ghost button to the objective's details
        <button
          type="button"
          onClick={onDetail}
          aria-haspopup="dialog"
          className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-full font-condensed text-sm font-semibold tracking-wider uppercase transition-colors hover:bg-white/5"
          style={{ color }}
        >
          {labels.detail}
          <CaretRightIcon weight="bold" className="size-4" aria-hidden />
        </button>
      ) : (
        // 44pt tall (Apple HIG)
        <Link
          href={href}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-white font-condensed text-sm font-semibold tracking-wider text-neutral-950 uppercase transition-opacity hover:opacity-90"
        >
          {labels.checkIn}
        </Link>
      )}
    </li>
  );
}
