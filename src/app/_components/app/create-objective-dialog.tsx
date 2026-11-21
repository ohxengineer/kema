"use client";

import { useState, type FormEvent } from "react";
import {
  BarbellIcon,
  BrainIcon,
  CalendarBlankIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { enUS, es } from "react-day-picker/locale";

import { ringColors } from "@/app/_components/app/activity-rings";
import { badge, primary, secondary } from "@/app/_components/app/okr-badge";
import { AutocompleteInput, matchSuggestions } from "@/app/_components/app/autocomplete-input";
import { useObjectives } from "@/app/_components/app/objectives-store";
import { RepeatDays } from "@/app/_components/app/repeat-days";
import { Calendar } from "@/app/_components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { Badge } from "@/app/_components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/app/_components/ui/field";
import { Input } from "@/app/_components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/app/_components/ui/responsive-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/app/_components/ui/toggle-group";
import type { GoalKind } from "@/app/_lib/app-sample";
import type { Locale } from "@/app/_lib/i18n";
import { ALL_DAYS, repeatSummary, type RepeatLabels } from "@/app/_lib/repeat";
import { cn } from "@/app/_lib/utils";
import { uid } from "@/app/_lib/uid";

export type CreateLabels = {
  title: string;
  description: string;
  objective: string;
  objectivePlaceholder: string;
  objectiveHint: string;
  deadline: string;
  deadlinePick: string;
  kind: string;
  kinds: Record<GoalKind, string>;
  keyResults: string;
  keyResultsHint: string;
  krTitle: string;
  krTitlePlaceholder: string;
  krAmount: string;
  krAmountPlaceholder: string;
  krUnit: string;
  krUnitPlaceholder: string;
  krRepeat: string;
  repeat: RepeatLabels;
  addKr: string;
  suggestions: string;
  /** Well-formed objectives to suggest as you type, each with its key results. */
  catalog: CatalogObjective[];
  /** e.g. "Quitar KR{n}" */
  removeKr: string;
  submit: string;
  editTitle: string;
  editDescription: string;
  save: string;
};

const MAX_KRS = 5;
const calendarLocales = { es, en: enUS } as const;
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};
/** A local date as YYYY-MM-DD (not toISOString, which shifts to UTC). */
const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** `id` is set when it's an existing key result, so it keeps its progress. */
const fromIsoDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
type DraftKr = {
  key: string;
  id?: string;
  title: string;
  amount: string;
  unit: string;
  days: number[];
};
type CatalogKr = { title: string; amount: number; unit: string; days: number[] };
// kind is a plain string here: it comes from the dictionary JSON
type CatalogObjective = { title: string; kind: string; keyResults: CatalogKr[] };
const asKind = (kind: string): GoalKind => (kind === "mental" ? "mental" : "physical");

const blankKr = (): DraftKr => ({ key: uid(), title: "", amount: "", unit: "", days: ALL_DAYS });

const field =
  "h-12 rounded-xl border-white/10 bg-white/5 px-4 text-base placeholder:text-neutral-500 focus-visible:border-white/30";

/**
 * The form behind every "+": an objective (O) with its deadline and kind
 * (the ring it fills), and 1–5 key results (KR1…), each a description, a
 * quantity with its unit, and the days it repeats on, like an alarm. A dialog on desktop, a
 * drawer on phones; it adds to the shared store, so the new objective shows
 * up on Today and Progreso at once. Opened with an objective (`openEdit`),
 * it comes filled in and saves over it instead.
 */
export function CreateObjectiveDialog({ lang, labels }: { lang: Locale; labels: CreateLabels }) {
  const { creating, setCreating, create, editing, closeEdit, update, objectives, goals } =
    useObjectives();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<GoalKind>("physical");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [pickingDate, setPickingDate] = useState(false);
  const [krs, setKrs] = useState(() => [blankKr()]);
  const color = ringColors[kind];

  // a KR counts once it has a description; then it needs its quantity,
  // unit and at least one day
  const filledKrs = krs.filter((kr) => kr.title.trim());
  const complete = (kr: DraftKr) =>
    Number(kr.amount) > 0 && kr.unit.trim().length > 0 && kr.days.length > 0;
  const ready =
    title.trim().length > 0 &&
    deadline !== undefined &&
    filledKrs.length > 0 &&
    filledKrs.every(complete);
  const deadlineText = deadline
    ? new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric" }).format(
        deadline,
      )
    : labels.deadlinePick;

  const reset = () => {
    setTitle("");
    setKind("physical");
    setDeadline(undefined);
    setKrs([blankKr()]);
  };
  const load = (id: string) => {
    const objective = objectives.find((o) => o.id === id);
    if (!objective) return;
    setTitle(objective.title);
    setKind(objective.kind);
    setDeadline(objective.deadline ? fromIsoDate(objective.deadline) : undefined);
    const own = goals.filter((g) => g.objective === id);
    setKrs(
      own.length
        ? own.map((g) => ({
            key: uid(),
            id: g.id,
            title: g.title,
            amount: g.amount === undefined ? "" : String(g.amount),
            unit: g.unit ?? "",
            days: g.days ?? ALL_DAYS,
          }))
        : [blankKr()],
    );
  };

  // what the form holds: "new" for a draft (kept between openings), or the
  // id of the objective it was filled in with; loaded as the form opens
  const session = editing ?? (creating ? "new" : null);
  const [loaded, setLoaded] = useState("new");
  // still true while an edit closes, so the title doesn't flip mid-animation
  const isEdit = loaded !== "new";
  if (session !== null && session !== loaded) {
    setLoaded(session);
    if (session === "new") reset();
    else load(session);
  }
  const close = () => {
    if (editing) {
      closeEdit();
      // the next opening reloads, dropping unsaved changes
      setLoaded(`closed:${editing}`);
    } else setCreating(false);
  };

  const updateKr = (key: string, patch: Partial<Omit<DraftKr, "key">>) =>
    setKrs((prev) => prev.map((kr) => (kr.key === key ? { ...kr, ...patch } : kr)));

  // every suggested key result, once each, for the KR descriptions
  const catalogKrs = labels.catalog
    .flatMap((o) => o.keyResults)
    .filter((kr, i, all) => all.findIndex((k) => k.title === kr.title) === i);

  // a suggested objective sets the title and kind, and its key results too
  // unless some were already written
  const pickObjective = (o: CatalogObjective) => {
    setTitle(o.title);
    setKind(asKind(o.kind));
    if (krs.every((kr) => !kr.title.trim())) {
      setKrs(
        o.keyResults.map((kr) => ({
          key: uid(),
          title: kr.title,
          amount: String(kr.amount),
          unit: kr.unit,
          days: kr.days,
        })),
      );
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const draft = {
      title: title.trim(),
      kind,
      deadline: toIsoDate(deadline!),
      keyResults: filledKrs.map((kr) => ({
        id: kr.id,
        title: kr.title.trim(),
        amount: Number(kr.amount),
        unit: kr.unit.trim(),
        days: kr.days,
        target: `${Number(kr.amount)} ${kr.unit.trim()} · ${repeatSummary(lang, kr.days, labels.repeat)}`,
      })),
    };
    if (editing) {
      update(editing, draft);
      close();
    } else {
      create(draft);
      setCreating(false);
      reset();
    }
  };

  return (
    <ResponsiveDialog open={session !== null} onOpenChange={(open) => !open && close()}>
      <ResponsiveDialogContent>
        <form onSubmit={submit} className="flex min-h-0 flex-col">
          <ResponsiveDialogHeader className="text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <ResponsiveDialogTitle className="text-2xl font-semibold tracking-tight">
              {isEdit ? labels.editTitle : labels.title}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {isEdit ? labels.editDescription : labels.description}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {/* scrolls on short screens; the button below stays in view */}
          <FieldGroup className="max-h-[55dvh] gap-6 overflow-y-auto px-4 pb-2">
            <Field>
              <FieldLabel
                htmlFor="objective-title"
                className="font-condensed tracking-wider uppercase"
              >
                <Badge className={cn(badge, "mr-0")} style={primary(color)}>
                  O
                </Badge>
                {labels.objective}
              </FieldLabel>
              <AutocompleteInput
                id="objective-title"
                value={title}
                onValueChange={setTitle}
                suggestions={matchSuggestions(title, labels.catalog, (o) => o.title)}
                getKey={(o) => o.title}
                renderSuggestion={(o) => {
                  const Icon = asKind(o.kind) === "physical" ? BarbellIcon : BrainIcon;
                  return (
                    <>
                      <Icon
                        weight="fill"
                        className="size-4 shrink-0"
                        style={{ color: ringColors[asKind(o.kind)] }}
                        aria-hidden
                      />
                      {o.title}
                    </>
                  );
                }}
                onPick={pickObjective}
                listLabel={labels.suggestions}
                placeholder={labels.objectivePlaceholder}
                required
                className={field}
              />
              <FieldDescription>{labels.objectiveHint}</FieldDescription>
            </Field>

            <Field>
              <FieldLabel
                htmlFor="objective-deadline"
                className="font-condensed tracking-wider uppercase"
              >
                {labels.deadline}
              </FieldLabel>
              <Popover open={pickingDate} onOpenChange={setPickingDate}>
                <PopoverTrigger asChild>
                  <button
                    id="objective-deadline"
                    type="button"
                    className={cn(
                      field,
                      "flex w-full items-center justify-between border text-left",
                      !deadline && "text-neutral-500",
                    )}
                  >
                    {deadlineText}
                    <CalendarBlankIcon
                      weight="duotone"
                      className="size-5 text-neutral-400"
                      aria-hidden
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(day) => {
                      setDeadline(day);
                      setPickingDate(false);
                    }}
                    // a deadline is ahead: from tomorrow on
                    disabled={(day) => day <= endOfToday()}
                    defaultMonth={deadline}
                    weekStartsOn={1}
                    locale={calendarLocales[lang]}
                    classNames={{
                      caption_label:
                        "font-condensed text-sm font-semibold tracking-wider uppercase select-none",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </Field>

            <FieldSet>
              <FieldLegend variant="label" className="font-condensed tracking-wider uppercase">
                {labels.kind}
              </FieldLegend>
              <ToggleGroup
                type="single"
                value={kind}
                // a single choice can't be cleared: keep the current kind
                onValueChange={(value) => value && setKind(value as GoalKind)}
                spacing={2}
                className="w-full"
              >
                {(["physical", "mental"] as const).map((k) => {
                  const on = kind === k;
                  const Icon = k === "physical" ? BarbellIcon : BrainIcon;
                  return (
                    <ToggleGroupItem
                      key={k}
                      value={k}
                      className={cn(
                        "h-12 flex-1 gap-2 rounded-full border font-condensed text-sm font-semibold tracking-wider uppercase",
                        !on && "border-white/10 text-neutral-300",
                      )}
                      style={
                        on
                          ? {
                              backgroundColor: `${ringColors[k]}26`,
                              borderColor: ringColors[k],
                              color: ringColors[k],
                            }
                          : undefined
                      }
                    >
                      <Icon weight="fill" />
                      {labels.kinds[k]}
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="font-condensed tracking-wider uppercase">
                {labels.keyResults}
              </FieldLegend>
              <FieldDescription>{labels.keyResultsHint}</FieldDescription>
              <div className="flex flex-col gap-3">
                {krs.map((kr, i) => (
                  <div
                    key={kr.key}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className={badge} style={secondary(color)}>
                        KR{i + 1}
                      </Badge>
                      {krs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setKrs((prev) => prev.filter((k) => k.key !== kr.key))}
                          aria-label={labels.removeKr.replace("{n}", String(i + 1))}
                          className="-my-2 -mr-2 flex size-11 items-center justify-center rounded-full text-neutral-500 transition-colors hover:text-white"
                        >
                          <TrashIcon weight="bold" className="size-4" aria-hidden />
                        </button>
                      )}
                    </div>
                    <Field>
                      <FieldLabel htmlFor={`kr-title-${kr.key}`} className="sr-only">
                        {labels.krTitle} KR{i + 1}
                      </FieldLabel>
                      <AutocompleteInput
                        id={`kr-title-${kr.key}`}
                        value={kr.title}
                        onValueChange={(value) => updateKr(kr.key, { title: value })}
                        suggestions={matchSuggestions(kr.title, catalogKrs, (s) => s.title)}
                        getKey={(s) => `${s.title}-${s.amount}-${s.unit}`}
                        renderSuggestion={(s) => (
                          <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                            <span>{s.title}</span>
                            <span className="shrink-0 font-condensed text-xs text-neutral-400 uppercase">
                              {s.amount} {s.unit} · {repeatSummary(lang, s.days, labels.repeat)}
                            </span>
                          </span>
                        )}
                        onPick={(s) =>
                          updateKr(kr.key, {
                            title: s.title,
                            amount: String(s.amount),
                            unit: s.unit,
                            days: s.days,
                          })
                        }
                        listLabel={labels.suggestions}
                        placeholder={labels.krTitlePlaceholder}
                        className={field}
                      />
                    </Field>
                    {/* the quantitative part: how much, in what unit */}
                    <div className="grid grid-cols-[2fr_3fr] gap-2">
                      <Field>
                        <FieldLabel htmlFor={`kr-amount-${kr.key}`} className="sr-only">
                          {labels.krAmount} KR{i + 1}
                        </FieldLabel>
                        <Input
                          id={`kr-amount-${kr.key}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={kr.amount}
                          onChange={(e) => updateKr(kr.key, { amount: e.target.value })}
                          placeholder={labels.krAmountPlaceholder}
                          className={field}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`kr-unit-${kr.key}`} className="sr-only">
                          {labels.krUnit} KR{i + 1}
                        </FieldLabel>
                        <Input
                          id={`kr-unit-${kr.key}`}
                          value={kr.unit}
                          onChange={(e) => updateKr(kr.key, { unit: e.target.value })}
                          placeholder={labels.krUnitPlaceholder}
                          autoComplete="off"
                          className={field}
                        />
                      </Field>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <span className="font-condensed text-xs text-neutral-400 uppercase">
                        {labels.krRepeat}
                      </span>
                      <RepeatDays
                        lang={lang}
                        value={kr.days}
                        onChange={(days) => updateKr(kr.key, { days })}
                        color={color}
                        labels={labels.repeat}
                        label={`${labels.krRepeat} KR${i + 1}`}
                      />
                    </div>
                  </div>
                ))}
                {krs.length < MAX_KRS && (
                  <button
                    type="button"
                    onClick={() => setKrs((prev) => [...prev, blankKr()])}
                    className="flex h-12 items-center justify-center gap-2 rounded-full border border-dashed border-white/15 font-condensed text-sm font-semibold tracking-wider text-neutral-300 uppercase transition-colors hover:border-white/30 hover:text-white"
                  >
                    <PlusIcon weight="bold" className="size-4" aria-hidden />
                    {labels.addKr}
                  </button>
                )}
              </div>
            </FieldSet>
          </FieldGroup>

          <ResponsiveDialogFooter>
            <button
              type="submit"
              disabled={!ready}
              className="h-12 w-full rounded-full bg-white text-base font-semibold text-neutral-950 transition-opacity hover:opacity-90 disabled:bg-white/10 disabled:text-neutral-500"
            >
              {isEdit ? labels.save : labels.submit}
            </button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
