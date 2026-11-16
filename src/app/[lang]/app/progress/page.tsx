import { notFound } from "next/navigation";
import { FireIcon, TrophyIcon } from "@phosphor-icons/react/ssr";

import { sample } from "@/app/_lib/app-sample";
import { hasLocale } from "@/app/_lib/i18n";
import { cn } from "@/app/_lib/utils";
import { getDictionary } from "../../dictionaries";

const percent = (share: number) => `${Math.round(share * 100)}%`;

export default async function ProgressPage({
  params,
}: PageProps<"/[lang]/app/progress">) {
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
      <h1 className="text-4xl font-black tracking-tight uppercase">{t.title}</h1>

      <section className="grid grid-cols-2 gap-3">
        {[
          { label: t.streak, value: data.streak, Icon: FireIcon },
          { label: t.best, value: data.bestStreak, Icon: TrophyIcon },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border bg-neutral-900 p-4">
            <Icon weight="fill" className="size-5 text-rose-500" aria-hidden />
            <p className="text-3xl leading-none font-black">
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
        <div className="flex items-baseline justify-between">
          <h2 className="font-condensed text-sm font-semibold uppercase">{t.week}</h2>
          <p className="font-condensed text-xs text-neutral-400 uppercase">
            {t.completion} <span className="text-rose-500">{percent(completion)}</span>
          </p>
        </div>
        <div className="grid h-32 grid-cols-7 items-end gap-2">
          {data.week.map((value, day) => (
            <div key={day} className="flex h-full flex-col items-center justify-end gap-1.5">
              {value === null ? (
                <div className="h-full w-full rounded-md border border-dashed border-white/15" />
              ) : (
                <div
                  className={cn(
                    "w-full rounded-md",
                    day === today ? "bg-rose-500" : "bg-white/15",
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

      <section className="flex flex-col gap-3">
        <h2 className="font-condensed text-sm font-semibold uppercase">{t.goals}</h2>
        <ul className="flex flex-col gap-2">
          {data.goals.map((goal) => (
            <li key={goal.id} className="flex flex-col gap-2 rounded-xl border bg-neutral-900 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{goal.title}</span>
                <span className="font-condensed text-sm text-neutral-400">
                  {percent(goal.week)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full",
                    goal.week >= 1 ? "bg-rose-500" : "bg-rose-500/60",
                  )}
                  style={{ width: percent(goal.week) }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
