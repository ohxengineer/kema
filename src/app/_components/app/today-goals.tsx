"use client";

import { useState } from "react";
import { CheckIcon, FireIcon } from "@phosphor-icons/react";

import type { Goal } from "@/app/_lib/app-sample";
import type { Locale } from "@/app/_lib/i18n";
import { cn } from "@/app/_lib/utils";

type Labels = {
  eyebrow: string;
  title: string;
  summary: string;
  streak: string;
  days: string;
  allDone: string;
  kinds: { physical: string; mental: string };
};

/** Today: the date, how far along the day is, and the goals to tick off. */
export function TodayGoals({
  lang,
  goals,
  streak,
  labels,
}: {
  lang: Locale;
  goals: Goal[];
  streak: number;
  labels: Labels;
}) {
  const [done, setDone] = useState(
    () => new Set(goals.filter((g) => g.doneToday).map((g) => g.id)),
  );
  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const share = done.size / goals.length;
  const date = new Intl.DateTimeFormat(lang, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="font-condensed text-xs font-semibold text-rose-500 uppercase">
          {labels.eyebrow} · <span suppressHydrationWarning>{date}</span>
        </p>
        <h1 className="text-4xl font-black tracking-tight uppercase">{labels.title}</h1>
      </div>

      <section className="grid grid-cols-[1fr_auto] gap-3">
        <div className="flex flex-col justify-between gap-3 rounded-xl border bg-neutral-900 p-4">
          <p className="font-condensed text-sm text-neutral-400 uppercase">
            {labels.summary
              .replace("{done}", String(done.size))
              .replace("{total}", String(goals.length))}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-rose-500 transition-[width] duration-500"
              style={{ width: `${share * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border bg-neutral-900 px-5 py-3">
          <FireIcon weight="fill" className="size-6 text-rose-500" aria-hidden />
          <p className="text-2xl leading-none font-black">{streak}</p>
          <p className="font-condensed text-xs text-neutral-400 uppercase">
            {labels.streak} · {labels.days}
          </p>
        </div>
      </section>

      <ul className="flex flex-col gap-2">
        {goals.map((goal) => {
          const checked = done.has(goal.id);
          return (
            <li key={goal.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(goal.id)}
                className="flex w-full items-center gap-3 rounded-xl border bg-neutral-900 p-3 text-left transition-colors hover:bg-neutral-800"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    checked ? "border-rose-500 bg-rose-500 text-neutral-950" : "border-neutral-600",
                  )}
                >
                  {checked && <CheckIcon weight="bold" className="size-4" aria-hidden />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "font-semibold transition-colors",
                      checked && "text-neutral-500 line-through",
                    )}
                  >
                    {goal.title}
                  </span>
                  <span className="text-sm text-neutral-400">{goal.target}</span>
                </span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 font-condensed text-xs text-neutral-400 uppercase">
                  {labels.kinds[goal.kind]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {done.size === goals.length && (
        <p className="text-center font-condensed text-sm text-rose-500 uppercase">
          {labels.allDone}
        </p>
      )}
    </>
  );
}
