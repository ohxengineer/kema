"use client";

import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";

import {
  ObjectiveHeatmapCard,
  type HeatmapLabels,
} from "@/app/_components/app/objective-heatmap-card";
import {
  noFilters,
  ObjectiveFiltersButton,
  type FilterLabels,
  type ObjectiveFilters,
} from "@/app/_components/app/objective-filters";
import { useObjectives } from "@/app/_components/app/objectives-store";
import { ObjectiveDialog, type TodayLabels } from "@/app/_components/app/today-goals";

import type { Locale } from "@/app/_lib/i18n";
import { cn } from "@/app/_lib/utils";

/**
 * Progreso's objectives: the title with the filter and add buttons (as on
 * Today), a scrolling row of chips to look at the last 30 days or a single
 * month, and a habit card per objective left by the filters.
 */
export function ObjectivesProgress({
  lang,
  labels,
}: {
  lang: Locale;
  labels: {
    title: string;
    recent: string;
    addObjective: string;
    filters: FilterLabels;
    heatmap: HeatmapLabels;
    objective: TodayLabels["objective"];
    close: string;
  };
}) {
  const { objectives, goals, openCreate } = useObjectives();
  const [filters, setFilters] = useState<ObjectiveFilters>(noFilters);
  // null: the last 30 days; else a month of this year (0–11)
  const [month, setMonth] = useState<number | null>(null);
  const [openObjective, setOpenObjective] = useState<string | null>(null);

  const now = new Date();
  const monthName = new Intl.DateTimeFormat(lang, { month: "short" });
  // newest first, so the chips read from now backwards
  const months = Array.from({ length: now.getMonth() + 1 }, (_, i) => now.getMonth() - i);

  // today's share of each objective's key results, for the status filter
  const shareDone = (objectiveId: string) => {
    const krs = goals.filter((g) => g.objective === objectiveId);
    return krs.length ? krs.filter((g) => g.doneToday).length / krs.length : 0;
  };
  const visible = (f: ObjectiveFilters) => {
    const list = objectives.filter(
      (o) =>
        (f.kinds.length === 0 || f.kinds.includes(o.kind)) &&
        (f.status === "all" || (f.status === "done") === (shareDone(o.id) === 1)),
    );
    if (f.sort === "progress") return [...list].sort((a, b) => shareDone(b.id) - shareDone(a.id));
    if (f.sort === "name") return [...list].sort((a, b) => a.title.localeCompare(b.title, lang));
    return list;
  };
  const shown = visible(filters);

  const chip = (selected: boolean) =>
    cn(
      "flex h-9 shrink-0 items-center rounded-full border px-5 font-condensed text-xs font-semibold tracking-wider whitespace-nowrap uppercase transition-colors",
      selected ? "border-white bg-white text-neutral-950" : "border-white/10 text-neutral-300",
    );

  return (
    <section aria-labelledby="progress-goals" className="flex flex-col">
      <div className="flex items-center justify-between pb-2 pl-1">
        <h2 id="progress-goals" className="text-2xl leading-tight font-semibold">
          {labels.title}
        </h2>
        <div className="-mr-1.5 flex items-center">
          <ObjectiveFiltersButton
            value={filters}
            onChange={setFilters}
            count={(f) => visible(f).length}
            labels={labels.filters}
          />
          {/* a 44pt tap target around a 32pt circle, like the filter button */}
          <button
            type="button"
            onClick={openCreate}
            aria-haspopup="dialog"
            aria-label={labels.addObjective}
            title={labels.addObjective}
            className="group flex size-11 items-center justify-center"
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors group-hover:text-white">
              <PlusIcon weight="bold" className="size-4" aria-hidden />
            </span>
          </button>
        </div>
      </div>

      {/* the last 30 days or a month: scrolls sideways, bleeding to the screen edges */}
      <div
        role="radiogroup"
        aria-label={labels.title}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          role="radio"
          aria-checked={month === null}
          onClick={() => setMonth(null)}
          className={chip(month === null)}
        >
          {labels.recent}
        </button>
        {months.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={month === m}
            onClick={() => setMonth(m)}
            className={chip(month === m)}
          >
            {monthName.format(new Date(now.getFullYear(), m, 1)).replace(".", "")}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-neutral-400">
          {labels.filters.empty}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {shown.map((objective) => (
          <ObjectiveHeatmapCard
            key={objective.id}
            objective={objective}
            keyResults={goals.filter((g) => g.objective === objective.id)}
            href={`/${lang}/app`}
            month={month}
            lang={lang}
            onDetail={() => setOpenObjective(objective.id)}
            labels={labels.heatmap}
          />
        ))}
      </ul>

      <ObjectiveDialog
        lang={lang}
        objective={objectives.find((o) => o.id === openObjective) ?? null}
        keyResults={goals.filter((g) => g.objective === openObjective)}
        done={new Set(goals.filter((g) => g.doneToday).map((g) => g.id))}
        onClose={() => setOpenObjective(null)}
        labels={labels.objective}
        closeLabel={labels.close}
      />
    </section>
  );
}
