"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { glass, tabs } from "@/app/_components/landing/floating-nav";
import { cn } from "@/app/_lib/utils";
import type { Locale } from "@/app/_lib/i18n";

type Labels = { today: string; progress: string; journal: string };

const paths = { today: "", progress: "/progress", journal: "/journal" } as const;

/** The app's tab bar: the landing's floating pill, routing between screens. */
export function TabBar({ lang, labels }: { lang: Locale; labels: Labels }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center rounded-full p-1",
        glass,
      )}
    >
      {tabs.map(({ id, Icon, scale }) => {
        const href = `/${lang}/app${paths[id]}`;
        const active = pathname === href;
        return (
          <Link
            key={id}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-20 flex-col items-center gap-0.5 rounded-full px-4 py-1.5 font-condensed text-xs font-semibold uppercase whitespace-nowrap transition-colors",
              active ? "bg-white/10 text-rose-500" : "text-neutral-300 hover:text-white",
            )}
          >
            <Icon weight="fill" className={cn("size-6", scale)} aria-hidden />
            {labels[id]}
          </Link>
        );
      })}
    </nav>
  );
}
