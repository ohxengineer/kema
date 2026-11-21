import type { ReactNode } from "react";

import { StreakPill, type Streak, type StreakLabels } from "@/app/_components/app/streak-pill";

/**
 * [🔥 12] … [ TITLE ] … : the top row on the app's screens, the streak on
 * the left and the screen's title in the middle, in the Today screen's date
 * style but without a pill, since it isn't interactive.
 */
export function PageTopBar({
  streak,
  streakLabels,
  title,
  end,
}: {
  streak: Streak;
  streakLabels: StreakLabels;
  title: string;
  /** Optional content for the right-hand column. */
  end?: ReactNode;
}) {
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
      <StreakPill streak={streak} labels={streakLabels} className="justify-self-start" />
      {/* plain text, not a pill: the title isn't interactive */}
      <h1 className="font-condensed text-sm font-semibold tracking-wider whitespace-nowrap text-neutral-300 uppercase">
        {title}
      </h1>
      <div className="justify-self-end">{end}</div>
    </div>
  );
}
