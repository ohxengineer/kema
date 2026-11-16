"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/_lib/utils";
import { locales, type Locale } from "@/app/_lib/i18n";

export default function LocaleSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname();

  // Swap only the locale segment so the visitor stays on the same page
  const hrefFor = (locale: Locale) => {
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  };

  return (
    <nav
      aria-label={label}
      className="flex items-center gap-1 font-condensed uppercase font-medium"
    >
      {locales.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span className="text-neutral-700">/</span>}
          <Link
            href={hrefFor(locale)}
            hrefLang={locale}
            aria-current={locale === current ? "true" : undefined}
            className={cn(
              "transition-colors",
              locale === current ? "text-rose-500" : "text-neutral-500 hover:text-neutral-300",
            )}
          >
            {locale}
          </Link>
        </span>
      ))}
    </nav>
  );
}
