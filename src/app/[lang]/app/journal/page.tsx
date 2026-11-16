import { notFound } from "next/navigation";

import { Journal } from "@/app/_components/app/journal";
import { sample } from "@/app/_lib/app-sample";
import { hasLocale } from "@/app/_lib/i18n";
import { getDictionary } from "../../dictionaries";

export default async function JournalPage({
  params,
}: PageProps<"/[lang]/app/journal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { app } = await getDictionary(lang);

  return <Journal lang={lang} entries={sample(lang).journal} labels={app.journal} />;
}
