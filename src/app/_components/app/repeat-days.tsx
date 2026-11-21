"use client";

import { ToggleGroup, ToggleGroupItem } from "@/app/_components/ui/toggle-group";
import type { Locale } from "@/app/_lib/i18n";
import { ALL_DAYS, dayName, repeatSummary, type RepeatLabels } from "@/app/_lib/repeat";

/**
 * An alarm-style repeat picker: a round toggle per weekday, Monday first,
 * filled in the ring's colour when on, with the choice summed up below
 * ("Entre semana"). Each toggle is a 40px circle in a 44pt-wide column.
 */
export function RepeatDays({
  lang,
  value,
  onChange,
  color,
  labels,
  label,
}: {
  lang: Locale;
  value: number[];
  onChange: (days: number[]) => void;
  color: string;
  labels: RepeatLabels;
  /** Accessible name for the group, e.g. "Repetir KR1". */
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        type="multiple"
        aria-label={label}
        value={value.map(String)}
        onValueChange={(v) => onChange(v.map(Number).sort())}
        // spacing keeps the items apart (0 fuses them into one segmented bar)
        spacing={1}
        className="grid w-full grid-cols-7 gap-1"
      >
        {ALL_DAYS.map((d) => {
          const on = value.includes(d);
          return (
            <ToggleGroupItem
              key={d}
              value={String(d)}
              aria-label={dayName(lang, d, "short")}
              className="mx-auto size-10 rounded-full border font-condensed text-sm font-semibold uppercase data-[state=off]:border-white/10 data-[state=off]:text-neutral-400"
              style={
                on ? { backgroundColor: color, borderColor: color, color: "#0a0a0a" } : undefined
              }
            >
              {dayName(lang, d, "narrow")}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      <p className="font-condensed text-xs text-neutral-400 uppercase" aria-live="polite">
        {repeatSummary(lang, value, labels)}
      </p>
    </div>
  );
}
