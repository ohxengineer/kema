import "server-only";

import type { Locale } from "@/app/_lib/i18n";
import type es from "./dictionaries/es.json";

// Spanish is the source of truth: every locale must provide the same keys
export type Dictionary = typeof es;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  es: () => import("./dictionaries/es.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
