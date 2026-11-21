import type { Locale } from "@/app/_lib/i18n";

export type RepeatLabels = { everyDay: string; weekdays: string; weekends: string; never: string };

/** Day indexes, 0 = Monday … 6 = Sunday. */
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** A day's name in the locale: "narrow" for the toggles, "short" for summaries. */
export function dayName(lang: Locale, day: number, width: "narrow" | "short") {
  // 2026-01-05 is a Monday
  return new Intl.DateTimeFormat(lang, { weekday: width })
    .format(new Date(2026, 0, 5 + day))
    .replace(".", "");
}

/**
 * Repeat days summed up the way Apple's Clock does: "Todos los días",
 * "Entre semana", "Fines de semana", or the days themselves ("lun, mié, vie").
 */
export function repeatSummary(lang: Locale, days: number[], labels: RepeatLabels) {
  const set = [...new Set(days)].sort();
  const is = (list: number[]) => set.length === list.length && list.every((d) => set.includes(d));
  if (set.length === 0) return labels.never;
  if (is(ALL_DAYS)) return labels.everyDay;
  if (is([0, 1, 2, 3, 4])) return labels.weekdays;
  if (is([5, 6])) return labels.weekends;
  return set.map((d) => dayName(lang, d, "short")).join(", ");
}
