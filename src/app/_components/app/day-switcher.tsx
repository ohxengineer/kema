"use client";

import { useState } from "react";
import { CalendarDotsIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { DayButton } from "react-day-picker";
import { enUS, es } from "react-day-picker/locale";

import { ActivityRings, type Ring } from "@/app/_components/app/activity-rings";
import { Button } from "@/app/_components/ui/button";
import { Calendar, CalendarDayButton } from "@/app/_components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import type { Locale } from "@/app/_lib/i18n";
import { cn } from "@/app/_lib/utils";
import { useSwipe } from "@/app/_hooks/use-swipe";
import { StreakPill, type Streak, type StreakLabels } from "@/app/_components/app/streak-pill";
import { pill, titlePill } from "@/app/_components/app/pill";

export type DaySwitcherLabels = {
  previous: string;
  next: string;
  pick: string;
  /** e.g. "Semana {week}" */
  week: string;
};

const calendarLocales = { es, en: enUS } as const;
const DAY = 24 * 60 * 60 * 1000;

/** The calendar day `offset` days from today (0 today, -1 yesterday). */
export function dayFrom(offset: number) {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  return day;
}

/** The ISO 8601 week number: weeks start on Monday, week 1 holds the year's first Thursday. */
function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / DAY + 1) / 7);
}

/** How many days `date` is from today: 0 today, -1 yesterday. */
function offsetOf(date: Date) {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((start(date) - start(new Date())) / DAY);
}

/**
 * [🔥 12] … ‹ [ DOM 15 NOV ] › … [📅 W 46]: the streak, the day being looked
 * at (stepped a day at a time), and the week number opening a calendar. The
 * calendar jumps to any past day, drawn like the week row: each day its
 * number over its rings. Today is the last day: goals can't be ticked off
 * ahead of time. Every tap target is at least 44pt (Apple HIG).
 */
export function DaySwitcher({
  lang,
  offset,
  onChange,
  ringsFor,
  streak,
  streakLabels,
  labels,
}: {
  lang: Locale;
  offset: number;
  onChange: (offset: number) => void;
  /** A day's rings, by offset from today. */
  ringsFor: (offset: number) => Ring[];
  streak: Streak;
  streakLabels: StreakLabels;
  labels: DaySwitcherLabels;
}) {
  const [open, setOpen] = useState(false);
  const swipeDay = useSwipe(
    () => onChange(offset - 1),
    () => offset < 0 && onChange(offset + 1),
  );
  const selected = dayFrom(offset);
  const letter = new Intl.DateTimeFormat(lang, { weekday: "narrow" });

  // a calendar day as in the week row: the number (white when selected,
  // rose for today) over the day's rings
  const RingDay = ({ day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) => (
    <CalendarDayButton
      day={day}
      modifiers={modifiers}
      {...props}
      className="aspect-auto h-auto gap-1 py-1 data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-foreground"
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full text-xs !opacity-100",
          modifiers.selected
            ? "bg-white font-semibold text-neutral-950"
            : modifiers.today && "font-semibold text-rose-500",
        )}
      >
        {day.date.getDate()}
      </span>
      <ActivityRings rings={ringsFor(offsetOf(day.date))} size={28} stroke={4} gap={1} />
    </CalendarDayButton>
  );
  const week = isoWeek(selected);
  const date = new Intl.DateTimeFormat(lang, {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(selected)
    .replaceAll(".", "")
    .replaceAll(",", "");

  const chevron =
    "flex h-11 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 min-[400px]:w-11 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
      <StreakPill streak={streak} labels={streakLabels} className="justify-self-start" />

      {/* swipe anywhere on the chevrons and date to step a day: left for the
          next, right for the previous */}
      <div className="flex touch-pan-y items-center select-none" {...swipeDay}>
        <button
          type="button"
          onClick={() => onChange(offset - 1)}
          aria-label={labels.previous}
          className={chevron}
        >
          <CaretLeftIcon weight="bold" className="size-4" aria-hidden />
        </button>
        <p
          aria-live="polite"
          suppressHydrationWarning
          className={cn(titlePill, offset === 0 && "text-rose-500")}
        >
          {date}
        </p>
        <button
          type="button"
          onClick={() => onChange(offset + 1)}
          disabled={offset >= 0}
          aria-label={labels.next}
          className={chevron}
        >
          <CaretRightIcon weight="bold" className="size-4" aria-hidden />
        </button>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {/* a 44pt-tall tap target around a pill that matches the others */}
          <Button
            variant="ghost"
            aria-label={`${labels.pick} · ${labels.week.replace("{week}", String(week))}`}
            title={labels.pick}
            className="group h-11 justify-self-end rounded-full px-0 hover:bg-transparent dark:hover:bg-transparent"
          >
            <span
              suppressHydrationWarning
              className={cn(
                pill,
                "px-2.5 transition-colors group-hover:text-white group-data-[state=open]:text-rose-500 min-[400px]:px-3",
              )}
            >
              W {week}
              <CalendarDotsIcon weight="duotone" className="size-4.5" />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            required
            showOutsideDays={false}
            className="[--cell-size:--spacing(10)]"
            classNames={{
              day: "relative w-full p-0 text-center select-none",
              today: "",
              // month title in the app's label style: condensed, uppercase
              caption_label:
                "font-condensed text-sm font-semibold tracking-wider uppercase select-none",
            }}
            formatters={{ formatWeekdayName: (d) => letter.format(d) }}
            components={{ DayButton: RingDay }}
            selected={selected}
            defaultMonth={selected}
            onSelect={(day) => {
              onChange(offsetOf(day));
              setOpen(false);
            }}
            disabled={{ after: new Date() }}
            weekStartsOn={1}
            locale={calendarLocales[lang]}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
