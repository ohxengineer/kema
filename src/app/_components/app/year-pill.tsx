"use client";

import { useState } from "react";
import { CalendarIcon } from "@phosphor-icons/react";

import { ActivityRings, ringColors } from "@/app/_components/app/activity-rings";
import { pill } from "@/app/_components/app/pill";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/app/_components/ui/responsive-dialog";
import { sampleDoneOn, type Goal } from "@/app/_lib/app-sample";
import type { Locale } from "@/app/_lib/i18n";
import { cn } from "@/app/_lib/utils";

export type YearLabels = {
  open: string;
  /** e.g. "Replay ’{yy}": the year's last two digits */
  title: string;
  description: string;
  fullDays: string;
  completion: string;
  close: string;
};

/**
 * [2026 📅]: the year, as a pill that opens the year at a glance, month by month: a
 * small calendar each (Monday first) with a day's rings, Físico outside and
 * Mental inside, filled by the share done (today from the goals' own state, past days from the sample
 * history), with the count of complete days and the overall completion.
 */
export function YearPill({
  lang,
  goals,
  labels,
}: {
  lang: Locale;
  goals: Goal[];
  labels: YearLabels;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const year = today.getFullYear();
  const month = new Intl.DateTimeFormat(lang, { month: "short" });

  const shareOf = (list: Goal[], date: Date) => {
    const done =
      date.toDateString() === today.toDateString()
        ? list.filter((g) => g.doneToday).length
        : sampleDoneOn(list, date).size;
    return list.length ? done / list.length : 0;
  };
  const kinds = ["physical", "mental"] as const;
  const byKind = {
    physical: goals.filter((g) => g.kind === "physical"),
    mental: goals.filter((g) => g.kind === "mental"),
  };

  // a row per month: per day, the share done of each kind (its rings) and
  // overall; null for days still ahead
  const months = Array.from({ length: 12 }, (_, m) => {
    const days = new Date(year, m + 1, 0).getDate();
    return Array.from({ length: days }, (_, d) => {
      const date = new Date(year, m, d + 1, 12);
      if (date > today) return null;
      return {
        rings: kinds.map((k) => ({ value: shareOf(byKind[k], date), color: ringColors[k] })),
        all: shareOf(goals, date),
      };
    });
  });
  const past = months.flat().flatMap((v) => (v ? [v.all] : []));
  const fullDays = past.filter((v) => v === 1).length;
  const completion = past.length ? past.reduce((a, b) => a + b, 0) / past.length : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={labels.open}
        className="group flex h-11 items-center"
      >
        <span
          suppressHydrationWarning
          className={cn(pill, "px-2.5 transition-colors group-hover:text-white min-[400px]:px-3")}
        >
          {year}
          <CalendarIcon weight="duotone" className="size-4.5" aria-hidden />
        </span>
      </button>

      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent>
          <div className="mx-auto min-h-0 w-full max-w-md overflow-y-auto">
            <ResponsiveDialogHeader className="text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
              <ResponsiveDialogTitle className="text-2xl font-semibold tracking-tight">
                {labels.title.replace("{yy}", String(year).slice(-2))}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription className="sr-only">
                {labels.description}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>

            <dl className="grid grid-cols-2 gap-3 px-4 pb-4">
              {[
                { label: labels.fullDays, value: String(fullDays) },
                { label: labels.completion, value: `${Math.round(completion * 100)}%` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 rounded-xl border bg-neutral-900 p-4"
                >
                  <dd className="font-condensed text-3xl leading-none font-bold tabular-nums">
                    {value}
                  </dd>
                  <dt className="font-condensed text-xs text-neutral-400 uppercase">{label}</dt>
                </div>
              ))}
            </dl>

            <div
              role="img"
              aria-label={labels.title.replace("{yy}", String(year).slice(-2))}
              className="grid grid-cols-3 gap-x-4 gap-y-3 px-4 pb-6"
            >
              {months.map((days, m) => {
                // blank cells before the 1st, so days sit under their weekday (Monday first)
                const lead = (new Date(year, m, 1).getDay() + 6) % 7;
                return (
                  <div key={m} className="flex flex-col gap-1.5">
                    <span
                      className={cn(
                        "font-condensed text-xs font-semibold uppercase",
                        m === today.getMonth() ? "text-rose-500" : "text-neutral-400",
                      )}
                    >
                      {month.format(new Date(year, m, 1))}
                    </span>
                    <div className="grid grid-cols-7 gap-[2px]">
                      {Array.from({ length: lead }, (_, i) => (
                        <span key={`lead-${i}`} />
                      ))}
                      {days.map((value, d) => (
                        <ActivityRings
                          key={d}
                          rings={
                            value
                              ? value.rings
                              : kinds.map((k) => ({ value: 0, color: ringColors[k] }))
                          }
                          size={16}
                          stroke={2.5}
                          gap={0.5}
                          className={cn("size-auto w-full", !value && "opacity-30")}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
