"use client";

import { useId, useState } from "react";
import { FunnelSimpleIcon } from "@phosphor-icons/react";

import { ringColors } from "@/app/_components/app/activity-rings";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/app/_components/ui/responsive-dialog";
import type { GoalKind } from "@/app/_lib/app-sample";
import { cn } from "@/app/_lib/utils";

export type ObjectiveStatus = "all" | "pending" | "done";
export type ObjectiveSort = "default" | "progress" | "name";
export type ObjectiveFilters = { kinds: GoalKind[]; status: ObjectiveStatus; sort: ObjectiveSort };

export const noFilters: ObjectiveFilters = { kinds: [], status: "all", sort: "default" };

export const hasFilters = (f: ObjectiveFilters) =>
  f.kinds.length > 0 || f.status !== "all" || f.sort !== "default";

export type FilterLabels = {
  open: string;
  title: string;
  description: string;
  clear: string;
  close: string;
  kind: string;
  kinds: Record<GoalKind, string>;
  status: string;
  statuses: Record<ObjectiveStatus, string>;
  sort: string;
  sorts: Record<ObjectiveSort, string>;
  /** e.g. "Mostrar {count} objetivos" */
  apply: string;
  empty: string;
};

const chip =
  "flex h-11 items-center gap-1.5 rounded-full border px-4 font-condensed text-sm font-semibold tracking-wider uppercase transition-colors";

/** A labelled group of chips in the filter sheet. */
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div
      role="group"
      aria-labelledby={id}
      className="flex flex-col gap-2 border-t border-white/10 py-3 first:border-t-0 first:pt-0"
    >
      <p
        id={id}
        className="font-condensed text-xs font-semibold tracking-wider text-neutral-400 uppercase"
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * The filter button by the objectives title, and its sheet (dialog on
 * desktop, drawer on phones), modelled on shop filters: chip groups for
 * kind, today's status and order, then clear above one button that applies
 * them and says how many objectives remain. Changes stay a draft
 * until applied.
 */
export function ObjectiveFiltersButton({
  value,
  onChange,
  count,
  labels,
}: {
  value: ObjectiveFilters;
  onChange: (filters: ObjectiveFilters) => void;
  /** How many objectives a set of filters leaves, for the apply button. */
  count: (filters: ObjectiveFilters) => number;
  labels: FilterLabels;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const active = hasFilters(value);

  const toggleKind = (kind: GoalKind) =>
    setDraft((d) => ({
      ...d,
      kinds: d.kinds.includes(kind) ? d.kinds.filter((k) => k !== kind) : [...d.kinds, kind],
    }));

  return (
    <>
      {/* a 44pt tap target around a 32pt circle, like the add button */}
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-label={labels.open}
        title={labels.open}
        className="group relative flex size-11 items-center justify-center"
      >
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors group-hover:text-white",
            active ? "text-rose-500" : "text-neutral-300",
          )}
        >
          <FunnelSimpleIcon weight="bold" className="size-4" aria-hidden />
        </span>
        {active && (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-neutral-950" />
        )}
      </button>

      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent>
          <div className="mx-auto w-full max-w-md">
            <ResponsiveDialogHeader className="pb-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
              <ResponsiveDialogTitle className="text-2xl font-semibold tracking-tight">
                {labels.title}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription className="sr-only">
                {labels.description}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>

            <div className="px-4">
              <Group label={labels.kind}>
                {(["physical", "mental"] as const).map((kind) => {
                  const on = draft.kinds.includes(kind);
                  const color = ringColors[kind];
                  return (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleKind(kind)}
                      className={cn(chip, !on && "border-white/10 text-neutral-300")}
                      style={
                        on
                          ? { backgroundColor: `${color}26`, borderColor: color, color }
                          : undefined
                      }
                    >
                      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                      {labels.kinds[kind]}
                    </button>
                  );
                })}
              </Group>

              <Group label={labels.status}>
                {(["all", "pending", "done"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={draft.status === status}
                    onClick={() => setDraft((d) => ({ ...d, status }))}
                    className={cn(
                      chip,
                      draft.status === status
                        ? "border-white bg-white text-neutral-950"
                        : "border-white/10 text-neutral-300",
                    )}
                  >
                    {labels.statuses[status]}
                  </button>
                ))}
              </Group>

              <Group label={labels.sort}>
                {(["default", "progress", "name"] as const).map((sort) => (
                  <button
                    key={sort}
                    type="button"
                    aria-pressed={draft.sort === sort}
                    onClick={() => setDraft((d) => ({ ...d, sort }))}
                    className={cn(
                      chip,
                      draft.sort === sort
                        ? "border-white bg-white text-neutral-950"
                        : "border-white/10 text-neutral-300",
                    )}
                  >
                    {labels.sorts[sort]}
                  </button>
                ))}
              </Group>
            </div>

            <ResponsiveDialogFooter>
              {/* clear sits just above the main button; the sheet closes by its own × (desktop), a swipe or a tap outside */}
              <div className="flex w-full flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDraft(noFilters)}
                  disabled={!hasFilters(draft)}
                  className="h-11 px-4 font-condensed text-sm font-semibold tracking-wider text-rose-500 uppercase disabled:text-neutral-600"
                >
                  {labels.clear}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(draft);
                    setOpen(false);
                  }}
                  className="h-12 w-full rounded-full bg-white text-base font-semibold text-neutral-950 transition-opacity hover:opacity-90"
                >
                  {labels.apply.replace("{count}", String(count(draft)))}
                </button>
              </div>
            </ResponsiveDialogFooter>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
