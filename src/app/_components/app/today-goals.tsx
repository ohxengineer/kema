"use client";

import { useState } from "react";
import {
  BarbellIcon,
  BrainIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleDashedIcon,
  DotsThreeVerticalIcon,
  PencilCircleIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react";

import { ActivityRings, ringColors } from "@/app/_components/app/activity-rings";
import { DaySwitcher, dayFrom, type DaySwitcherLabels } from "@/app/_components/app/day-switcher";
import {
  noFilters,
  ObjectiveFiltersButton,
  type FilterLabels,
  type ObjectiveFilters,
} from "@/app/_components/app/objective-filters";
import { badge, primary, secondary } from "@/app/_components/app/okr-badge";
import { useObjectives } from "@/app/_components/app/objectives-store";
import type { Streak, StreakLabels } from "@/app/_components/app/streak-pill";
import {
  SuggestionsCarousel,
  type SuggestionsLabels,
} from "@/app/_components/app/suggestions-carousel";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/app/_components/ui/responsive-dialog";
import { sampleDoneOn, type Goal, type GoalKind, type Objective } from "@/app/_lib/app-sample";
import type { Locale } from "@/app/_lib/i18n";
import { cn } from "@/app/_lib/utils";
import { useSwipe } from "@/app/_hooks/use-swipe";

export type TodayLabels = Labels;
type Labels = {
  day: DaySwitcherLabels;
  title: string;
  summary: string;
  ofGoals: string;
  objectives: string;
  addObjective: string;
  filters: FilterLabels;
  suggestions: SuggestionsLabels;
  kr: {
    open: string;
    thisWeek: string;
    markDone: string;
    undo: string;
    close: string;
    menu: string;
    update: string;
    complete: string;
    uncomplete: string;
  };
  objective: {
    open: string;
    progress: string;
    keyResults: string;
    doneToday: string;
    pending: string;
    /** e.g. "Hasta {date}" */
    until: string;
    edit: string;
  };
  streak: string;
  days: string;
  allDone: string;
  kinds: { physical: string; mental: string };
};

/** Today: the day being looked at, how far along it is, and the goals to tick off. */
export function TodayGoals({
  lang,
  streak,
  streakLabels,
  labels,
}: {
  lang: Locale;
  streak: Streak;
  streakLabels: StreakLabels;
  labels: Labels;
}) {
  const { objectives, goals, openCreate } = useObjectives();
  // days back from today (0 today, -1 yesterday), and what's done on each:
  // today starts from the sample's doneToday, past days from sample history
  const [offset, setOffset] = useState(0);
  const [doneByDay, setDoneByDay] = useState<Record<number, Set<string>>>(() => ({
    0: new Set(goals.filter((g) => g.doneToday).map((g) => g.id)),
  }));
  const doneOn = (day: number) => doneByDay[day] ?? sampleDoneOn(goals, dayFrom(day));
  const done = doneOn(offset);
  // the key result, or objective, open in a drawer, if any
  const [openGoal, setOpenGoal] = useState<string | null>(null);
  const [openObjective, setOpenObjective] = useState<string | null>(null);
  const [filters, setFilters] = useState<ObjectiveFilters>(noFilters);
  const toggle = (id: string) =>
    setDoneByDay((prev) => {
      const next = new Set(prev[offset] ?? sampleDoneOn(goals, dayFrom(offset)));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [offset]: next };
    });

  // 15% tint

  // one ring per kind, outermost first: body, then mind
  const kinds: GoalKind[] = ["physical", "mental"];
  const tally = (day: number, kind: GoalKind) => {
    const ofKind = goals.filter((g) => g.kind === kind);
    const dayDone = doneOn(day);
    return {
      done: ofKind.filter((g) => dayDone.has(g.id)).length,
      total: ofKind.length,
    };
  };
  const ringsFor = (day: number) =>
    kinds.map((kind) => {
      const { done, total } = tally(day, kind);
      return { value: total ? done / total : 0, color: ringColors[kind] };
    });

  // the Monday-to-Sunday week holding the selected day, as offsets from today
  const weekday = (dayFrom(offset).getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => offset - weekday + i);
  // the next week stops at the current one: jump to today if it's in it
  const swipeWeek = useSwipe(
    () => setOffset(offset - 7),
    () => {
      if (week.includes(0)) return;
      setOffset(Math.min(offset + 7, 0));
    },
  );
  const letter = new Intl.DateTimeFormat(lang, { weekday: "narrow" });
  const fullDay = new Intl.DateTimeFormat(lang, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  // the card title: "Domingo, 15 de noviembre" / "Sunday, 15 November"
  // (in English too the day goes before the month, after a comma)
  const titleParts = new Intl.DateTimeFormat(lang, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(dayFrom(offset));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    titleParts.find((p) => p.type === type)?.value ?? "";
  const longDay =
    lang === "en"
      ? `${part("weekday")}, ${part("day")} ${part("month")}`
      : titleParts.map((p) => p.value).join("");
  const title = longDay.charAt(0).toLocaleUpperCase(lang) + longDay.slice(1);
  const ofGoals = (d: number, t: number) =>
    labels.ofGoals.replace("{done}", String(d)).replace("{total}", String(t));
  const openKR = goals.find((g) => g.id === openGoal) ?? null;

  // the objectives the filters leave, for the selected day: by kind, by
  // whether all their key results are done, then in the chosen order
  const shareDone = (objectiveId: string) => {
    const krs = goals.filter((g) => g.objective === objectiveId);
    return krs.length ? krs.filter((g) => done.has(g.id)).length / krs.length : 0;
  };
  const visibleObjectives = (f: ObjectiveFilters) => {
    const list = objectives.filter(
      (o) =>
        (f.kinds.length === 0 || f.kinds.includes(o.kind)) &&
        (f.status === "all" || (f.status === "done") === (shareDone(o.id) === 1)),
    );
    if (f.sort === "progress") return [...list].sort((a, b) => shareDone(b.id) - shareDone(a.id));
    if (f.sort === "name") return [...list].sort((a, b) => a.title.localeCompare(b.title, lang));
    return list;
  };
  const summary = labels.summary
    .replace("{done}", String(done.size))
    .replace("{total}", String(goals.length));

  return (
    <>
      <div className="flex flex-col">
        <DaySwitcher
          lang={lang}
          offset={offset}
          onChange={setOffset}
          streak={streak}
          streakLabels={streakLabels}
          ringsFor={(day) =>
            day > 0 ? kinds.map((k) => ({ value: 0, color: ringColors[k] })) : ringsFor(day)
          }
          labels={labels.day}
        />
        {/* not shown, but keeps a page heading for screen readers */}
        <h1 className="sr-only">{labels.title}</h1>
      </div>

      {/* the week, a small ring per day: tap one to look at it */}
      {/* swipe the week row to step a week: left for the next, right for the previous */}
      <div className="grid touch-pan-y grid-cols-7" suppressHydrationWarning {...swipeWeek}>
        {week.map((day) => {
          const selected = day === offset;
          const future = day > 0;
          const dayDone = doneOn(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => setOffset(day)}
              disabled={future}
              aria-pressed={selected}
              aria-label={`${fullDay.format(dayFrom(day))}: ${ofGoals(future ? 0 : dayDone.size, goals.length)}`}
              className="flex min-h-11 flex-col items-center gap-1 disabled:opacity-30"
            >
              <span
                suppressHydrationWarning
                className={cn(
                  "flex size-6 items-center justify-center rounded-full font-condensed text-xs font-semibold uppercase",
                  selected
                    ? "bg-white text-neutral-950"
                    : day === 0
                      ? "text-rose-500"
                      : "text-neutral-400",
                )}
              >
                {letter.format(dayFrom(day))}
              </span>
              <ActivityRings
                rings={
                  future ? kinds.map((k) => ({ value: 0, color: ringColors[k] })) : ringsFor(day)
                }
                size={36}
                stroke={5}
                gap={1.5}
              />
            </button>
          );
        })}
      </div>

      {/* the selected day's rings, with what each one counts */}
      <section
        aria-label={summary}
        className="relative isolate flex flex-col gap-4 overflow-hidden rounded-xl border bg-neutral-900 p-4"
      >
        {/* a soft rose glow, centred at the top of the card and fading out.
            Screen blending only lightens, so it tints the pills without
            dimming them, and it lets taps through */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 mix-blend-screen"
          style={{
            background: "radial-gradient(100% 70% at 50% 0%, rgb(244 63 94 / 0.22), transparent)",
          }}
        />
        <h2 suppressHydrationWarning className="text-xl leading-tight font-semibold">
          {title}
        </h2>
        <div className="flex items-center gap-3 min-[400px]:gap-4">
          {/* scales with the card: up to 128px, smaller on narrow phones */}
          <ActivityRings
            rings={ringsFor(offset)}
            size={128}
            stroke={16}
            gap={3}
            animate
            className="h-auto w-[34%] max-w-32"
          />
          {/* a full pill per ring: the kind's icon, its label over a dot per
              key result (grouped by objective, filled once done), the count */}
          <dl className="flex min-w-0 flex-1 flex-col gap-2">
            {kinds.map((kind) => {
              const { done: d, total } = tally(offset, kind);
              const color = ringColors[kind];
              const KindIcon = kind === "physical" ? BarbellIcon : BrainIcon;
              const groups = objectives
                .filter((o) => o.kind === kind)
                .map((o) => goals.filter((g) => g.objective === o.id));
              return (
                <div
                  key={kind}
                  className="flex h-14 min-w-0 items-center gap-2 rounded-full pr-3 pl-1.5 min-[400px]:gap-2.5 min-[400px]:pr-4"
                  style={{ backgroundColor: `${color}26` }}
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-950 min-[400px]:size-11"
                    style={{ backgroundColor: color }}
                  >
                    <KindIcon weight="fill" className="size-6" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <dt
                      className="font-condensed text-xs leading-none font-semibold tracking-widest uppercase"
                      style={{ color }}
                    >
                      {labels.kinds[kind]}
                    </dt>
                    <div aria-hidden className="flex items-center gap-1">
                      {groups.map((krs, gi) => (
                        // each objective's dots in their own small pill
                        <span
                          key={gi}
                          className="flex gap-1 rounded-full px-1.5 py-1"
                          style={{ backgroundColor: `${color}26` }}
                        >
                          {krs.map((kr) => (
                            <span
                              key={kr.id}
                              className="size-1.5 rounded-full transition-opacity"
                              style={{
                                backgroundColor: color,
                                opacity: done.has(kr.id) ? 1 : 0.3,
                              }}
                            />
                          ))}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* the share done, with the count for screen readers */}
                  <dd className="shrink-0 font-condensed text-2xl leading-none font-bold tabular-nums min-[400px]:text-3xl">
                    {total ? Math.round((d / total) * 100) : 0}%
                    <span className="sr-only">
                      {" "}
                      ({d}/{total})
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* OKRs: a card per objective (speedometer icon), its key results (KR1, KR2…) to tick
          off for the day, in the colour of its ring */}
      <section aria-labelledby="objectives-title" className="flex flex-col">
        <div className="flex items-center justify-between pb-2 pl-1">
          <h2 id="objectives-title" className="text-2xl leading-tight font-semibold">
            {labels.objectives}
          </h2>
          <div className="-mr-1.5 flex items-center">
            <ObjectiveFiltersButton
              value={filters}
              onChange={setFilters}
              count={(f) => visibleObjectives(f).length}
              labels={labels.filters}
            />
            {/* a 44pt tap target around a 32pt circle, like the calendar button */}
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
        {visibleObjectives(filters).length === 0 && (
          <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-neutral-400">
            {labels.filters.empty}
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {visibleObjectives(filters).map((objective) => {
            const color = ringColors[objective.kind];
            const keyResults = goals.filter((g) => g.objective === objective.id);
            return (
              <li key={objective.id} className="overflow-hidden rounded-xl border bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setOpenObjective(objective.id)}
                  aria-haspopup="dialog"
                  aria-label={`${objective.title} · ${labels.objective.open}`}
                  className="flex w-full items-center gap-3 border-b border-white/10 p-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 className="leading-snug font-semibold text-foreground">
                      <Badge className={badge} style={primary(color)}>
                        O
                      </Badge>
                      {objective.title}
                    </h2>
                    {objective.deadline && (
                      <span className="font-condensed text-xs text-neutral-400 uppercase">
                        {labels.objective.until.replace(
                          "{date}",
                          formatDeadline(lang, objective.deadline),
                        )}
                      </span>
                    )}
                  </span>
                  <CaretRightIcon
                    weight="bold"
                    className="size-4 shrink-0 text-neutral-500"
                    aria-hidden
                  />
                </button>
                <ul>
                  {keyResults.map((goal, i) => {
                    const checked = done.has(goal.id);
                    return (
                      <li key={goal.id} className="flex items-center gap-1 pr-1.5 pl-4">
                        <span className="flex min-w-0 flex-1 items-center gap-3 py-3">
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="font-medium">
                              <Badge className={badge} style={secondary(color)}>
                                KR{i + 1}
                              </Badge>
                              <span
                                className={cn(
                                  "transition-colors",
                                  checked && "text-neutral-500 line-through",
                                )}
                              >
                                {goal.title}
                              </span>
                            </span>
                            <span className="text-sm text-neutral-400">{goal.target}</span>
                          </span>
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            {/* 44pt tap target (Apple HIG) */}
                            <button
                              type="button"
                              aria-label={`${goal.title} · ${labels.kr.menu}`}
                              className="flex size-11 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:text-white data-[state=open]:text-white"
                            >
                              <DotsThreeVerticalIcon weight="bold" className="size-5" aria-hidden />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-52">
                            <DropdownMenuItem onSelect={() => setOpenGoal(goal.id)}>
                              <PencilCircleIcon weight="fill" className="text-foreground" />
                              {labels.kr.update}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toggle(goal.id)}>
                              {checked ? (
                                <CircleDashedIcon weight="bold" className="text-foreground" />
                              ) : (
                                <CheckCircleIcon weight="fill" className="text-foreground" />
                              )}
                              {checked ? labels.kr.uncomplete : labels.kr.complete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <SuggestionsCarousel labels={labels.suggestions} />

      <ObjectiveDialog
        lang={lang}
        objective={objectives.find((o) => o.id === openObjective) ?? null}
        keyResults={goals.filter((g) => g.objective === openObjective)}
        done={done}
        onClose={() => setOpenObjective(null)}
        labels={labels.objective}
        closeLabel={labels.kr.close}
      />

      <KeyResultDialog
        goal={openKR}
        objective={objectives.find((o) => o.id === openKR?.objective)}
        index={openKR ? goals.filter((g) => g.objective === openKR.objective).indexOf(openKR) : 0}
        done={openKR ? done.has(openKR.id) : false}
        onToggle={() => openKR && toggle(openKR.id)}
        onClose={() => setOpenGoal(null)}
        labels={labels.kr}
      />

      {offset === 0 && done.size === goals.length && (
        <p className="text-center font-condensed text-sm text-rose-500 uppercase">
          {labels.allDone}
        </p>
      )}
    </>
  );
}

/**
 * A key result's details in a bottom sheet: its objective, what it asks
 * for, how this week is going, and the button to mark it done (or undo it)
 * for the day being looked at.
 */
function KeyResultDialog({
  goal,
  objective,
  index,
  done,
  onToggle,
  onClose,
  labels,
}: {
  goal: Goal | null;
  objective: Objective | undefined;
  index: number;
  done: boolean;
  onToggle: () => void;
  onClose: () => void;
  labels: Labels["kr"];
}) {
  const color = goal ? ringColors[goal.kind] : ringColors.physical;

  return (
    <ResponsiveDialog open={goal !== null} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent>
        {goal && (
          <div className="mx-auto w-full max-w-md">
            <ResponsiveDialogHeader className="text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
              {objective && (
                <p className="text-sm text-neutral-400">
                  <Badge className={badge} style={primary(color)}>
                    O
                  </Badge>
                  {objective.title}
                </p>
              )}
              <ResponsiveDialogTitle className="pt-2 text-2xl font-semibold tracking-tight">
                <Badge className={cn(badge, "align-[0.3em]")} style={secondary(color)}>
                  KR{index + 1}
                </Badge>
                {goal.title}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>{goal.target}</ResponsiveDialogDescription>
            </ResponsiveDialogHeader>

            <div className="flex flex-col gap-2 px-4">
              <div className="flex items-baseline justify-between font-condensed text-xs uppercase">
                <span className="font-semibold">{labels.thisWeek}</span>
                <span style={{ color }}>{Math.round(goal.week * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${goal.week * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>

            <ResponsiveDialogFooter>
              {/* 48pt tall: comfortably over the 44pt minimum (Apple HIG) */}
              <Button
                size="lg"
                variant={done ? "default" : "secondary"}
                onClick={onToggle}
                className="h-12 font-sans text-base font-semibold normal-case"
              >
                {done && <CheckIcon weight="bold" data-icon="inline-start" />}
                {done ? labels.undo : labels.markDone}
              </Button>
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
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

/**
 * An objective's details in a bottom sheet: what it is, how this week is
 * going across its key results, and which are done for the day.
 */
export function ObjectiveDialog({
  lang,
  objective,
  keyResults,
  done,
  onClose,
  labels,
  closeLabel,
}: {
  lang: Locale;
  objective: Objective | null;
  keyResults: Goal[];
  done: Set<string>;
  onClose: () => void;
  labels: Labels["objective"];
  closeLabel: string;
}) {
  const { openEdit } = useObjectives();
  const color = objective ? ringColors[objective.kind] : ringColors.physical;
  const week = keyResults.length
    ? keyResults.reduce((sum, kr) => sum + kr.week, 0) / keyResults.length
    : 0;

  return (
    <ResponsiveDialog open={objective !== null} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent>
        {objective && (
          <div className="mx-auto w-full max-w-md">
            <ResponsiveDialogHeader className="text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
              <ResponsiveDialogTitle className="text-2xl leading-tight font-semibold tracking-tight">
                <Badge className={cn(badge, "align-[0.3em]")} style={primary(color)}>
                  O
                </Badge>
                {objective.title}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription
                className={cn("font-condensed text-xs uppercase", !objective.deadline && "sr-only")}
              >
                {objective.deadline
                  ? labels.until.replace("{date}", formatDeadline(lang, objective.deadline))
                  : labels.keyResults}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>

            <div className="flex flex-col gap-2 px-4">
              <div className="flex items-baseline justify-between font-condensed text-xs uppercase">
                <span className="font-semibold">{labels.progress}</span>
                <span style={{ color }}>{Math.round(week * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${week * 100}%`, backgroundColor: color }}
                />
              </div>
            </div>

            <h3 className="px-4 pt-5 pb-1 font-condensed text-xs font-semibold uppercase">
              {labels.keyResults}
            </h3>
            <ul className="px-4">
              {keyResults.map((kr, i) => {
                const isDone = done.has(kr.id);
                return (
                  <li key={kr.id} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1">
                      <Badge className={badge} style={secondary(color)}>
                        KR{i + 1}
                      </Badge>
                      <span className={cn(isDone && "text-neutral-500 line-through")}>
                        {kr.title}
                      </span>
                    </span>
                    <span
                      className="font-condensed text-xs uppercase"
                      style={{ color: isDone ? color : undefined }}
                    >
                      {isDone ? labels.doneToday : labels.pending}
                    </span>
                  </li>
                );
              })}
            </ul>

            <ResponsiveDialogFooter>
              {/* swaps this sheet for the form, filled in with the objective */}
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  onClose();
                  openEdit(objective.id);
                }}
                className="h-12 font-sans text-base font-semibold normal-case"
              >
                <PencilSimpleIcon weight="bold" data-icon="inline-start" />
                {labels.edit}
              </Button>
              <ResponsiveDialogClose asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-12 font-sans text-base font-semibold normal-case"
                >
                  {closeLabel}
                </Button>
              </ResponsiveDialogClose>
            </ResponsiveDialogFooter>
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

/** A deadline (YYYY-MM-DD) as a short date, e.g. "31 may 2027". */
function formatDeadline(lang: Locale, iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(y, m - 1, d))
    .replace(".", "");
}
