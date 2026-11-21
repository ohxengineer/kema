import { notFound } from "next/navigation";
import { FireIcon, TrophyIcon } from "@phosphor-icons/react/ssr";

import { ObjectivesProgress } from "@/app/_components/app/objectives-progress";
import { PageTopBar } from "@/app/_components/app/top-bar";
import { YearPill } from "@/app/_components/app/year-pill";
import { sample } from "@/app/_lib/app-sample";
import { hasLocale } from "@/app/_lib/i18n";
import { cn } from "@/app/_lib/utils";
import { getDictionary } from "../../dictionaries";

const percent = (share: number) => `${Math.round(share * 100)}%`;

export default async function ProgressPage({ params }: PageProps<"/[lang]/app/progress">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { app } = await getDictionary(lang);
  const t = app.progress;
  const data = sample(lang);

  const past = data.week.filter((v): v is number => v !== null);
  const completion = past.reduce((sum, v) => sum + v, 0) / past.length;
  const today = past.length - 1;

  return (
    <>
      <PageTopBar
        streak={{ current: data.streak, best: data.bestStreak }}
        streakLabels={app.streak}
        title={t.title}
        end={<YearPill lang={lang} goals={data.goals} labels={t.year} />}
      />

      <section className="grid grid-cols-2 gap-3">
        {[
          { label: t.streak, value: data.streak, Icon: FireIcon },
          { label: t.best, value: data.bestStreak, Icon: TrophyIcon },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border bg-neutral-900 p-4">
            <Icon weight="fill" className="size-5 text-rose-500" aria-hidden />
            <p className="font-condensed text-4xl leading-none font-bold tabular-nums">
              {value}{" "}
              <span className="font-condensed text-sm font-semibold text-neutral-400 uppercase">
                {t.days}
              </span>
            </p>
            <p className="font-condensed text-xs text-neutral-400 uppercase">{label}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border bg-neutral-900 p-4">
        <div className="flex items-start justify-between">
          <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
            {t.week}
          </h2>
          {/* completion in the big condensed style of the habit cards' percentage */}
          <p className="flex flex-col items-end leading-none">
            <span className="font-condensed text-3xl font-bold text-rose-500 tabular-nums">
              {percent(completion)}
            </span>
            <span className="pt-1 font-condensed text-xs tracking-wider text-neutral-400 uppercase">
              {t.completion}
            </span>
          </p>
        </div>
        <div className="grid h-32 grid-cols-7 items-end gap-2">
          {data.week.map((value, day) => (
            <div key={day} className="flex h-full flex-col items-center justify-end gap-1.5">
              {value === null ? (
                <div className="size-full rounded-md border border-dashed border-white/15" />
              ) : (
                <div
                  className={cn(
                    "w-full rounded-md",
                    // the primary rose fading to a dusky plum: full for today, faded for the rest
                    "bg-linear-to-b from-rose-500 to-[#7a3a5e]",
                    day !== today && "opacity-35",
                  )}
                  style={{ height: `${Math.max(value, 0.06) * 100}%` }}
                  title={percent(value)}
                />
              )}
              <span
                className={cn(
                  "font-condensed text-xs uppercase",
                  day === today ? "text-rose-500" : "text-neutral-500",
                )}
              >
                {t.weekdays[day]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* each objective as a habit card: recent weeks or a month, day by day */}
      <ObjectivesProgress
        lang={lang}
        labels={{
          title: t.goals,
          recent: t.recent,
          addObjective: app.today.addObjective,
          filters: app.today.filters,
          heatmap: t.heatmap,
          objective: app.today.objective,
          close: app.today.kr.close,
        }}
      />
    </>
  );
}
