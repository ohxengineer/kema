"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon, UsersIcon } from "@phosphor-icons/react";

import { useObjectives } from "@/app/_components/app/objectives-store";
import { glass, tabs } from "@/app/_components/landing/floating-nav";
import { cn } from "@/app/_lib/utils";
import type { Locale } from "@/app/_lib/i18n";

type Labels = {
  today: string;
  progress: string;
  journal: string;
  newGoal: string;
  share: string;
  shareText: string;
};

const paths = { today: "", progress: "/progress", journal: "/journal" } as const;

/**
 * The app's tab bar: the landing's floating pill, routing between screens,
 * with a share item at its end (Kema, for friends) and a round button beside
 * it to add a goal. Sized like the landing's touch
 * tab bar, per Apple's HIG for an iOS floating tab bar: the bar and the round
 * button are 60pt tall, each tab a 24pt glyph over a 10pt label, and every
 * touch target is at least 44×44pt.
 */
export function TabBar({ lang, labels }: { lang: Locale; labels: Labels }) {
  const pathname = usePathname();
  const { openCreate } = useObjectives();
  const tab =
    "flex h-full min-w-16 flex-col items-center justify-center gap-0.5 rounded-full px-3 font-condensed text-[10px] leading-none font-semibold uppercase whitespace-nowrap transition-colors";
  const idle = "text-neutral-300 hover:text-white";
  const round = cn(
    "flex size-[60px] shrink-0 items-center justify-center rounded-full text-neutral-200 transition-colors hover:text-white",
    glass,
  );

  // the system share sheet where there is one (phones), else copy the link
  const share = async () => {
    const url = `${window.location.origin}/${lang}`;
    try {
      if (navigator.share) await navigator.share({ title: "Kema", text: labels.shareText, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // closing the share sheet rejects too: nothing to do
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2">
      <nav className={cn("flex h-[60px] items-center rounded-full p-1", glass)}>
        {tabs.map(({ id, Icon, scale }) => {
          const href = `/${lang}/app${paths[id]}`;
          const active = pathname === href;
          return (
            <Link
              key={id}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(tab, active ? "bg-white/10 text-rose-500" : idle)}
            >
              <Icon weight="fill" className={cn("size-6", scale)} aria-hidden />
              {labels[id]}
            </Link>
          );
        })}
        {/* an action, not a screen: never shown as the current tab */}
        <button type="button" onClick={share} className={cn(tab, idle)}>
          <UsersIcon weight="fill" className="size-6" aria-hidden />
          {labels.share}
        </button>
      </nav>
      <button
        type="button"
        onClick={openCreate}
        aria-haspopup="dialog"
        aria-label={labels.newGoal}
        title={labels.newGoal}
        className={round}
      >
        <PlusIcon weight="bold" className="size-6" aria-hidden />
      </button>
    </div>
  );
}
