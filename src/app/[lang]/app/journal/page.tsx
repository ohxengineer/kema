import { notFound } from "next/navigation";

import { Journal } from "@/app/_components/app/journal";
import { PageTopBar } from "@/app/_components/app/top-bar";
import { sample } from "@/app/_lib/app-sample";
import { hasLocale } from "@/app/_lib/i18n";
import { getDictionary } from "../../dictionaries";

export default async function JournalPage({ params }: PageProps<"/[lang]/app/journal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { app } = await getDictionary(lang);

  const data = sample(lang);

  return (
    <>
      <PageTopBar
        streak={{ current: data.streak, best: data.bestStreak }}
        streakLabels={app.streak}
        title={app.journal.title}
      />
      <Journal lang={lang} entries={data.journal} labels={app.journal} />
    </>
  );
}
