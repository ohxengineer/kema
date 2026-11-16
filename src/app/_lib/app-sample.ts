import type { Locale } from "@/app/_lib/i18n";

/**
 * Sample data for designing the app, until there is a real backend. The
 * goals echo the landing's photos: running, reading, swimming, piano.
 */

export type GoalKind = "physical" | "mental";
export type Goal = {
  id: string;
  title: string;
  target: string;
  kind: GoalKind;
  /** Share of the goal met so far this week, 0–1. */
  week: number;
  doneToday: boolean;
};
export type Mood = "great" | "good" | "meh" | "hard";
export type JournalEntry = { id: string; date: string; mood: Mood; text: string };

const goals: Record<Locale, Goal[]> = {
  es: [
    { id: "run", title: "Correr", target: "5 km", kind: "physical", week: 0.6, doneToday: true },
    { id: "read", title: "Leer", target: "20 páginas", kind: "mental", week: 0.85, doneToday: true },
    { id: "swim", title: "Nadar", target: "30 min", kind: "physical", week: 0.4, doneToday: false },
    { id: "piano", title: "Practicar piano", target: "30 min", kind: "mental", week: 0.7, doneToday: false },
    { id: "meditate", title: "Meditar", target: "10 min", kind: "mental", week: 1, doneToday: false },
  ],
  en: [
    { id: "run", title: "Run", target: "5 km", kind: "physical", week: 0.6, doneToday: true },
    { id: "read", title: "Read", target: "20 pages", kind: "mental", week: 0.85, doneToday: true },
    { id: "swim", title: "Swim", target: "30 min", kind: "physical", week: 0.4, doneToday: false },
    { id: "piano", title: "Practice piano", target: "30 min", kind: "mental", week: 0.7, doneToday: false },
    { id: "meditate", title: "Meditate", target: "10 min", kind: "mental", week: 1, doneToday: false },
  ],
};

const journal: Record<Locale, JournalEntry[]> = {
  es: [
    { id: "3", date: "2026-11-14", mood: "great", text: "Primera vez que corro 5 km sin parar. Las piernas pesaban al final, pero la cabeza estaba ligera." },
    { id: "2", date: "2026-11-13", mood: "meh", text: "No nadé: llegué tarde del trabajo. Mañana temprano, antes de abrir el correo." },
    { id: "1", date: "2026-11-12", mood: "good", text: "Terminé el capítulo que tenía pendiente y practiqué la escala nueva en el piano." },
  ],
  en: [
    { id: "3", date: "2026-11-14", mood: "great", text: "First time running 5 km without stopping. Heavy legs at the end, light head." },
    { id: "2", date: "2026-11-13", mood: "meh", text: "Skipped the swim: got home late. Tomorrow early, before opening email." },
    { id: "1", date: "2026-11-12", mood: "good", text: "Finished the chapter I owed myself and practiced the new scale on the piano." },
  ],
};

export const sample = (locale: Locale) => ({
  goals: goals[locale],
  journal: journal[locale],
  streak: 12,
  bestStreak: 21,
  /** Share of goals met each day this week, Monday first; null is still ahead. */
  week: [0.8, 1, 0.6, 0.4, 1, 0.4, null] as (number | null)[],
});
