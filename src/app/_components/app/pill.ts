import { cn } from "@/app/_lib/utils";

/** The app's top-row pills: streak, day, week. */
export const pill =
  "flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 font-condensed text-base font-semibold whitespace-nowrap text-neutral-300 uppercase";

/** The middle pill holds the day: smaller, spaced out. */
export const titlePill = cn(pill, "px-3 text-sm tracking-wider");
