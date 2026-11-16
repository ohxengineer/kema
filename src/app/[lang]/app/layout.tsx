import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { UserIcon } from "@phosphor-icons/react/ssr";

import { TabBar } from "@/app/_components/app/tab-bar";
import { Badge } from "@/app/_components/ui/badge";
import { hasLocale } from "@/app/_lib/i18n";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/app">): Promise<Metadata> {
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
export default async function AppLayout({
  children,
  params,
}: LayoutProps<"/[lang]/app">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-neutral-950/80 p-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Image src="/KEMA.svg" width={80} height={17} alt="Kema" />
          <Badge>BETA</Badge>
        </div>
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-500"
        >
          <UserIcon weight="fill" className="size-4" />
        </span>
      </header>
      <main className="flex flex-1 flex-col gap-6 px-4 pt-2 pb-28">{children}</main>
      <TabBar lang={lang} labels={dict.nav} />
    </div>
  );
}
