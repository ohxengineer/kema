"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpenUserIcon,
  QrCodeIcon,
  StepsIcon,
  SunHorizonIcon,
} from "@phosphor-icons/react";

import { cn } from "@/app/_lib/utils";
import type { Locale } from "@/app/_lib/i18n";

type Labels = { today: string; progress: string; journal: string; download: string };

// `scale` optically balances glyphs that look smaller than their box (e.g. the
// wide, short sun horizon) without changing layout or label alignment
export const tabs = [
  { id: "today", Icon: SunHorizonIcon, scale: "scale-[1.3]" },
  { id: "progress", Icon: StepsIcon, scale: "" },
  { id: "journal", Icon: BookOpenUserIcon, scale: "" },
] as const;

// Frosted "liquid glass" surface shared by the tab bar and the download button
export const glass =
  "border border-white/10 bg-neutral-900/75 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl shadow-black/50 ring-1 ring-inset ring-white/5";

// A round glass button as tall as the tab bar: 60pt on touch, 36px with a mouse
const roundButton = cn(
  "flex size-[60px] shrink-0 items-center justify-center gap-1.5 rounded-full font-condensed text-xs font-semibold text-neutral-200 uppercase transition-colors hover:text-white md:pointer-fine:size-11 md:pointer-fine:text-sm",
  glass,
);

/**
 * Follows Apple's Human Interface Guidelines for tab bars:
 *
 * Touch screens (phones and tablets): an iOS-style floating tab bar, 60pt
 * tall, each tab a 24pt glyph over a 10pt label with a hit area of at least
 * 44×44pt, beside a round download button of the same height. One accent
 * tint marks the selected tab.
 *
 * Mouse and trackpad (`pointer-fine`, from md): a compact bar across the
 * bottom, like the header across the top, with the tabs on the left (icon
 * beside label) and the labelled download button on the right. Touch
 * devices never get it, so iPads keep the 44pt targets.
 */
export default function FloatingNav({ lang, labels }: { lang: Locale; labels: Labels }) {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("today");

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 md:pointer-fine:inset-x-4 md:pointer-fine:translate-x-0 md:pointer-fine:justify-between">
      <nav className={cn("flex h-[60px] items-center rounded-full p-1 md:pointer-fine:h-11", glass)}>
        {tabs.map(({ id, Icon, scale }) => {
          const isActive = id === active;
          return (
            <Link
              key={id}
              href={`/${lang}#${id}`}
              onClick={() => setActive(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-full min-w-16 flex-col items-center justify-center gap-0.5 rounded-full px-3 font-condensed text-[10px] leading-none font-semibold uppercase whitespace-nowrap transition-colors md:pointer-fine:min-w-0 md:pointer-fine:flex-row md:pointer-fine:gap-2 md:pointer-fine:px-4 md:pointer-fine:text-sm",
                isActive
                  ? "bg-white/10 text-rose-500"
                  : "text-neutral-300 hover:text-white",
              )}
            >
              <Icon weight="fill" className={cn("size-6 md:pointer-fine:size-5", scale)} aria-hidden />
              {labels[id]}
            </Link>
          );
        })}
      </nav>
      <Link
        href={`/${lang}#download`}
        aria-label={labels.download}
        title={labels.download}
        className={cn(roundButton, "md:pointer-fine:w-auto md:pointer-fine:gap-2 md:pointer-fine:px-5")}
      >
        <QrCodeIcon weight="fill" className="size-6 md:pointer-fine:size-5" aria-hidden />
        <span className="hidden md:pointer-fine:inline">{labels.download}</span>
      </Link>
    </div>
  );
}
