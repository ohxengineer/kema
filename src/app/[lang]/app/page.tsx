import { notFound } from "next/navigation";

import { TodayGoals } from "@/app/_components/app/today-goals";
import { sample } from "@/app/_lib/app-sample";
import { hasLocale } from "@/app/_lib/i18n";
import { getDictionary } from "../dictionaries";

export default async function TodayPage({ params }: PageProps<"/[lang]/app">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { app } = await getDictionary(lang);
  const data = sample(lang);

  return (
    <TodayGoals
      lang={lang}
      streak={{ current: data.streak, best: data.bestStreak }}
      streakLabels={app.streak}
      labels={app.today}
    />
  );
}
