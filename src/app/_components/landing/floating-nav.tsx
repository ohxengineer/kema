"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpenUserIcon,
  PlantIcon,
  QrCodeIcon,
  SunHorizonIcon,
} from "@phosphor-icons/react";

import { cn } from "@/app/_lib/utils";
import type { Locale } from "@/app/_lib/i18n";

type Labels = { today: string; progress: string; journal: string; download: string };

// `scale` optically balances glyphs that look smaller than their box (e.g. the
// wide, short sun horizon) without changing layout or label alignment
export const tabs = [
  { id: "today", Icon: SunHorizonIcon, scale: "scale-[1.3]" },
  { id: "progress", Icon: PlantIcon, scale: "" },
  { id: "journal", Icon: BookOpenUserIcon, scale: "" },
] as const;

// Frosted "liquid glass" surface shared by the tab bar and the download button
export const glass =
  "border border-white/10 bg-neutral-900/75 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl shadow-black/50 ring-1 ring-inset ring-white/5";

/**
 * Phones: one centred pill of stacked tabs (icon over label) beside a round
 * download button. Desktop: a bar across the bottom, like the header across
 * the top, with the tabs on the left (icon beside label) and the download
 * button, now labelled, on the right.
 */
export default function FloatingNav({ lang, labels }: { lang: Locale; labels: Labels }) {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("today");

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 md:inset-x-4 md:translate-x-0 md:justify-between">
      <nav className={cn("flex items-center rounded-full p-1 md:h-[42px]", glass)}>
        {tabs.map(({ id, Icon, scale }) => {
          const isActive = id === active;
          return (
            <Link
              key={id}
              href={`/${lang}#${id}`}
              onClick={() => setActive(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-16 flex-col items-center gap-0.5 rounded-full px-4 py-1.5 font-condensed text-xs font-semibold uppercase whitespace-nowrap transition-colors md:h-full md:min-w-0 md:flex-row md:gap-2 md:px-4 md:py-0 md:text-sm",
                isActive
                  ? "bg-white/10 text-rose-500"
                  : "text-neutral-300 hover:text-white",
              )}
            >
              <Icon weight="fill" className={cn("size-6 md:size-5", scale)} aria-hidden />
              {labels[id]}
            </Link>
          );
        })}
      </nav>
      <Link
        href={`/${lang}#download`}
        aria-label={labels.download}
        title={labels.download}
        className={cn(
          "flex size-16 shrink-0 items-center justify-center gap-2 rounded-full font-condensed text-sm font-semibold text-neutral-200 uppercase transition-colors hover:text-white md:h-[42px] md:w-auto md:px-5",
          glass,
        )}
      >
        <QrCodeIcon weight="fill" className="size-6 md:size-5" aria-hidden />
        <span className="hidden md:inline">{labels.download}</span>
      </Link>
    </div>
  );
}
