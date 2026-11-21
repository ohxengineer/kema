"use client";

import { useState } from "react";
import { FireIcon, TrophyIcon } from "@phosphor-icons/react";

import { pill } from "@/app/_components/app/pill";
import { Button } from "@/app/_components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/app/_components/ui/responsive-dialog";
import { cn } from "@/app/_lib/utils";

/** Days in a row with every key result done: now, and the longest run. */
export type Streak = { current: number; best: number };

export type StreakLabels = {
  /** e.g. "Racha: {days} días" */
  aria: string;
  title: string;
  current: string;
  best: string;
  days: string;
  description: string;
  close: string;
};

/**
 * 🔥 12: the streak, as a pill that opens a drawer with the current and best
 * streaks and what keeps one going. A 44pt-tall tap target (Apple HIG).
 */
export function StreakPill({
  streak,
  labels,
  className,
}: {
  streak: Streak;
  labels: StreakLabels;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={labels.aria.replace("{days}", String(streak.current))}
        className={cn("group flex h-11 items-center", className)}
      >
        <span
          className={cn(pill, "px-2.5 transition-colors group-hover:text-white min-[400px]:px-3")}
        >
          <FireIcon weight="duotone" className="size-4.5 text-rose-500" aria-hidden />
          {streak.current}
        </span>
      </button>

      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent>
          <div className="mx-auto w-full max-w-md">
            <ResponsiveDialogHeader className="items-center text-center sm:text-center">
              <FireIcon weight="fill" className="size-14 text-rose-500" aria-hidden />
              <ResponsiveDialogTitle className="text-2xl font-semibold tracking-tight">
                {labels.title}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription className="text-balance">
                {labels.description}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>

            <dl className="grid grid-cols-2 gap-3 px-4">
              {[
                { label: labels.current, value: streak.current, Icon: FireIcon },
                { label: labels.best, value: streak.best, Icon: TrophyIcon },
              ].map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 rounded-xl border bg-neutral-900 p-4"
                >
                  <Icon weight="fill" className="size-5 text-rose-500" aria-hidden />
                  <dd className="font-condensed text-4xl leading-none font-bold tabular-nums">
                    {value}{" "}
                    <span className="font-condensed text-sm font-semibold text-neutral-400 uppercase">
                      {labels.days}
                    </span>
                  </dd>
                  <dt className="font-condensed text-xs text-neutral-400 uppercase">{label}</dt>
                </div>
              ))}
            </dl>

            <ResponsiveDialogFooter>
              <ResponsiveDialogClose asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-12 font-sans text-base font-semibold normal-case"
                >
                  {labels.close}
                </Button>
              </ResponsiveDialogClose>
            </ResponsiveDialogFooter>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
