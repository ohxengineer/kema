import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CreateObjectiveDialog } from "@/app/_components/app/create-objective-dialog";
import { ObjectivesProvider } from "@/app/_components/app/objectives-store";
import { TabBar } from "@/app/_components/app/tab-bar";
import { sample } from "@/app/_lib/app-sample";
import { hasLocale } from "@/app/_lib/i18n";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({ params }: LayoutProps<"/[lang]/app">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { app } = await getDictionary(lang);
  // a design route for now: keep it out of search
  return { title: app.metadata.title, robots: { index: false } };
}

/**
 * The app shell: phone first, and a phone-wide column on larger screens so
 * the design reads the same everywhere.
 */
export default async function AppLayout({ children, params }: LayoutProps<"/[lang]/app">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const data = sample(lang);

  return (
    <ObjectivesProvider initialObjectives={data.objectives} initialGoals={data.goals}>
      <div className="relative isolate mx-auto flex min-h-dvh max-w-md flex-col">
        <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-28">{children}</main>
        <TabBar
          lang={lang}
          labels={{
            ...dict.nav,
            newGoal: dict.app.newGoal,
            share: dict.app.share,
            shareText: dict.app.shareText,
          }}
        />
      </div>
      <CreateObjectiveDialog lang={lang} labels={dict.app.create} />
    </ObjectivesProvider>
  );
}
